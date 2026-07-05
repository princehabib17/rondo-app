const DEFAULT_REDIRECT = "/onboarding/slides";

const ALLOWED_PREFIXES = [
  "/feed",
  "/onboarding",
  "/games",
  "/my-games",
  "/tournaments",
  "/profile",
  "/organizer",
  "/login",
  "/signup",
];

/**
 * Validates OAuth `next` redirect targets to prevent open redirects.
 */
export function getSafeRedirectPath(next: string | null, fallback = DEFAULT_REDIRECT): string {
  if (!next) return fallback;

  const trimmed = next.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return fallback;
  }

  if (trimmed.includes("://") || trimmed.includes("\\")) {
    return fallback;
  }

  const allowed = ALLOWED_PREFIXES.some(
    (prefix) => trimmed === prefix || trimmed.startsWith(`${prefix}/`)
  );

  return allowed ? trimmed : fallback;
}
