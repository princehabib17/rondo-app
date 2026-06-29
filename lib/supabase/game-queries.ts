import type { SupabaseClient } from "@supabase/supabase-js";
import type { Game } from "@/lib/supabase/types";

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

function applyOpenGameFilters<T extends { eq: Function; gte: Function; order: Function }>(
  query: T,
  now: string
) {
  return query.eq("status", "open").gte("date_time", now).order("date_time", { ascending: true });
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

  const run = async (select: string) => {
    let query = supabase.from("games").select(select);
    query = applyOpenGameFilters(query, now);
    return query.range(from, to);
  };

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
