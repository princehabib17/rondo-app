import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServiceClient } from "@/lib/supabase/service";
import { requireSupabasePublicConfig } from "@/lib/supabase/config";
import { createClient as createCookieClient } from "@/lib/supabase/server";

/**
 * Creates a guest account and returns a session the browser can store.
 * Cookies are also set so the next server render sees the user.
 */

const GUEST_RATE_LIMIT_MAX = 20;
const GUEST_RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
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

    const { url, anonKey } = requireSupabasePublicConfig();
    const anon = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    let session = (await anon.auth.signInWithPassword({ email, password })).data.session;

    if (!session) {
      session = (await service.auth.signInWithPassword({ email, password })).data.session;
    }

    if (!session?.access_token || !session.refresh_token) {
      return NextResponse.json(
        { error: "Could not open a guest session." },
        { status: 500 }
      );
    }

    try {
      const cookieClient = await createCookieClient();
      await cookieClient.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      });
    } catch {
      // Browser setSession is enough if cookie mirroring fails.
    }

    return NextResponse.json({
      ok: true,
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Guest sign-in failed";
    const unreachable = /fetch failed|failed to fetch|enotfound|getaddrinfo|nxdomain/i.test(
      message
    );
    return NextResponse.json(
      {
        error: unreachable
          ? "Can't reach login right now. Try again, or create an account."
          : message,
      },
      { status: 500 }
    );
  }
}
