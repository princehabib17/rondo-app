import type { TournamentMatch } from "@/lib/supabase/types";

/** A fixture slot produced by the generators, before it is persisted. */
export interface FixtureSlot {
  round: number; // 1-based; for round robin this is the matchday
  position: number; // 0-based within the round
  homeTeamId: string | null;
  awayTeamId: string | null;
  /** Single elimination only: one side got a free pass into the next round. */
  isBye: boolean;
}

export interface StandingsRow {
  teamId: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export function nextPowerOfTwo(n: number): number {
  let size = 1;
  while (size < n) size *= 2;
  return size;
}

/**
 * Bracket slot order for a power-of-two bracket so that, on seed, the top
 * seeds can only meet in the latest possible round (1 vs 2 in the final).
 * Returns 1-based seed numbers in slot order, e.g. size 4 -> [1, 4, 3, 2].
 */
export function seedOrder(size: number): number[] {
  let order = [1];
  while (order.length < size) {
    const mirror = order.length * 2 + 1;
    const next: number[] = [];
    for (const seed of order) {
      next.push(seed, mirror - seed);
    }
    order = next;
  }
  return order;
}

/**
 * Generates every match of a single-elimination bracket. Teams are seeded in
 * the order given. When the field is not a power of two, top seeds receive
 * byes: the round-1 slot is marked `isBye` and the team is pre-placed into
 * its round-2 slot.
 */
export function generateSingleElimination(teamIds: string[]): FixtureSlot[] {
  if (teamIds.length < 2) {
    throw new Error("Need at least 2 teams");
  }
  const bracketSize = nextPowerOfTwo(teamIds.length);
  const slots = seedOrder(bracketSize).map(
    (seed) => teamIds[seed - 1] ?? null
  );

  const fixtures: FixtureSlot[] = [];
  const totalRounds = Math.log2(bracketSize);
  for (let round = 1; round <= totalRounds; round++) {
    const matchCount = bracketSize / 2 ** round;
    for (let position = 0; position < matchCount; position++) {
      fixtures.push({ round, position, homeTeamId: null, awayTeamId: null, isBye: false });
    }
  }

  const fixtureAt = (round: number, position: number) =>
    fixtures.find((f) => f.round === round && f.position === position)!;

  for (let position = 0; position < bracketSize / 2; position++) {
    const fixture = fixtureAt(1, position);
    fixture.homeTeamId = slots[position * 2];
    fixture.awayTeamId = slots[position * 2 + 1];
    const lone = fixture.homeTeamId ?? fixture.awayTeamId;
    if (lone && (!fixture.homeTeamId || !fixture.awayTeamId)) {
      fixture.isBye = true;
      placeInSlot(fixtureAt(2, Math.floor(position / 2)), position, lone);
    }
  }

  return fixtures;
}

/** Winner of (round, position) advances to (round + 1, floor(position / 2)). */
export function placeInSlot(
  next: Pick<FixtureSlot, "homeTeamId" | "awayTeamId">,
  fromPosition: number,
  teamId: string
) {
  if (fromPosition % 2 === 0) {
    next.homeTeamId = teamId;
  } else {
    next.awayTeamId = teamId;
  }
}

/**
 * Round-robin fixtures via the circle method: every team plays every other
 * team exactly once, spread across `n - 1` matchdays (n rounded up to even).
 */
export function generateRoundRobin(teamIds: string[]): FixtureSlot[] {
  if (teamIds.length < 2) {
    throw new Error("Need at least 2 teams");
  }
  const circle: (string | null)[] = [...teamIds];
  if (circle.length % 2 === 1) circle.push(null); // odd field: one team rests per matchday

  const rounds = circle.length - 1;
  const half = circle.length / 2;
  const fixtures: FixtureSlot[] = [];

  for (let round = 1; round <= rounds; round++) {
    let position = 0;
    for (let i = 0; i < half; i++) {
      const home = circle[i];
      const away = circle[circle.length - 1 - i];
      if (home && away) {
        fixtures.push({ round, position, homeTeamId: home, awayTeamId: away, isBye: false });
        position++;
      }
    }
    // Rotate all but the first entry.
    circle.splice(1, 0, circle.pop()!);
  }

  return fixtures;
}

/** League table from completed matches: win 3, draw 1. */
export function computeStandings(
  teamIds: string[],
  matches: Pick<TournamentMatch, "home_team_id" | "away_team_id" | "home_score" | "away_score" | "status">[]
): StandingsRow[] {
  const rows = new Map<string, StandingsRow>(
    teamIds.map((teamId) => [
      teamId,
      { teamId, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0 },
    ])
  );

  for (const match of matches) {
    if (match.status !== "completed") continue;
    if (!match.home_team_id || !match.away_team_id) continue;
    if (match.home_score == null || match.away_score == null) continue;
    const home = rows.get(match.home_team_id);
    const away = rows.get(match.away_team_id);
    if (!home || !away) continue;

    home.played++;
    away.played++;
    home.goalsFor += match.home_score;
    home.goalsAgainst += match.away_score;
    away.goalsFor += match.away_score;
    away.goalsAgainst += match.home_score;

    if (match.home_score > match.away_score) {
      home.won++;
      away.lost++;
      home.points += 3;
    } else if (match.home_score < match.away_score) {
      away.won++;
      home.lost++;
      away.points += 3;
    } else {
      home.drawn++;
      away.drawn++;
      home.points += 1;
      away.points += 1;
    }
  }

  for (const row of rows.values()) {
    row.goalDifference = row.goalsFor - row.goalsAgainst;
  }

  return [...rows.values()].sort(
    (a, b) =>
      b.points - a.points ||
      b.goalDifference - a.goalDifference ||
      b.goalsFor - a.goalsFor ||
      a.teamId.localeCompare(b.teamId)
  );
}

/** Total rounds in a single-elimination bracket for the given field size. */
export function totalEliminationRounds(teamCount: number): number {
  return Math.log2(nextPowerOfTwo(teamCount));
}

export function roundLabel(round: number, totalRounds: number): string {
  const remaining = totalRounds - round;
  if (remaining === 0) return "Final";
  if (remaining === 1) return "Semifinals";
  if (remaining === 2) return "Quarterfinals";
  return `Round ${round}`;
}
