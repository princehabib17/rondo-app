export type AppRole = "player" | "organizer";

export const ONBOARDING_START_PATH = "/onboarding/slides";

export function isAppRole(role: string | null | undefined): role is AppRole {
  return role === "player" || role === "organizer";
}

export function getRoleHomePath(role: string | null | undefined): string {
  return role === "organizer" ? "/organizer/tournaments" : "/feed";
}

export function getPostOnboardingPath(role: string | null | undefined): string {
  return role === "organizer" ? "/organizer/tournaments/create" : "/feed";
}
