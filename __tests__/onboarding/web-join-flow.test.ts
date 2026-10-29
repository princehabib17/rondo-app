import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { DRUM_ROW_HEIGHT, drumIndexFromScroll, drumRowStyle } from "@/lib/onboarding/drum";
import { isValidUsername, suggestUsernames } from "@/lib/auth/username";

const read = (p: string) => readFileSync(resolve(process.cwd(), p), "utf8");

describe("drum picker math", () => {
  it("snaps scroll offsets to the nearest row and clamps to the list", () => {
    expect(drumIndexFromScroll(0, 12)).toBe(0);
    expect(drumIndexFromScroll(DRUM_ROW_HEIGHT * 4.4, 12)).toBe(4);
    expect(drumIndexFromScroll(DRUM_ROW_HEIGHT * 4.6, 12)).toBe(5);
    expect(drumIndexFromScroll(DRUM_ROW_HEIGHT * 99, 12)).toBe(11);
    expect(drumIndexFromScroll(-50, 12)).toBe(0);
  });

  it("keeps the centre row flat and fades/tilts rows away from it", () => {
    expect(drumRowStyle(0)).toEqual({ rotateX: -0, opacity: 1, scale: 1 });
    const above = drumRowStyle(-2);
    const below = drumRowStyle(2);
    expect(above.rotateX).toBeGreaterThan(0);
    expect(below.rotateX).toBeLessThan(0);
    expect(below.opacity).toBeLessThan(0.6);
    expect(drumRowStyle(10).opacity).toBeGreaterThan(0);
  });
});

describe("username suggestions", () => {
  it("offers valid, distinct alternatives for a taken name", () => {
    const list = suggestUsernames("prince");
    expect(list.length).toBeGreaterThanOrEqual(3);
    expect(new Set(list).size).toBe(list.length);
    expect(list).not.toContain("prince");
    list.forEach((name) => expect(isValidUsername(name)).toBe(true));
  });

  it("stays within 20 characters for long names", () => {
    suggestUsernames("abcdefghijklmnopqrst").forEach((name) => expect(name.length).toBeLessThanOrEqual(20));
  });
});

describe("web join flow rules", () => {
  it("slides never auto-advance and expose Back, Next and Skip", () => {
    const src = read("app/(onboarding)/onboarding/slides/page.tsx");
    expect(src).not.toMatch(/setInterval|setTimeout/);
    expect(src).toContain("Previous slide");
    expect(src).toContain("Skip");
    expect(src).toMatch(/Get Started/);
  });

  it("birthdate uses the drum picker and cannot be skipped", () => {
    const src = read("app/(onboarding)/onboarding/birthdate/page.tsx");
    expect(src).toContain("<DrumPicker");
    expect(src).not.toMatch(/<select/);
    expect(src).not.toMatch(/skip/i);
  });

  it("gender sits after birthdate and requires a choice before next", () => {
    const draft = read("lib/onboarding/draft.ts");
    expect(draft).toMatch(/id:\s*"birthdate"[\s\S]*id:\s*"gender"[\s\S]*id:\s*"location"/);
    const src = read("app/(onboarding)/onboarding/gender/page.tsx");
    expect(src).toContain("What's your gender?");
    expect(src).toContain("disabled={!selected}");
    expect(src).not.toMatch(/skip/i);
  });

  it("photo crops before saving and location/notifications use the gold assets", () => {
    expect(read("app/(onboarding)/onboarding/photo/page.tsx")).toContain('cropShape="round"');
    expect(read("app/(onboarding)/onboarding/location/page.tsx")).toContain("/onboarding/gold-pin.png");
    expect(read("app/(onboarding)/onboarding/notifications/page.tsx")).toContain("/onboarding/gold-bell.png");
  });
});
