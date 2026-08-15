import type { SupabaseClient } from "@supabase/supabase-js";
import type { Tournament, TournamentMatch, TournamentTeam } from "@/lib/supabase/types";
import { computeChampion } from "@/lib/tournament/bracket";

export interface ChampionSummary {
  name: string;
  detail: string | null;
}

/**
 * Champion name + score line for a batch of completed tournaments, computed
 * straight from their teams and matches. Deliberately doesn't read the
 * tournament_awards snapshot: that table only rows a champion for tournaments
 * with an awardable (rostered or self-registered) captain, so an
 * organizer-managed champion team with an empty roster would otherwise never
 * show a winner on its card.
 */
export async function fetchTournamentChampions(
  supabase: SupabaseClient,
  tournaments: Pick<Tournament, "id" | "format">[]
): Promise<Map<string, ChampionSummary>> {
  const map = new Map<string, ChampionSummary>();
  const ids = tournaments.map((t) => t.id);
  if (ids.length === 0) return map;

  const [{ data: teamRows }, { data: matchRows }] = await Promise.all([
    supabase
      .from("tournament_teams")
      .select("id, tournament_id, name")
      .in("tournament_id", ids)
      .eq("status", "registered"),
    supabase
      .from("tournament_matches")
      .select("tournament_id, round, home_team_id, away_team_id, home_score, away_score, status")
      .in("tournament_id", ids),
  ]);

  const teams = (teamRows as (Pick<TournamentTeam, "id" | "name"> & { tournament_id: string })[]) ?? [];
  const matches = (matchRows as (Pick<TournamentMatch, "round" | "home_team_id" | "away_team_id" | "home_score" | "away_score" | "status"> & { tournament_id: string })[]) ?? [];

  for (const tournament of tournaments) {
    const champion = computeChampion(
      tournament.format,
      teams.filter((t) => t.tournament_id === tournament.id),
      matches.filter((m) => m.tournament_id === tournament.id)
    );
    if (champion) map.set(tournament.id, { name: champion.name, detail: champion.detail });
  }
  return map;
}
