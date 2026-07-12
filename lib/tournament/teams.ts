import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Inserts a tournament team with the next free team number. Numbers are
 * assigned in registration order and are stable for the tournament's life,
 * so scores/goals can be pinned against "Team 4" even on a printed sheet.
 *
 * Two concurrent registrations can race for the same number; the unique
 * (tournament_id, team_number) index rejects the loser and we retry.
 */
export async function insertTeamWithNumber(
  service: SupabaseClient,
  input: {
    tournamentId: string;
    captainId: string;
    name: string;
    isManaged?: boolean;
  }
): Promise<{ teamId?: string; teamNumber?: number; errorCode?: string; errorMessage?: string }> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data: last } = await service
      .from("tournament_teams")
      .select("team_number")
      .eq("tournament_id", input.tournamentId)
      .order("team_number", { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle();

    const teamNumber = (last?.team_number ?? 0) + 1;
    const { data: team, error } = await service
      .from("tournament_teams")
      .insert({
        tournament_id: input.tournamentId,
        captain_id: input.captainId,
        name: input.name,
        team_number: teamNumber,
        is_managed: input.isManaged ?? false,
      })
      .select("id")
      .single();

    if (!error) {
      return { teamId: team?.id, teamNumber };
    }
    // Retry only when the collision is on the number, not the name/captain.
    if (error.code === "23505" && error.message.includes("team_number")) {
      continue;
    }
    return { errorCode: error.code, errorMessage: error.message };
  }
  return { errorCode: "conflict", errorMessage: "Could not assign a team number, try again" };
}
