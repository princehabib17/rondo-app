import { createClient } from "@/lib/supabase/client";

export async function signInAsGuest(): Promise<{ ok: boolean; error?: string }> {
  const supabase = createClient();

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
