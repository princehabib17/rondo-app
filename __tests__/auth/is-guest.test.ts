import { describe, expect, it } from "vitest";
import { isGuestUser, shouldRedirectAwayFromAuth } from "@/lib/auth/is-guest";

describe("auth screen redirect", () => {
  it("keeps guests on login and signup", () => {
    const guest = { is_anonymous: false, user_metadata: { is_guest: true } };
    expect(isGuestUser(guest)).toBe(true);
    expect(shouldRedirectAwayFromAuth(guest)).toBe(false);
    expect(shouldRedirectAwayFromAuth(null)).toBe(false);
  });

  it("sends a real account away from login and signup", () => {
    const account = { is_anonymous: false, user_metadata: { is_guest: false } };
    expect(shouldRedirectAwayFromAuth(account)).toBe(true);
  });
});
