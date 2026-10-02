const PHONE_PROVIDER_ERROR =
  /unsupported phone provider|phone provider|sms.*not (enabled|configured)|error sending (sms|otp)|otp.*disabled/i;
const PASSKEY_DISABLED = /passkey_disabled|passkeys? (are )?disabled|not enabled/i;
/** An auth server without the passkey endpoints answers with a non-JSON 404 page. */
const PASSKEY_ENDPOINT_MISSING = /unexpected (token|non-whitespace character|end of json)|is not valid json|json\.parse|404 page not found/i;
const PASSKEY_CHALLENGE_EXPIRED = /webauthn_challenge_expired|challenge.?expired/i;
const PASSKEY_UNSUPPORTED = /does not support webauthn|webauthn is not supported/i;
const PASSKEY_CANCELLED = /notallowederror|user cancelled|webauthn.*abort|passkey.*abort|request aborted/i;
const PASSKEY_ANON = /anonymous|aal2|mfa/i;

const SUPABASE_UNREACHABLE =
  /fetch failed|failed to fetch|networkerror|enotfound|nxdomain|getaddrinfo|could not resolve|aborterror|the operation was aborted|timeouterror|auth service is unreachable|paused or misconfigured/i;

/** Only meaningful for passkey calls: other auth calls can fail with non-JSON for other reasons. */
export function isPasskeyEndpointMissing(message: string): boolean {
  return PASSKEY_ENDPOINT_MISSING.test(message);
}

export const PASSKEYS_OFF_MESSAGE =
  "Passkeys aren't switched on for Rondo yet. Use email, phone, or social login for now.";

export function formatAuthError(message: string): string {
  if (PASSKEY_DISABLED.test(message)) {
    return PASSKEYS_OFF_MESSAGE;
  }
  if (PASSKEY_CHALLENGE_EXPIRED.test(message)) {
    return "Passkey timed out. Try again and complete the biometric prompt promptly.";
  }
  if (PASSKEY_UNSUPPORTED.test(message)) {
    return "This device doesn't support passkeys. Use phone, email, or social login.";
  }
  if (PASSKEY_CANCELLED.test(message)) {
    return "Passkey cancelled.";
  }
  if (/passkey/i.test(message) && PASSKEY_ANON.test(message)) {
    return "Finish creating your account before adding a passkey.";
  }
  if (SUPABASE_UNREACHABLE.test(message)) {
    return "Can't reach login right now. Try again, or create an account.";
  }
  if (/invalid api key|invalid jwt/i.test(message)) {
    return "Can't reach login right now. Try Google, Facebook, email, or create an account.";
  }
  if (PHONE_PROVIDER_ERROR.test(message)) {
    return "We can't text a login code yet. Switch to Email on this screen, or use Google / Facebook / continue as guest.";
  }
  return message;
}
