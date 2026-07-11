const PHONE_PROVIDER_ERROR = /unsupported phone provider/i;
const PASSKEY_DISABLED = /passkey_disabled|passkeys? (are )?disabled|not enabled/i;
const PASSKEY_CHALLENGE_EXPIRED = /webauthn_challenge_expired|challenge.?expired/i;
const PASSKEY_UNSUPPORTED = /does not support webauthn|webauthn is not supported/i;
const PASSKEY_CANCELLED = /notallowederror|the operation (was|is) aborted|user cancelled|request aborted/i;
const PASSKEY_ANON = /anonymous|aal2|mfa/i;

export function formatAuthError(message: string): string {
  if (PHONE_PROVIDER_ERROR.test(message)) {
    return "Phone login isn't enabled yet. Use Google, Facebook, email, or browse as guest.";
  }
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
  return message;
}
