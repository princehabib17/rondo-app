import { createClient } from "@/lib/supabase/client";
import { AUTH_TIMEOUT_MS, AUTH_UNREACHABLE_MESSAGE, withAuthTimeout } from "@/lib/auth/auth-timeout";
import { formatAuthError } from "@/lib/auth/format-auth-error";

async function signInAsGuestInner(): Promise<{ ok: boolean; error?: string }> {
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
    signal: AbortSignal.timeout(AUTH_TIMEOUT_MS),
  });
  const json = await res.json().catch(() => ({}));

  if (!res.ok || !json.email) {
    const raw =
      (json.error as string | undefined) ??
      anonError?.message ??
      "Guest sign-in failed. Please try again.";
    return {
      ok: false,
      error:
        raw === "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
          ? "Guest sign-in is not available right now. Please create an account."
          : formatAuthError(raw),
    };
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: json.email as string,
    password: json.password as string,
  });

  if (signInError) {
    return { ok: false, error: formatAuthError(signInError.message) };
  }

  return { ok: true };
}

export async function signInAsGuest(): Promise<{ ok: boolean; error?: string }> {
  try {
    return await withAuthTimeout(signInAsGuestInner());
  } catch (error) {
    const raw =
      error instanceof Error ? error.message : AUTH_UNREACHABLE_MESSAGE;
    return { ok: false, error: formatAuthError(raw) };
  }
}
