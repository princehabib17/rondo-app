import type { SupabaseClient } from "@supabase/supabase-js";
import type { Game } from "@/lib/supabase/types";
import { PUBLIC_PROFILE_SELECT } from "@/lib/supabase/profile-select";

/** Match screen select. Shared so the server render and the client refresh stay in sync. */
export const GAME_DETAIL_SELECT = `
  *,
  organizer:profiles!organizer_id(${PUBLIC_PROFILE_SELECT}),
  teams(id, name, color, slot_number,
    game_players:game_players(id, user_id, profile:profiles(id, avatar_url, nationality))
  ),
  game_players(id, user_id, team_id, payment_status)
`;

/** Core fields used across feed, map, and lists. */
export const GAME_LIST_SELECT_BASE =
  "*, organizer:profiles!organizer_id(id,full_name,avatar_url), game_players(id)";

/** Extended select when organizations migration is applied. */
export const GAME_LIST_SELECT_WITH_ORG = `${GAME_LIST_SELECT_BASE}, organization:organizations(id,name,slug,logo_url,verified,created_by)`;

export interface OpenGamesQuery {
  from?: number;
  to?: number;
  limit?: number;
}

/**
 * Fetches open games, falling back when optional relations (e.g. organizations) are missing.
 */
export async function fetchOpenGames(
  supabase: SupabaseClient,
  options: OpenGamesQuery = {}
): Promise<Game[]> {
  const now = new Date().toISOString();
  const from = options.from ?? 0;
  const to = options.to ?? (options.limit != null ? options.limit - 1 : 19);

  const run = async (select: string) =>
    supabase
      .from("games")
      .select(select)
      .eq("status", "open")
      .gte("date_time", now)
      .order("date_time", { ascending: true })
      .range(from, to);

  const extended = await run(GAME_LIST_SELECT_WITH_ORG);
  if (!extended.error && extended.data) {
    return extended.data as unknown as Game[];
  }

  const basic = await run(GAME_LIST_SELECT_BASE);
  if (basic.error) {
    console.error("fetchOpenGames failed:", basic.error.message);
    return [];
  }

  return (basic.data as unknown as Game[]) ?? [];
}
