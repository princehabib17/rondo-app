import { formatAuthError } from "@/lib/auth/format-auth-error";
import { AUTH_UNREACHABLE_MESSAGE, withAuthTimeout } from "@/lib/auth/auth-timeout";
import { isValidEmail, normalizeEmail } from "@/lib/auth/email";
import { normalizeUsername, usernameValidationError } from "@/lib/auth/username";

export type SignupWithEmailResult =
  | { ok: true; needsEmailConfirmation?: boolean }
  | { ok: false; error: string };

type AuthClient = {
  auth: {
    signUp: (args: {
      email: string;
      password: string;
      options?: { data?: Record<string, string> };
    }) => Promise<{
      data: { user: { id: string } | null; session: unknown | null };
      error: { message: string } | null;
    }>;
    signInWithPassword: (args: {
      email: string;
      password: string;
    }) => Promise<{ error: { message: string } | null }>;
  };
};

/**
 * Create an email/password account. Prefers the service-role signup API so the
 * user can sign in immediately even when Supabase requires email confirmation.
 */
export async function signupWithEmail(args: {
  supabase: AuthClient;
  fullName: string;
  username: string;
  email: string;
  password: string;
  fetchImpl?: typeof fetch;
}): Promise<SignupWithEmailResult> {
  const trimmedName = args.fullName.trim();
  const username = normalizeUsername(args.username);
  const trimmedEmail = normalizeEmail(args.email);
  const fetchFn = args.fetchImpl ?? fetch;

  if (trimmedName.length < 2) {
    return { ok: false, error: "Enter your name." };
  }
  const usernameError = usernameValidationError(username);
  if (usernameError) {
    return { ok: false, error: usernameError };
  }
  if (!isValidEmail(trimmedEmail)) {
    return { ok: false, error: "Enter a valid email address." };
  }
  if (args.password.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters." };
  }

  let signUpError: { message: string } | null = null;
  let data: { user: { id: string } | null; session: unknown | null } = {
    user: null,
    session: null,
  };

  try {
    const result = await withAuthTimeout(
      args.supabase.auth.signUp({
        email: trimmedEmail,
        password: args.password,
        options: { data: { full_name: trimmedName, username } },
      })
    );
    signUpError = result.error;
    data = result.data;
  } catch (authError) {
    return {
      ok: false,
      error: formatAuthError(
        authError instanceof Error ? authError.message : AUTH_UNREACHABLE_MESSAGE
      ),
    };
  }

  if (!signUpError && data.session) {
    return { ok: true };
  }

  let fallback: Response | null = null;
  let fallbackJson: { error?: string } = {};
  try {
    fallback = await fetchFn("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: trimmedEmail,
        password: args.password,
        fullName: trimmedName,
        username,
      }),
      signal: AbortSignal.timeout(12_000),
    });
    fallbackJson = (await fallback.json().catch(() => ({}))) as { error?: string };
  } catch (fetchError) {
    if (!signUpError && data.user && !data.session) {
      return { ok: true, needsEmailConfirmation: true };
    }
    return {
      ok: false,
      error: formatAuthError(
        fetchError instanceof Error ? fetchError.message : AUTH_UNREACHABLE_MESSAGE
      ),
    };
  }

  if (fallback.ok) {
    try {
      const { error: signInError } = await withAuthTimeout(
        args.supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password: args.password,
        })
      );
      if (signInError) {
        return { ok: false, error: formatAuthError(signInError.message) };
      }
      return { ok: true };
    } catch (authError) {
      return {
        ok: false,
        error: formatAuthError(
          authError instanceof Error ? authError.message : AUTH_UNREACHABLE_MESSAGE
        ),
      };
    }
  }

  if (!signUpError && data.user && !data.session) {
    return { ok: true, needsEmailConfirmation: true };
  }

  const message =
    fallbackJson.error ?? signUpError?.message ?? "Could not create account.";
  return { ok: false, error: formatAuthError(message) };
}
