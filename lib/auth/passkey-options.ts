/**
 * Opt-in for Supabase Auth's experimental passkey (WebAuthn) API.
 * Required on every client that calls registerPasskey / signInWithPasskey.
 * Enable Passkeys in the Supabase Dashboard (Authentication → Passkeys) as well.
 */
export const PASSKEY_AUTH_OPTIONS = {
  experimental: { passkey: true as const },
};
