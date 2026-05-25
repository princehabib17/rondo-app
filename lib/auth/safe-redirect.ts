const DEFAULT_REDIRECT = "/onboarding/slides";

const ALLOWED_PREFIXES = [
  "/feed",
  "/onboarding",
  "/games",
  "/my-games",
  "/profile",
  "/organizer",
  "/login",
  "/signup",
];

/**
 * Validates OAuth `next` redirect targets to prevent open redirects.
 */
export function getSafeRedirectPath(next: string | null): string {
  if (!next) return DEFAULT_REDIRECT;

  const trimmed = next.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return DEFAULT_REDIRECT;
  }

  if (trimmed.includes("://") || trimmed.includes("\\")) {
    return DEFAULT_REDIRECT;
  }

  const allowed = ALLOWED_PREFIXES.some(
    (prefix) => trimmed === prefix || trimmed.startsWith(`${prefix}/`)
  );

  return allowed ? trimmed : DEFAULT_REDIRECT;
}
