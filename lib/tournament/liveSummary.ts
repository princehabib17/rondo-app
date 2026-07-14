import type { SupabaseClient } from "@supabase/supabase-js";
import type { Tournament, TournamentMatch } from "@/lib/supabase/types";
import { computeLiveSummary, type LiveSummary } from "@/lib/tournament/bracket";

/**
 * Real round/progress info for a batch of active tournaments, so a live
 * card can say "Semifinals" or "3/6 played" instead of the literal word
 * "Live" with nothing behind it.
 */
export async function fetchTournamentLiveSummaries(
  supabase: SupabaseClient,
  tournaments: Pick<Tournament, "id" | "format">[],
  teamCounts: Map<string, number>
): Promise<Map<string, LiveSummary>> {
  const map = new Map<string, LiveSummary>();
  const ids = tournaments.map((t) => t.id);
  if (ids.length === 0) return map;

  const { data } = await supabase
    .from("tournament_matches")
    .select("tournament_id, round, status")
    .in("tournament_id", ids);

  const matches = (data as (Pick<TournamentMatch, "round" | "status"> & { tournament_id: string })[]) ?? [];

  for (const tournament of tournaments) {
    const summary = computeLiveSummary(
      tournament.format,
      teamCounts.get(tournament.id) ?? 0,
      matches.filter((m) => m.tournament_id === tournament.id)
    );
    if (summary) map.set(tournament.id, summary);
  }
  return map;
}
