import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = process.cwd();

const protectedFiles = [
  "components/rondo/primitives.tsx",
  "components/tournament/TournamentCard.tsx",
  "components/tournament/TournamentHero.tsx",
  "components/tournament/BracketView.tsx",
  "components/tournament/StandingsTable.tsx",
  "components/layout/BottomNav.tsx",
  "components/game/GameCard.tsx",
  "components/feed/FeedPageClient.tsx",
  "components/feed/HomeSections.tsx",
  "components/social/PostCard.tsx",
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
  /from ["']lucide-react["']/,
];

function walkTsx(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    const st = statSync(path);
    if (st.isDirectory()) {
      if (name === "ui" || name === "node_modules") continue;
      walkTsx(path, out);
    } else if (name.endsWith(".tsx")) {
      out.push(path);
    }
  }
  return out;
}

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

  it("defines the required athletic tokens", () => {
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
      "--bg-night",
      "--night-ink",
    ]) {
      expect(globals).toContain(token);
    }
  });

  it("keeps CTA gold as Matchday yellow, not muddy amber/brown", () => {
    const globals = readFileSync(join(repoRoot, "app/globals.css"), "utf8");
    expect(globals).toMatch(/--gold:\s*#e8d24a/i);
    expect(globals).toMatch(/--gold-ink:\s*#1c1c14/i);
    expect(globals).not.toMatch(/--gold:\s*oklch\(68%\s+0\.16\s+72\)/);
    expect(globals).not.toMatch(/--gold:\s*#d08600/i);
  });

  it("keeps product screens free of legacy white-opacity ink", () => {
    const files = [...walkTsx(join(repoRoot, "app")), ...walkTsx(join(repoRoot, "components"))];
    const hits = files.flatMap((file) => {
      const body = readFileSync(file, "utf8");
      if (!/text-white\//.test(body) && !/bg-card\b/.test(body) && !/border-border\b/.test(body)) {
        return [];
      }
      return [file.replace(repoRoot + "/", "")];
    });
    expect(hits).toEqual([]);
  });
});
