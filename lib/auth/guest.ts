import { createClient } from "@/lib/supabase/client";

export async function signInAsGuest(): Promise<{ ok: boolean; error?: string }> {
  const supabase = createClient();

  // Try Supabase anonymous sign-in first
  const { data: anonData, error: anonError } = await supabase.auth.signInAnonymously();

  if (!anonError && anonData.user) {
    void fetch("/api/auth/guest/ensure-profile", { method: "POST" }).catch(() => null);
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
        (json.error as string) === "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
          ? "Guest sign-in is not available right now. Please create an account."
          : (json.error as string) ??
            anonError?.message ??
            "Guest sign-in failed. Please try again.",
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
