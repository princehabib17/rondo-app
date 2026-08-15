#!/usr/bin/env node
/**
 * Mechanical Matchday unify: rewrite legacy Tailwind classes to Matchday tokens.
 * Does not rewrite Lucide imports (handled separately for shared chrome).
 */
import { readdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const targets = ["app", "components"];
const skipDirs = new Set(["ui", "node_modules", ".git"]);

const replacements = [
  // Opacity ink ladder
  [/text-white\/90/g, "text-[var(--ink-hi)]"],
  [/text-white\/80/g, "text-[var(--ink-hi)]"],
  [/text-white\/70/g, "text-[var(--ink-mid)]"],
  [/text-white\/60/g, "text-[var(--ink-mid)]"],
  [/text-white\/50/g, "text-[var(--ink-low)]"],
  [/text-white\/45/g, "text-[var(--ink-low)]"],
  [/text-white\/40/g, "text-[var(--ink-low)]"],
  [/text-white\/30/g, "text-[var(--ink-low)]"],
  [/text-white\/25/g, "text-[var(--ink-low)]"],
  [/text-white\/20/g, "text-[var(--ink-low)]"],
  [/text-white\/10/g, "text-[var(--ink-low)]"],
  [/(?<![-/\w])text-white(?![/\w-])/g, "text-[var(--ink-hi)]"],

  // Surfaces / borders
  [/bg-card\b/g, "bg-[var(--bg-surface)]"],
  [/border-border\b/g, "border-[var(--stroke)]"],
  [/bg-background\b/g, "bg-[var(--bg-page)]"],
  [/bg-muted\b/g, "bg-[var(--bg-inset)]"],
  [/bg-secondary\b/g, "bg-[var(--bg-inset)]"],
  [/text-muted-foreground\b/g, "text-[var(--ink-low)]"],
  [/text-foreground\b/g, "text-[var(--ink-hi)]"],

  // Brand aliases → gold tokens
  [/text-rondo-yellow\b/g, "text-[var(--gold)]"],
  [/text-rondo-accent\b/g, "text-[var(--gold)]"],
  [/bg-rondo-yellow\b/g, "bg-[var(--gold)]"],
  [/bg-rondo-accent\b/g, "bg-[var(--gold)]"],
  [/border-rondo-yellow\b/g, "border-[var(--gold)]"],
  [/border-rondo-accent\b/g, "border-[var(--gold)]"],
  [/border-rondo-blue\b/g, "border-[var(--gold)]"],
  [/text-rondo-blue\b/g, "text-[var(--gold)]"],
  [/hover:border-rondo-yellow\/40/g, "hover:border-[color-mix(in_oklch,var(--gold)_40%,var(--stroke))]"],
  [/hover:border-rondo-accent\/40/g, "hover:border-[color-mix(in_oklch,var(--gold)_40%,var(--stroke))]"],
  [/hover:border-rondo-accent\/25/g, "hover:border-[color-mix(in_oklch,var(--gold)_25%,var(--stroke))]"],
  [/border-rondo-accent\/40/g, "border-[color-mix(in_oklch,var(--gold)_40%,var(--stroke))]"],
  [/border-rondo-accent\/30/g, "border-[color-mix(in_oklch,var(--gold)_30%,var(--stroke))]"],
  [/border-rondo-accent\/25/g, "border-[color-mix(in_oklch,var(--gold)_25%,var(--stroke))]"],
  [/bg-rondo-accent\/15/g, "bg-[var(--gold-dim)]"],
  [/bg-rondo-accent\/10/g, "bg-[var(--gold-dim)]"],
  [/bg-rondo-yellow\/15/g, "bg-[var(--gold-dim)]"],
  [/text-black\b/g, "text-[var(--gold-ink)]"],

  // Radius scale
  [/rounded-3xl\b/g, "rounded-[var(--r-lg)]"],
  [/rounded-2xl\b/g, "rounded-[var(--r-md)]"],
  [/rounded-xl\b/g, "rounded-[var(--r-md)]"],
  [/rounded-lg\b/g, "rounded-[var(--r-sm)]"],

  // Common white border opacities
  [/border-white\/10\b/g, "border-[var(--stroke)]"],
  [/border-white\/8\b/g, "border-[var(--stroke)]"],
  [/border-white\/15\b/g, "border-[var(--stroke)]"],
  [/border-white\/20\b/g, "border-[var(--stroke)]"],
  [/bg-white\/10\b/g, "bg-[var(--bg-inset)]"],
  [/bg-white\/5\b/g, "bg-[var(--bg-inset)]"],
  [/bg-black\/40\b/g, "bg-[var(--bg-surface)]"],
  [/bg-black\b/g, "bg-[var(--bg-page)]"],

  // Semantic red/green that often used raw Tailwind
  [/text-red-400\b/g, "text-[var(--live)]"],
  [/text-red-300\b/g, "text-[var(--live)]"],
  [/border-red-500\/30\b/g, "border-[color-mix(in_oklch,var(--live)_35%,var(--stroke))]"],
  [/border-red-400\/50\b/g, "border-[color-mix(in_oklch,var(--live)_45%,var(--stroke))]"],
  [/bg-red-500\/15\b/g, "bg-[color-mix(in_oklch,var(--live)_16%,transparent)]"],
  [/bg-red-500\/5\b/g, "bg-[color-mix(in_oklch,var(--live)_8%,transparent)]"],
  [/bg-red-500\/90\b/g, "bg-[var(--live)]"],
  [/text-green-400\b/g, "text-[var(--ok)]"],
  [/bg-green-500\/15\b/g, "bg-[color-mix(in_oklch,var(--ok)_16%,transparent)]"],

  // Amber warnings → live/gold mix
  [/text-amber-200\/80\b/g, "text-[var(--gold)]"],
];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (skipDirs.has(name)) continue;
    const path = join(dir, name);
    const st = statSync(path);
    if (st.isDirectory()) walk(path, out);
    else if (/\.(tsx|ts|css)$/.test(name) && name !== "globals.css") out.push(path);
  }
  return out;
}

let changed = 0;
const files = targets.flatMap((t) => walk(join(root, t)));

for (const file of files) {
  // Keep shadcn primitives on semantic tokens; CSS already maps them.
  if (file.includes(`${join("components", "ui")}`)) continue;

  let body = readFileSync(file, "utf8");
  const before = body;
  for (const [pattern, next] of replacements) {
    body = body.replace(pattern, next);
  }
  if (body !== before) {
    writeFileSync(file, body);
    changed += 1;
    console.log("updated", relative(root, file));
  }
}

console.log(`\nDone. Updated ${changed} files.`);
