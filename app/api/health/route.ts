import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import {
  EXPECTED_BUCKETS,
  EXPECTED_COLUMNS,
  EXPECTED_RPCS,
  EXPECTED_TABLES,
} from "@/lib/supabase/schema-manifest";

export const dynamic = "force-dynamic";

/**
 * Deployment self-check. Answers the question "why is every screen empty or
 * erroring?" in one request: which env vars are set, and which tables, columns,
 * RPCs, and buckets the code expects are missing from the connected project.
 *
 * Gated by SEED_SECRET (header `x-seed-secret: <secret>` or
 * `Authorization: Bearer <secret>`) because it uses the service role and
 * describes the schema.
 */

const ENV_KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_APP_URL",
  "SEED_SECRET",
  "PAYMONGO_SECRET_KEY",
  "PAYMONGO_WEBHOOK_SECRET_KEY",
] as const;

type Missing = { kind: "table" | "column" | "rpc" | "bucket"; name: string; detail: string };

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.SEED_SECRET;
  if (!secret) return false;
  const header = request.headers.get("x-seed-secret");
  const bearer = request.headers.get("authorization");
  return header === secret || bearer === `Bearer ${secret}`;
}

export async function GET(request: NextRequest) {
  if (!process.env.SEED_SECRET) {
    return NextResponse.json(
      { ok: false, error: "Health check disabled: SEED_SECRET is not configured" },
      { status: 503 }
    );
  }
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const env = Object.fromEntries(
    ENV_KEYS.map((key) => [key, Boolean(process.env[key]?.trim())])
  ) as Record<(typeof ENV_KEYS)[number], boolean>;

  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      {
        ok: false,
        env,
        error: "Cannot probe the database without NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY",
      },
      { status: 503 }
    );
  }

  const service = createServiceClient();
  const missing: Missing[] = [];

  const tableChecks = EXPECTED_TABLES.map(async (table) => {
    const { error } = await service.from(table).select("*", { head: true, count: "exact" }).limit(0);
    if (error) missing.push({ kind: "table", name: table, detail: error.message });
  });

  const columnChecks = EXPECTED_COLUMNS.map(async ([table, column]) => {
    const { error } = await service.from(table).select(column).limit(0);
    if (error) missing.push({ kind: "column", name: `${table}.${column}`, detail: error.message });
  });

  const rpcChecks = EXPECTED_RPCS.map(async (fn) => {
    // Null idempotency key short-circuits inside the function before any write.
    const { error } = await service.rpc(fn, {
      p_user_id: null,
      p_game_id: null,
      p_team_id: null,
      p_idempotency_key: null,
    });
    if (error && /could not find|does not exist|schema cache/i.test(error.message)) {
      missing.push({ kind: "rpc", name: fn, detail: error.message });
    }
  });

  const bucketCheck = (async () => {
    const { data, error } = await service.storage.listBuckets();
    if (error) {
      for (const bucket of EXPECTED_BUCKETS) {
        missing.push({ kind: "bucket", name: bucket, detail: error.message });
      }
      return;
    }
    const present = new Set((data ?? []).map((b) => b.id));
    for (const bucket of EXPECTED_BUCKETS) {
      if (!present.has(bucket)) {
        missing.push({ kind: "bucket", name: bucket, detail: "bucket not found" });
      }
    }
  })();

  await Promise.all([...tableChecks, ...columnChecks, ...rpcChecks, bucketCheck]);

  // Column errors on a table that is itself missing are noise; drop them.
  const missingTables = new Set(missing.filter((m) => m.kind === "table").map((m) => m.name));
  const deduped = missing.filter(
    (m) => !(m.kind === "column" && missingTables.has(m.name.split(".")[0]))
  );
  deduped.sort((a, b) => a.kind.localeCompare(b.kind) || a.name.localeCompare(b.name));

  const ok = deduped.length === 0 && env.NEXT_PUBLIC_SUPABASE_ANON_KEY && env.NEXT_PUBLIC_APP_URL;

  return NextResponse.json(
    {
      ok,
      env,
      checked: {
        tables: EXPECTED_TABLES.length,
        columns: EXPECTED_COLUMNS.length,
        rpcs: EXPECTED_RPCS.length,
        buckets: EXPECTED_BUCKETS.length,
      },
      missing: deduped,
      fix: deduped.length
        ? "Run supabase/RUN_ALL_IN_SUPABASE.sql in the Supabase SQL Editor, then reload."
        : null,
    },
    { status: ok ? 200 : 503 }
  );
}
