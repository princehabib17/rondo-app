import { describe, expect, it } from "vitest";
import { resolveGuestEntry } from "@/lib/auth/guest";

describe("guest entry", () => {
  it("keeps a real guest session when auth succeeds", () => {
    expect(resolveGuestEntry(true)).toEqual({ ok: true, session: true });
  });

  it("still lets the person into public browse when guest auth is unavailable", () => {
    expect(resolveGuestEntry(false)).toEqual({ ok: true, session: false });
  });
});
