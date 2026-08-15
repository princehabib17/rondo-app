#!/usr/bin/env node
import { readdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const skipDirs = new Set(["ui", "node_modules", ".git"]);

const replacements = [
  [/text-white\/8[258]/g, "text-[var(--ink-hi)]"],
  [/text-white\/7[05]/g, "text-[var(--ink-mid)]"],
  [/text-white\/5[58]/g, "text-[var(--ink-mid)]"],
  [/text-white\/3[05]/g, "text-[var(--ink-low)]"],
  [/text-white\/28/g, "text-[var(--ink-low)]"],
  [/placeholder:text-white\/[0-9]+/g, "placeholder:text-[var(--ink-low)]"],
  [/border-white\/12/g, "border-[var(--stroke)]"],
  [/border-white\/10/g, "border-[var(--stroke)]"],
  [/bg-white\/\[0\.045\]/g, "bg-[var(--bg-inset)]"],
  [/bg-white\/8\b/g, "bg-[var(--bg-inset)]"],
  [/ring-white\/10/g, "ring-[var(--stroke)]"],
  [/ring-rondo-yellow\/20/g, "ring-[color-mix(in_oklch,var(--gold)_20%,transparent)]"],
  [/ring-rondo-accent\/20/g, "ring-[color-mix(in_oklch,var(--gold)_20%,transparent)]"],
  [/from-rondo-accent\/15/g, "from-[var(--gold-dim)]"],
  [/focus:ring-rondo-accent\/50/g, "focus:ring-[color-mix(in_oklch,var(--gold)_50%,transparent)]"],
  [/fill-rondo-accent\b/g, "fill-[var(--gold)]"],
  [/bg-\[#1c1c1c\]/g, "bg-[var(--bg-inset)]"],
  [/accent-\[#E9FF3A\]/g, "accent-[var(--gold)]"],
  [/hover:text-white\b/g, "hover:text-[var(--ink-hi)]"],
  [/(?<![-/\w])text-white(?![/\w[-])/g, "text-[var(--ink-hi)]"],
];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (skipDirs.has(name)) continue;
    const path = join(dir, name);
    const st = statSync(path);
    if (st.isDirectory()) walk(path, out);
    else if (/\.(tsx|ts)$/.test(name)) out.push(path);
  }
  return out;
}

let changed = 0;
for (const file of ["app", "components"].flatMap((t) => walk(join(root, t)))) {
  if (file.includes(`${join("components", "ui")}`)) continue;
  let body = readFileSync(file, "utf8");
  const before = body;
  for (const [pattern, next] of replacements) body = body.replace(pattern, next);
  if (body !== before) {
    writeFileSync(file, body);
    changed += 1;
    console.log("updated", relative(root, file));
  }
}
console.log(`\nPass 2 done. Updated ${changed} files.`);
