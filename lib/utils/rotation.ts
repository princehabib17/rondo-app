import type { Team, RotationRound } from "@/lib/supabase/types";

/**
 * Generates a round-robin rotation schedule for a given list of teams.
 * Uses the "circle method" so each pair plays once.
 */
export function generateRotationSchedule(teams: Team[]): RotationRound[] {
  const rounds: RotationRound[] = [];
  const n = teams.length;

  if (n < 2) return rounds;

  // Make a copy; if odd number of teams, add a dummy "bye" team
  const list = [...teams];
  if (list.length % 2 !== 0) {
    list.push({ id: "bye", name: "BYE", color: "#666", slot_number: n + 1, game_id: "", created_at: "" });
  }

  const numRounds = list.length - 1;
  const half = list.length / 2;

  for (let round = 0; round < numRounds; round++) {
    for (let match = 0; match < half; match++) {
      const teamA = list[match];
      const teamB = list[list.length - 1 - match];

      // Skip byes
      if (teamA.id !== "bye" && teamB.id !== "bye") {
        rounds.push({
          round: rounds.length + 1,
          team_a_id: teamA.id,
          team_b_id: teamB.id,
          team_a_name: teamA.name,
          team_b_name: teamB.name,
        });
      }
    }

    // Rotate: fix first element, rotate the rest
    const last = list[list.length - 1];
    for (let i = list.length - 1; i > 1; i--) {
      list[i] = list[i - 1];
    }
    list[1] = last;
  }

  return rounds;
}
