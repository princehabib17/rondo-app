import { createClient } from "@/lib/supabase/client";
import { formatAuthError } from "@/lib/auth/format-auth-error";

export type PasskeyInfo = {
  id: string;
  friendly_name?: string;
  created_at: string;
  last_used_at?: string;
};

export type PasskeyResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; cancelled?: boolean };

/** True when the browser can run a WebAuthn ceremony (Face ID / Touch ID / Windows Hello / security key). */
export function isPasskeySupported(): boolean {
  if (typeof window === "undefined") return false;
  return (
    typeof window.PublicKeyCredential !== "undefined" &&
    typeof navigator.credentials?.create === "function" &&
    typeof navigator.credentials?.get === "function"
  );
}

function isUserCancelled(message: string): boolean {
  return /notallowed|abort|cancel|timed out|timeout/i.test(message);
}

function toErrorMessage(error: { message?: string } | null | undefined): string {
  return formatAuthError(error?.message ?? "Passkey request failed.");
}

/**
 * Discoverable-credential sign-in. No email/phone needed — the authenticator picks the account.
 */
export async function signInWithPasskey(): Promise<PasskeyResult<{ userId: string }>> {
  if (!isPasskeySupported()) {
    return {
      ok: false,
      error: "This device doesn't support passkeys. Use phone, email, or social login.",
    };
  }

  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPasskey();

  if (error) {
    const message = toErrorMessage(error);
    return { ok: false, error: message, cancelled: isUserCancelled(error.message) };
  }

  const userId = data?.user?.id;
  if (!userId) {
    return { ok: false, error: "Passkey sign-in did not return a session." };
  }

  return { ok: true, data: { userId } };
}

/**
 * Register a new passkey for the signed-in (non-anonymous) user.
 * Triggers the platform biometric / PIN / security-key prompt.
 */
export async function registerPasskey(): Promise<
  PasskeyResult<{ id: string; friendlyName?: string; createdAt: string }>
> {
  if (!isPasskeySupported()) {
    return {
      ok: false,
      error: "This device doesn't support passkeys.",
    };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.is_anonymous) {
    return {
      ok: false,
      error: "Create a full account before adding a passkey.",
    };
  }

  const { data, error } = await supabase.auth.registerPasskey();

  if (error) {
    const message = toErrorMessage(error);
    return { ok: false, error: message, cancelled: isUserCancelled(error.message) };
  }

  if (!data?.id) {
    return { ok: false, error: "Passkey registration did not return a credential." };
  }

  return {
    ok: true,
    data: {
      id: data.id,
      friendlyName: data.friendly_name,
      createdAt: data.created_at,
    },
  };
}

export async function listPasskeys(): Promise<PasskeyResult<PasskeyInfo[]>> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.passkey.list();

  if (error) {
    return { ok: false, error: toErrorMessage(error) };
  }

  return { ok: true, data: (data as PasskeyInfo[] | null) ?? [] };
}

export async function deletePasskey(passkeyId: string): Promise<PasskeyResult<null>> {
  const supabase = createClient();
  const { error } = await supabase.auth.passkey.delete({ passkeyId });

  if (error) {
    return { ok: false, error: toErrorMessage(error) };
  }

  return { ok: true, data: null };
}

export async function renamePasskey(
  passkeyId: string,
  friendlyName: string
): Promise<PasskeyResult<PasskeyInfo>> {
  const trimmed = friendlyName.trim().slice(0, 120);
  if (!trimmed) {
    return { ok: false, error: "Enter a name for this passkey." };
  }

  const supabase = createClient();
  const { data, error } = await supabase.auth.passkey.update({
    passkeyId,
    friendlyName: trimmed,
  });

  if (error) {
    return { ok: false, error: toErrorMessage(error) };
  }

  if (!data) {
    return { ok: false, error: "Could not update passkey." };
  }

  return { ok: true, data: data as PasskeyInfo };
}
