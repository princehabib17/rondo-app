const PHONE_PROVIDER_ERROR = /unsupported phone provider/i;
const PASSKEY_DISABLED = /passkey_disabled|passkeys? (are )?disabled|not enabled/i;
const PASSKEY_CHALLENGE_EXPIRED = /webauthn_challenge_expired|challenge.?expired/i;
const PASSKEY_UNSUPPORTED = /does not support webauthn|webauthn is not supported/i;
const PASSKEY_CANCELLED = /notallowederror|user cancelled|webauthn.*abort|passkey.*abort|request aborted/i;
const PASSKEY_ANON = /anonymous|aal2|mfa/i;

const SUPABASE_UNREACHABLE =
  /fetch failed|failed to fetch|networkerror|enotfound|nxdomain|getaddrinfo|could not resolve|aborterror|the operation was aborted|timeouterror|auth service is unreachable|paused or misconfigured/i;

export function formatAuthError(message: string): string {
  if (PASSKEY_DISABLED.test(message)) {
    return "Passkeys aren't enabled for this project yet. Use phone, email, or social login.";
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
    return "Auth service is unreachable right now. Check that the Supabase project is live and the app URL keys are up to date.";
  }
  if (PHONE_PROVIDER_ERROR.test(message)) {
    return "Phone login isn't enabled yet. Use Google, Facebook, email, or browse as guest.";
  }
  return message;
}
