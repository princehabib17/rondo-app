import { describe, expect, it } from "vitest";
import {
  getOnboardingPath,
  getPostOnboardingDestination,
  getRoleHome,
} from "@/lib/auth/destination";

describe("auth destinations", () => {
  it("uses a role-specific home", () => {
    expect(getRoleHome("player")).toBe("/feed");
    expect(getRoleHome("organizer")).toBe("/organizer/dashboard");
    expect(getRoleHome(null)).toBe("/feed");
  });

  it("preserves a protected return destination through onboarding", () => {
    expect(getOnboardingPath("/games/abc/join")).toBe(
      "/onboarding/slides?next=%2Fgames%2Fabc%2Fjoin"
    );
  });

  it("lets the selected role choose the default home", () => {
    expect(getOnboardingPath(null)).toBe("/onboarding/slides");
  });

  it("does not create onboarding loops after profile setup", () => {
    expect(getPostOnboardingDestination("/onboarding/slides", "organizer")).toBe(
      "/organizer/dashboard"
    );
  });
});
