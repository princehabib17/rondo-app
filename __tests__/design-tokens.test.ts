import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = process.cwd();

const protectedFiles = [
  "components/rondo/primitives.tsx",
  "components/tournament/TournamentCard.tsx",
  "components/tournament/TournamentHero.tsx",
  "components/tournament/BracketView.tsx",
  "components/tournament/StandingsTable.tsx",
];

const bannedPatterns = [
  /text-white\//,
  /bg-black(?!\])/,
  /#[0-9a-fA-F]{3,8}/,
  /rounded-(xl|2xl|3xl)/,
  /rondo-blue/,
  /rondo-yellow/,
  /bg-card/,
  /border-border/,
];

describe("Matchday token guard", () => {
  it("keeps critical Rondo components on Matchday tokens", () => {
    const violations = protectedFiles.flatMap((file) => {
      const body = readFileSync(join(repoRoot, file), "utf8");
      return bannedPatterns
        .filter((pattern) => pattern.test(body))
        .map((pattern) => `${file} contains ${pattern}`);
    });

    expect(violations).toEqual([]);
  });

  it("defines the required Matchday tokens", () => {
    const globals = readFileSync(join(repoRoot, "app/globals.css"), "utf8");
    for (const token of [
      "--bg-page",
      "--bg-surface",
      "--bg-inset",
      "--stroke",
      "--ink-hi",
      "--ink-mid",
      "--ink-low",
      "--gold",
      "--gold-ink",
      "--gold-dim",
      "--live",
      "--ok",
    ]) {
      expect(globals).toContain(token);
    }
  });
});

