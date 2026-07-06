import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * Creates a one-time guest account when anonymous sign-in is disabled.
 * Returns credentials for the client to sign in with password.
 */

// Best-effort per-IP throttle for guest account creation. This is in-memory
// and per-instance, so on serverless deployments with multiple instances (or
// cold starts) it does NOT provide a strict global guarantee — a durable
// store (e.g. Redis/DB-backed counter) would be needed for that. It's still
// useful as a cheap deterrent against casual abuse from a single instance.
const GUEST_RATE_LIMIT_MAX = 5;
const GUEST_RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const guestCreationLog = new Map<string, number[]>();

function isGuestRateLimited(ip: string, now = Date.now()): boolean {
  const timestamps = (guestCreationLog.get(ip) ?? []).filter(
    (t) => now - t < GUEST_RATE_LIMIT_WINDOW_MS
  );

  if (timestamps.length >= GUEST_RATE_LIMIT_MAX) {
    guestCreationLog.set(ip, timestamps);
    return true;
  }

  timestamps.push(now);
  guestCreationLog.set(ip, timestamps);
  return false;
}

export async function POST(request: Request) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" },
      { status: 503 }
    );
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (isGuestRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many guest sign-ins. Please try again later." },
      { status: 429 }
    );
  }

  try {
    const service = createServiceClient();
    const id = crypto.randomUUID().slice(0, 8);
    const email = `guest.${id}@guest.rondo.app`;
    const password = crypto.randomUUID().replace(/-/g, "") + "Aa1!";

    const { data: userData, error: createError } = await service.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: "Guest", is_guest: true },
    });

    if (createError || !userData.user) {
      return NextResponse.json(
        { error: createError?.message ?? "Could not create guest account" },
        { status: 500 }
      );
    }

    await service.from("profiles").upsert({
      id: userData.user.id,
      email,
      full_name: "Guest",
      role: "player",
    });

    return NextResponse.json({ email, password });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Guest sign-in failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
