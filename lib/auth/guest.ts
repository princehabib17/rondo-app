import { createClient } from "@/lib/supabase/client";

export async function signInAsGuest(): Promise<{ ok: boolean; error?: string }> {
  const supabase = createClient();

  let anonError: { message?: string } | null = null;
  try {
    const { data: anonData, error } = await supabase.auth.signInAnonymously();
    anonError = error;

    if (!error && anonData.user) {
      void fetch("/api/auth/guest/ensure-profile", { method: "POST" });
      return { ok: true };
    }
  } catch (e: unknown) {
    anonError = { message: e instanceof Error ? e.message : "Anonymous sign-in failed" };
  }

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
