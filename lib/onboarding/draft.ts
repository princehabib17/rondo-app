import type { Gender } from "@/lib/gender";

export type OnboardingDraft = {
  username: string;
  avatarDataUrl: string | null;
  birthdate: string | null; // YYYY-MM-DD
  gender: Gender | null;
  locationEnabled: boolean;
  lastLat: number | null;
  lastLng: number | null;
  /** Typed area when the player prefers not to share GPS. */
  area: string;
  notificationsEnabled: boolean;
};

const KEY = "rondo.onboarding.draft.v1";

export const EMPTY_DRAFT: OnboardingDraft = {
  username: "",
  avatarDataUrl: null,
  birthdate: null,
  gender: null,
  locationEnabled: false,
  lastLat: null,
  lastLng: null,
  area: "",
  notificationsEnabled: false,
};

export function readOnboardingDraft(): OnboardingDraft {
  if (typeof window === "undefined") return { ...EMPTY_DRAFT };
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return { ...EMPTY_DRAFT };
    return { ...EMPTY_DRAFT, ...JSON.parse(raw) };
  } catch {
    return { ...EMPTY_DRAFT };
  }
}

export function writeOnboardingDraft(patch: Partial<OnboardingDraft>): OnboardingDraft {
  const next = { ...readOnboardingDraft(), ...patch };
  sessionStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export function clearOnboardingDraft() {
  sessionStorage.removeItem(KEY);
}

/** Ordered steps after the intro slides. */
export const JOIN_STEPS = [
  { id: "username", path: "/onboarding/username", label: "Username" },
  { id: "photo", path: "/onboarding/photo", label: "Photo" },
  { id: "birthdate", path: "/onboarding/birthdate", label: "Birthdate" },
  { id: "gender", path: "/onboarding/gender", label: "Gender" },
  { id: "location", path: "/onboarding/location", label: "Location" },
  { id: "notifications", path: "/onboarding/notifications", label: "Notifications" },
  { id: "account", path: "/onboarding/account", label: "Account" },
] as const;

export type JoinStepId = (typeof JOIN_STEPS)[number]["id"];

export function joinStepIndex(id: JoinStepId): number {
  return JOIN_STEPS.findIndex((s) => s.id === id);
}

export function joinProgress(id: JoinStepId): number {
  return (joinStepIndex(id) + 1) / JOIN_STEPS.length;
}

export function joinBackPath(id: JoinStepId): string {
  const i = joinStepIndex(id);
  if (i <= 0) return "/onboarding/slides";
  return JOIN_STEPS[i - 1].path;
}

export function joinNextPath(id: JoinStepId): string {
  const i = joinStepIndex(id);
  if (i < 0 || i >= JOIN_STEPS.length - 1) return "/feed";
  return JOIN_STEPS[i + 1].path;
}
