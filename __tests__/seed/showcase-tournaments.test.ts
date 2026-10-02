import { describe, expect, it } from "vitest";
import {
  SHOWCASE_TOURNAMENTS,
  distributeGoals,
  playShowcaseFixtures,
} from "@/lib/seed/showcase-tournaments";

describe("showcase tournaments", () => {
  it("scripts exactly one score per playable fixture", () => {
    for (const seed of SHOWCASE_TOURNAMENTS) {
      const ids = seed.teams.map((_, i) => `team-${i}`);
      const played = playShowcaseFixtures(seed, ids).filter((f) => f.status === "completed");
      expect(played).toHaveLength(seed.scores.length);
    }
  });

  it("never scripts a knockout draw and crowns a single champion", () => {
    const cup = SHOWCASE_TOURNAMENTS.find((t) => t.format === "single_elimination")!;
    const ids = cup.teams.map((_, i) => `team-${i}`);
    const played = playShowcaseFixtures(cup, ids);
    for (const fixture of played) {
      if (fixture.status === "completed") expect(fixture.homeScore).not.toBe(fixture.awayScore);
    }
    const finalRound = Math.max(...played.map((f) => f.round));
    const final = played.filter((f) => f.round === finalRound);
    expect(final).toHaveLength(1);
    expect(final[0].homeTeamId).toBeTruthy();
    expect(final[0].awayTeamId).toBeTruthy();
  });

  it("splits a side's goals without losing any", () => {
    const squad = ["A", "B", "C"];
    for (let goals = 0; goals <= 7; goals++) {
      const total = distributeGoals(goals, squad, 3).reduce((sum, s) => sum + s.goals, 0);
      expect(total).toBe(goals);
    }
  });

  it("keeps every showcase name and squad realistic", () => {
    for (const seed of SHOWCASE_TOURNAMENTS) {
      expect(seed.name).not.toMatch(/test|player \d|team [a-z]$/i);
      expect(seed.description).not.toContain("—");
      for (const team of seed.teams) expect(team.squad.length).toBeGreaterThanOrEqual(2);
    }
  });
});
