const DEFAULT_REDIRECT = "/onboarding/slides";

const ALLOWED_PREFIXES = [
  "/feed",
  "/onboarding",
  "/games",
  "/my-games",
  "/profile",
  "/organizer",
  "/wallet",
  "/tournaments",
  "/scout",
  "/community",
  "/messages",
  "/notifications",
  "/help",
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

  const pathname = trimmed.split(/[?#]/, 1)[0];
  const allowed = ALLOWED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  return allowed ? trimmed : fallback;
}
