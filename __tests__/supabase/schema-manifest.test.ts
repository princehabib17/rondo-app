import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  EXPECTED_BUCKETS,
  EXPECTED_COLUMNS,
  EXPECTED_RPCS,
  EXPECTED_TABLES,
} from "@/lib/supabase/schema-manifest";

/**
 * Guards against the failure mode that emptied production: code querying a
 * table that no SQL file creates. Three assertions:
 *  1. every `.from("x")`, `.rpc("x")`, `storage.from("x")` in the web app is in
 *     the manifest (so /api/health and SUPABASE_AUDIT.sql know about it);
 *  2. every manifest entry is created by schema.sql or RUN_ALL_IN_SUPABASE.sql
 *     (so running those two files really is enough);
 *  3. RUN_ALL never references a table it (or schema.sql) does not create.
 */

const ROOT = path.resolve(__dirname, "..", "..");
const SCAN_DIRS = ["app", "lib", "components"];
const SOURCE_EXT = new Set([".ts", ".tsx"]);

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      walk(full, out);
    } else if (SOURCE_EXT.has(path.extname(full))) {
      out.push(full);
    }
  }
  return out;
}

function collect(regex: RegExp, sources: string[]): Set<string> {
  const found = new Set<string>();
  for (const file of sources) {
    const text = readFileSync(file, "utf8");
    for (const match of text.matchAll(regex)) {
      found.add(match[1]);
    }
  }
  return found;
}

const sources = SCAN_DIRS.flatMap((dir) => walk(path.join(ROOT, dir)));
const schemaSql = readFileSync(path.join(ROOT, "supabase", "schema.sql"), "utf8");
const runAllSql = readFileSync(path.join(ROOT, "supabase", "RUN_ALL_IN_SUPABASE.sql"), "utf8");
const allSql = `${schemaSql}\n${runAllSql}`;

const createdTables = new Set(
  [...allSql.matchAll(/create table(?: if not exists)? public\.([a-z_]+)/gi)].map((m) => m[1])
);
const createdFunctions = new Set(
  [...allSql.matchAll(/create or replace function public\.([a-z_]+)/gi)].map((m) => m[1])
);
const createdBuckets = new Set(
  [...allSql.matchAll(/insert into storage\.buckets[^;]*?values\s*\(\s*'([a-z-]+)'/gi)].map((m) => m[1])
);

describe("schema manifest", () => {
  it("lists every table the web app queries", () => {
    // Excludes storage.from("bucket") by requiring the receiver not be `storage`.
    const referenced = collect(/(?<!storage)\s*\.from\("([a-z_]+)"\)/g, sources);
    const manifest = new Set<string>(EXPECTED_TABLES);
    const unlisted = [...referenced].filter((t) => !manifest.has(t)).sort();
    expect(unlisted, "add these to lib/supabase/schema-manifest.ts").toEqual([]);
  });

  it("lists every RPC the web app calls", () => {
    const referenced = collect(/\.rpc\("([a-z_]+)"/g, sources);
    const manifest = new Set<string>(EXPECTED_RPCS);
    expect([...referenced].filter((f) => !manifest.has(f))).toEqual([]);
  });

  it("lists every storage bucket the web app uses", () => {
    const referenced = collect(/storage\s*\.from\("([a-z-]+)"\)/g, sources);
    const manifest = new Set<string>(EXPECTED_BUCKETS);
    expect([...referenced].filter((b) => !manifest.has(b))).toEqual([]);
  });
});

describe("schema.sql + RUN_ALL_IN_SUPABASE.sql", () => {
  it("create every table in the manifest", () => {
    const missing = EXPECTED_TABLES.filter((t) => !createdTables.has(t));
    expect(missing, "add CREATE TABLE IF NOT EXISTS to RUN_ALL_IN_SUPABASE.sql").toEqual([]);
  });

  it("define every RPC in the manifest", () => {
    expect(EXPECTED_RPCS.filter((f) => !createdFunctions.has(f))).toEqual([]);
  });

  it("create every bucket in the manifest", () => {
    expect(EXPECTED_BUCKETS.filter((b) => !createdBuckets.has(b))).toEqual([]);
  });

  it("add every column in the manifest to a table they create", () => {
    for (const [table, column] of EXPECTED_COLUMNS) {
      expect(createdTables.has(table), `${table} is never created`).toBe(true);
      // [^;] spans newlines, so no dotAll flag is needed (tsconfig targets ES2017).
      const inCreate = new RegExp(
        `create table(?: if not exists)? public\\.${table}\\s*\\([^;]*\\b${column}\\b`,
        "i"
      );
      const inAlter = new RegExp(
        `alter table public\\.${table}\\s+add column(?: if not exists)? ${column}\\b`,
        "i"
      );
      expect(
        inCreate.test(allSql) || inAlter.test(allSql),
        `${table}.${column} is not created or added by any SQL file`
      ).toBe(true);
    }
  });

  it("never attach policies or indexes to a table they do not create", () => {
    // Policies ("on public.x for/using/with"), indexes ("on public.x ("),
    // RLS toggles and column adds ("alter table public.x"). Deliberately not
    // "execute procedure public.fn" or "references public.x".
    const targets = new Set(
      [
        ...runAllSql.matchAll(/\bon\s+public\.([a-z_]+)\s*(?:\(|for\b|using\b|with\b|\n)/gi),
        ...runAllSql.matchAll(/alter table(?: if exists)? public\.([a-z_]+)\b/gi),
      ].map((m) => m[1])
    );
    const orphans = [...targets].filter((t) => !createdTables.has(t)).sort();
    expect(orphans, "RUN_ALL references tables nothing creates").toEqual([]);
  });

  it("creates tournament_messages before applying its policies", () => {
    const create = runAllSql.search(/create table if not exists public\.tournament_messages/i);
    const policy = runAllSql.search(/create policy "[^"]*" on public\.tournament_messages|create policy "[^"]*"\s*\n\s*on public\.tournament_messages/i);
    expect(create).toBeGreaterThan(-1);
    expect(policy).toBeGreaterThan(create);
  });
});
