import { describe, expect, it } from "vitest";
import {
  isValidUsername,
  normalizeUsername,
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
});
