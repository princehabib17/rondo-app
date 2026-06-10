import { describe, expect, it } from "vitest";
import {
  computeStandings,
  generateRoundRobin,
  generateSingleElimination,
  nextPowerOfTwo,
  placeInSlot,
  roundLabel,
  seedOrder,
  totalEliminationRounds,
} from "@/lib/tournament/bracket";

const teams = (n: number) => Array.from({ length: n }, (_, i) => `team-${i + 1}`);

describe("seedOrder", () => {
  it("keeps top seeds apart until the final", () => {
    expect(seedOrder(2)).toEqual([1, 2]);
    expect(seedOrder(4)).toEqual([1, 4, 2, 3]);
    expect(seedOrder(8)).toEqual([1, 8, 4, 5, 2, 7, 3, 6]);
  });
});

describe("generateSingleElimination", () => {
  it("rejects fields smaller than 2", () => {
    expect(() => generateSingleElimination(teams(1))).toThrow();
  });

  it("builds a full bracket for a power-of-two field", () => {
    const fixtures = generateSingleElimination(teams(8));
    expect(fixtures).toHaveLength(7); // 4 + 2 + 1
    const round1 = fixtures.filter((f) => f.round === 1);
    expect(round1).toHaveLength(4);
    expect(round1.every((f) => f.homeTeamId && f.awayTeamId)).toBe(true);
    expect(fixtures.filter((f) => f.isBye)).toHaveLength(0);
    // seeds 1 and 2 are on opposite halves
    expect(round1[0].homeTeamId).toBe("team-1");
    expect(round1[2].homeTeamId).toBe("team-2");
  });

  it("gives byes to top seeds and pre-places them in round 2", () => {
    const fixtures = generateSingleElimination(teams(6)); // bracket of 8
    const byes = fixtures.filter((f) => f.isBye);
    expect(byes).toHaveLength(2);
    const byeTeams = byes.map((f) => f.homeTeamId ?? f.awayTeamId);
    expect(byeTeams).toContain("team-1");
    expect(byeTeams).toContain("team-2");
    const round2 = fixtures.filter((f) => f.round === 2);
    const placed = round2.flatMap((f) => [f.homeTeamId, f.awayTeamId]).filter(Boolean);
    expect(placed.sort()).toEqual(["team-1", "team-2"]);
  });

  it("every team appears exactly once in round 1 slots", () => {
    const fixtures = generateSingleElimination(teams(7));
    const round1Teams = fixtures
      .filter((f) => f.round === 1)
      .flatMap((f) => [f.homeTeamId, f.awayTeamId])
      .filter(Boolean);
    expect(round1Teams.sort()).toEqual(teams(7).sort());
  });
});

describe("placeInSlot", () => {
  it("routes even positions to home and odd to away", () => {
    const slot = { homeTeamId: null as string | null, awayTeamId: null as string | null };
    placeInSlot(slot, 0, "a");
    placeInSlot(slot, 1, "b");
    expect(slot).toEqual({ homeTeamId: "a", awayTeamId: "b" });
  });
});

describe("generateRoundRobin", () => {
  it("schedules every pairing exactly once", () => {
    const fixtures = generateRoundRobin(teams(5));
    expect(fixtures).toHaveLength(10); // C(5,2)
    const pairings = new Set(
      fixtures.map((f) => [f.homeTeamId, f.awayTeamId].sort().join("|"))
    );
    expect(pairings.size).toBe(10);
  });

  it("never schedules a team twice on the same matchday", () => {
    const fixtures = generateRoundRobin(teams(6));
    const byRound = new Map<number, string[]>();
    for (const f of fixtures) {
      const list = byRound.get(f.round) ?? [];
      list.push(f.homeTeamId!, f.awayTeamId!);
      byRound.set(f.round, list);
    }
    for (const list of byRound.values()) {
      expect(new Set(list).size).toBe(list.length);
    }
  });
});

describe("computeStandings", () => {
  it("awards 3/1/0 points and sorts by points then goal difference", () => {
    const ids = teams(3);
    const table = computeStandings(ids, [
      { home_team_id: "team-1", away_team_id: "team-2", home_score: 2, away_score: 0, status: "completed" },
      { home_team_id: "team-2", away_team_id: "team-3", home_score: 1, away_score: 1, status: "completed" },
      { home_team_id: "team-1", away_team_id: "team-3", home_score: 0, away_score: 1, status: "completed" },
    ]);
    expect(table.map((r) => r.teamId)).toEqual(["team-3", "team-1", "team-2"]);
    expect(table[0]).toMatchObject({ points: 4, played: 2, won: 1, drawn: 1, lost: 0 });
    expect(table[1]).toMatchObject({ points: 3, goalDifference: 1 });
  });

  it("ignores unfinished matches", () => {
    const table = computeStandings(teams(2), [
      { home_team_id: "team-1", away_team_id: "team-2", home_score: null, away_score: null, status: "scheduled" },
    ]);
    expect(table.every((r) => r.played === 0 && r.points === 0)).toBe(true);
  });
});

describe("round helpers", () => {
  it("computes total rounds from field size", () => {
    expect(nextPowerOfTwo(5)).toBe(8);
    expect(totalEliminationRounds(8)).toBe(3);
    expect(totalEliminationRounds(6)).toBe(3);
  });

  it("labels the closing rounds", () => {
    expect(roundLabel(3, 3)).toBe("Final");
    expect(roundLabel(2, 3)).toBe("Semifinals");
    expect(roundLabel(1, 3)).toBe("Quarterfinals");
    expect(roundLabel(1, 4)).toBe("Round 1");
  });
});
