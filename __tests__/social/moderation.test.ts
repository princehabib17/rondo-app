import { describe, expect, it } from "vitest";
import { moderateContent } from "@/lib/social/moderation";

describe("moderateContent", () => {
  it("passes ordinary football talk", () => {
    expect(moderateContent("What a goal tonight, GGs everyone!").ok).toBe(true);
    expect(moderateContent("Looking for a keeper for Sunday futsal").ok).toBe(true);
  });

  it("blocks profanity", () => {
    expect(moderateContent("that ref is a fucking joke").ok).toBe(false);
    expect(moderateContent("PUTANGINA talo na naman").ok).toBe(false);
  });

  it("blocks digit/symbol obfuscation", () => {
    expect(moderateContent("sh1t call by the ref").ok).toBe(false);
    expect(moderateContent("f.u.c.k.i.n.g terrible").ok).toBe(false);
  });

  it("does not flag innocent words containing blocked fragments", () => {
    expect(moderateContent("a reputable organizer").ok).toBe(true);
    expect(moderateContent("he had to amputate the comparison").ok).toBe(true);
    expect(moderateContent("the class assignment was hard").ok).toBe(true);
  });

  it("is case-insensitive", () => {
    expect(moderateContent("GAGO").ok).toBe(false);
  });
});
