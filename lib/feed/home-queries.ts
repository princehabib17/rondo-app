import type { SupabaseClient } from "@supabase/supabase-js";
import type { Game, Tournament } from "@/lib/supabase/types";
import { GAME_LIST_SELECT_BASE, GAME_LIST_SELECT_WITH_ORG } from "@/lib/supabase/game-queries";

export type HomeNextUp =
  | { kind: "game"; game: Game }
  | { kind: "tournament"; tournament: Tournament }
  | null;

export type RecentMatchRow = {
  id: string;
  game: Pick<Game, "id" | "title" | "venue_name" | "date_time" | "price_per_player" | "status">;
};

/**
 * Soonest thing that belongs to the signed-in player: an upcoming joined match,
 * else an open/live tournament they are rostered on. Guests get null.
 */
export async function fetchHomeNextUp(
  supabase: SupabaseClient,
  userId: string | null
): Promise<HomeNextUp> {
  if (!userId) return null;
  const now = new Date().toISOString();

  const runGames = async (select: string) =>
    supabase
      .from("games")
      .select(select)
      .eq("game_players.user_id", userId)
      .gte("date_time", now)
      .neq("status", "cancelled")
      .order("date_time", { ascending: true })
      .limit(1);

  const withOrg = await runGames(`${GAME_LIST_SELECT_WITH_ORG}, game_players!inner(user_id)`);
  const gameRows =
    !withOrg.error && withOrg.data
      ? (withOrg.data as unknown as Game[])
      : ((await runGames(`${GAME_LIST_SELECT_BASE}, game_players!inner(user_id)`)).data as
          | Game[]
          | null) ?? [];

  if (gameRows[0]) return { kind: "game", game: gameRows[0] };

  const { data: memberships } = await supabase
    .from("tournament_team_members")
    .select("tournament:tournaments(*)")
    .eq("user_id", userId)
    .limit(24);

  const { data: captaincies } = await supabase
    .from("tournament_teams")
    .select("tournament:tournaments(*)")
    .eq("captain_id", userId)
    .eq("status", "registered")
    .eq("is_managed", false)
    .limit(12);

  const tournaments = [
    ...(((memberships as { tournament: Tournament | null }[] | null) ?? [])
      .map((row) => row.tournament)
      .filter(Boolean) as Tournament[]),
    ...(((captaincies as { tournament: Tournament | null }[] | null) ?? [])
      .map((row) => row.tournament)
      .filter(Boolean) as Tournament[]),
  ];

  const upcoming = tournaments
    .filter((t) => t.status === "active" || t.status === "registration")
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());

  if (upcoming[0]) return { kind: "tournament", tournament: upcoming[0] };
  return null;
}

/** Distinct tournaments the player is fighting in (active or open). */
export async function fetchYourTournaments(
  supabase: SupabaseClient,
  userId: string | null
): Promise<Tournament[]> {
  if (!userId) return [];

  const [{ data: memberships }, { data: captaincies }] = await Promise.all([
    supabase
      .from("tournament_team_members")
      .select("tournament:tournaments(*, tournament_teams(id, status))")
      .eq("user_id", userId)
      .limit(24),
    supabase
      .from("tournament_teams")
      .select("tournament:tournaments(*, tournament_teams(id, status))")
      .eq("captain_id", userId)
      .eq("status", "registered")
      .eq("is_managed", false)
      .limit(12),
  ]);

  const seen = new Set<string>();
  const out: Tournament[] = [];
  for (const row of [
    ...((memberships as { tournament: Tournament | null }[] | null) ?? []),
    ...((captaincies as { tournament: Tournament | null }[] | null) ?? []),
  ]) {
    const t = row.tournament;
    if (!t || seen.has(t.id)) continue;
    if (t.status !== "active" && t.status !== "registration") continue;
    seen.add(t.id);
    out.push(t);
  }

  return out.sort((a, b) => {
    if (a.status !== b.status) return a.status === "active" ? -1 : 1;
    return new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime();
  });
}

/** Open or live tournaments around the product surface (city-agnostic for v1). */
export async function fetchAroundYouTournaments(
  supabase: SupabaseClient,
  excludeIds: string[] = []
): Promise<Tournament[]> {
  const { data } = await supabase
    .from("tournaments")
    .select("*, tournament_teams(id, status)")
    .in("status", ["active", "registration"])
    .order("starts_at", { ascending: true })
    .limit(8);

  const rows = (data as Tournament[]) ?? [];
  const exclude = new Set(excludeIds);
  return rows.filter((t) => !exclude.has(t.id)).slice(0, 3);
}

/** Last completed pickup matches the player joined. */
export async function fetchRecentMatches(
  supabase: SupabaseClient,
  userId: string | null
): Promise<RecentMatchRow[]> {
  if (!userId) return [];

  const { data } = await supabase
    .from("game_players")
    .select("id, game:games(id, title, venue_name, date_time, price_per_player, status)")
    .eq("user_id", userId)
    .order("joined_at", { ascending: false })
    .limit(20);

  const now = Date.now();
  const rows = ((data as RecentMatchRow[] | null) ?? []).filter((row) => {
    if (!row.game) return false;
    const past = new Date(row.game.date_time).getTime() < now;
    return past || row.game.status === "completed";
  });

  return rows.slice(0, 3);
}
