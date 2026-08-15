import { createClient } from "@/lib/supabase/client";

export type GuestEntry = { ok: true; session: boolean };

/**
 * Public browse (feed, games, scout) does not require a session.
 * If anonymous/guest auth is unavailable, still let the person in.
 */
export function resolveGuestEntry(hasSession: boolean): GuestEntry {
  return { ok: true, session: hasSession };
}

function hasSupabaseBrowserConfig() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export async function signInAsGuest(): Promise<{ ok: boolean; error?: string; session?: boolean }> {
  if (!hasSupabaseBrowserConfig()) {
    return resolveGuestEntry(false);
  }

  try {
    const supabase = createClient();

    const { data: anonData, error: anonError } = await supabase.auth.signInAnonymously();

    if (!anonError && anonData.user) {
      void fetch("/api/auth/guest/ensure-profile", { method: "POST" }).catch(() => null);
      return resolveGuestEntry(true);
    }

    const res = await fetch("/api/auth/guest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const json = await res.json().catch(() => ({}));

    if (!res.ok || !json.email) {
      return resolveGuestEntry(false);
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: json.email as string,
      password: json.password as string,
    });

    if (signInError) {
      return resolveGuestEntry(false);
    }

    return resolveGuestEntry(true);
  } catch {
    return resolveGuestEntry(false);
  }
}
