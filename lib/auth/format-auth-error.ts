const PHONE_PROVIDER_ERROR = /unsupported phone provider/i;

export function formatAuthError(message: string): string {
  if (PHONE_PROVIDER_ERROR.test(message)) {
    return "Phone login isn't enabled yet. Use Google, Facebook, email, or browse as guest.";
  }
  return message;
}
