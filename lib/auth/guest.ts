import { createClient } from "@/lib/supabase/client";
import { GUEST_SIGNIN_TIMEOUT_MS, AUTH_UNREACHABLE_MESSAGE } from "@/lib/auth/auth-timeout";
import { formatAuthError } from "@/lib/auth/format-auth-error";

/**
 * Server creates the guest and returns a session. Do not call signInAnonymously
 * first — that hang is what made "Continue as guest" die on production.
 */
export async function signInAsGuest(): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch("/api/auth/guest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      signal: AbortSignal.timeout(GUEST_SIGNIN_TIMEOUT_MS),
    });
    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      const raw =
        (json.error as string | undefined) ?? "Guest sign-in failed. Please try again.";
      return {
        ok: false,
        error:
          raw === "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
            ? "Guest sign-in is not available right now. Please create an account."
            : formatAuthError(raw),
      };
    }

    const accessToken = json.access_token as string | undefined;
    const refreshToken = json.refresh_token as string | undefined;
    if (accessToken && refreshToken) {
      const supabase = createClient();
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (sessionError) {
        return { ok: false, error: formatAuthError(sessionError.message) };
      }
    }

    return { ok: true };
  } catch (error) {
    const raw = error instanceof Error ? error.message : AUTH_UNREACHABLE_MESSAGE;
    return { ok: false, error: formatAuthError(raw) };
  }
}
