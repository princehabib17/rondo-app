import { getSafeRedirectPath } from "@/lib/auth/safe-redirect";

export type RondoRole = "player" | "organizer" | "admin" | null | undefined;

export function getRoleHome(role: RondoRole): string {
  return role === "organizer" || role === "admin" ? "/organizer/dashboard" : "/feed";
}

export function getOnboardingPath(rawReturnTo: string | null): string {
  if (!rawReturnTo) return "/onboarding/slides";
  const returnTo = getSafeRedirectPath(rawReturnTo, "/feed");
  if (returnTo.startsWith("/onboarding")) return returnTo;

  const params = new URLSearchParams({ next: returnTo });
  return `/onboarding/slides?${params.toString()}`;
}

export function getPostOnboardingDestination(rawReturnTo: string | null, role: RondoRole): string {
  const home = getRoleHome(role);
  const destination = getSafeRedirectPath(rawReturnTo, home);
  if (destination.startsWith("/onboarding")) {
    const nested = new URL(destination, "https://rondo.local").searchParams.get("next");
    return nested ? getSafeRedirectPath(nested, home) : home;
  }
  if (destination.startsWith("/login") || destination.startsWith("/signup")) {
    return home;
  }
  return destination;
}
