import { describe, it, expect } from "vitest";
import { getSafeRedirectPath } from "@/lib/auth/safe-redirect";

describe("getSafeRedirectPath", () => {
  it("returns default for null", () => {
    expect(getSafeRedirectPath(null)).toBe("/onboarding/slides");
  });

  it("allows safe internal paths", () => {
    expect(getSafeRedirectPath("/feed")).toBe("/feed");
    expect(getSafeRedirectPath("/games/abc-123")).toBe("/games/abc-123");
  });

  it("blocks open redirects", () => {
    expect(getSafeRedirectPath("//evil.com")).toBe("/onboarding/slides");
    expect(getSafeRedirectPath("https://evil.com")).toBe("/onboarding/slides");
    expect(getSafeRedirectPath("/admin/secret")).toBe("/onboarding/slides");
  });
});
