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

const SERVER_AUTH_TIMEOUT_MS = 12_000;

/**
 * Create an email/password account.
 * The service-role API confirms the email and is the path that actually signs
 * people in. Browser signUp waits on Supabase's confirmation email; that call
 * was exceeding the short client timeout and aborting before the server path
 * ran, so Create account failed even though the API was healthy.
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

  const signIn = async (): Promise<SignupWithEmailResult> => {
    try {
      const { error: signInError } = await withAuthTimeout(
        args.supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password: args.password,
        }),
        SERVER_AUTH_TIMEOUT_MS
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
  };

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
      signal: AbortSignal.timeout(SERVER_AUTH_TIMEOUT_MS),
    });
    fallbackJson = (await fallback.json().catch(() => ({}))) as { error?: string };
  } catch {
    fallback = null;
  }

  if (fallback?.ok) {
    return signIn();
  }

  if (fallback && fallback.status === 409) {
    const signedIn = await signIn();
    if (signedIn.ok) return signedIn;
    return {
      ok: false,
      error: formatAuthError(
        fallbackJson.error ?? "An account with this email already exists."
      ),
    };
  }

  if (fallback && fallback.status >= 400 && fallback.status < 500) {
    return {
      ok: false,
      error: formatAuthError(fallbackJson.error ?? "Could not create account."),
    };
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
      }),
      SERVER_AUTH_TIMEOUT_MS
    );
    signUpError = result.error;
    data = result.data;
  } catch (authError) {
    return {
      ok: false,
      error: formatAuthError(
        fallbackJson.error ??
          (authError instanceof Error ? authError.message : AUTH_UNREACHABLE_MESSAGE)
      ),
    };
  }

  if (!signUpError && data.session) {
    return { ok: true };
  }

  if (!signUpError && data.user && !data.session) {
    return { ok: true, needsEmailConfirmation: true };
  }

  const message =
    fallbackJson.error ?? signUpError?.message ?? "Could not create account.";
  return { ok: false, error: formatAuthError(message) };
}
