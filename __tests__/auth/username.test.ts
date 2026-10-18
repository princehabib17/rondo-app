import { describe, expect, it } from "vitest";
import {
  isReservedUsername,
  isValidUsername,
  normalizeUsername,
  sanitizeUsernameInput,
  usernameRuleStates,
  usernameValidationError,
} from "@/lib/auth/username";

describe("username helpers", () => {
  it("normalizes casing and leading @", () => {
    expect(normalizeUsername("  @Juan_DC ")).toBe("juan_dc");
  });

  it("accepts valid handles", () => {
    expect(isValidUsername("juan_dc")).toBe(true);
    expect(isValidUsername("abc")).toBe(true);
  });

  it("rejects reserved and bad formats", () => {
    expect(isValidUsername("admin")).toBe(false);
    expect(isValidUsername("ab")).toBe(false);
    expect(isValidUsername("Bad-Name")).toBe(false);
    expect(usernameValidationError("admin")).toMatch(/reserved/i);
  });

  it("sanitizes live input and scores onboarding chips", () => {
    expect(sanitizeUsernameInput("@Prince ")).toBe("prince ");
    expect(sanitizeUsernameInput("thisnameiswaytoolongtofit")).toBe("thisnameiswaytoolong");
    expect(usernameRuleStates("").map((r) => r.met)).toEqual([false, false, false]);
    expect(usernameRuleStates("prince17").every((r) => r.met)).toBe(true);
    expect(usernameRuleStates("prince 17").find((r) => r.id === "spaces")?.met).toBe(false);
    expect(isReservedUsername("Admin")).toBe(true);
  });
});
