import { describe, expect, it } from "vitest";
import { hasSupabaseAuthCookie } from "@/lib/auth/has-auth-cookie";

describe("hasSupabaseAuthCookie", () => {
  it("is false when the visitor has no session cookie", () => {
    expect(hasSupabaseAuthCookie([])).toBe(false);
    expect(hasSupabaseAuthCookie(["sb-project-auth-token-code-verifier"])).toBe(false);
  });

  it("is true for a session cookie, including chunked ones", () => {
    expect(hasSupabaseAuthCookie(["sb-abc-auth-token"])).toBe(true);
    expect(hasSupabaseAuthCookie(["sb-abc-auth-token.0"])).toBe(true);
  });
});
