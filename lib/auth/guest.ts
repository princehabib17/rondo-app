import { createClient } from "@/lib/supabase/client";

export async function signInAsGuest(): Promise<{ ok: boolean; error?: string }> {
  const supabase = createClient();

  // Try Supabase anonymous sign-in first
  const { data: anonData, error: anonError } = await supabase.auth.signInAnonymously();

  if (!anonError && anonData.user) {
    // Don't block navigation — profile can be ensured in the background
    void fetch("/api/auth/guest/ensure-profile", { method: "POST" });
    return { ok: true };
  }

  // Fallback: server creates a guest account (works without Anonymous provider)
  const res = await fetch("/api/auth/guest", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  const json = await res.json().catch(() => ({}));

  if (!res.ok || !json.email) {
    return {
      ok: false,
      error:
        (json.error as string) ??
        anonError?.message ??
        "Guest sign-in failed. Check Supabase keys in .env.local",
    };
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: json.email as string,
    password: json.password as string,
  });

  if (signInError) {
    return { ok: false, error: signInError.message };
  }

  return { ok: true };
}
