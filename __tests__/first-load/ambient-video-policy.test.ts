import { describe, expect, it } from "vitest";
import {
  AMBIENT_VIDEO_DELAY_MS,
  shouldSkipAmbientVideo,
} from "@/lib/media/ambient-video-policy";
import { hasSupabaseAuthCookie } from "@/lib/auth/has-auth-cookie";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("first-load: ambient video", () => {
  it("waits more than two seconds so the poster and JS win the first request window", () => {
    expect(AMBIENT_VIDEO_DELAY_MS).toBeGreaterThanOrEqual(2000);
  });

  it("skips the clip on save-data and 2G, not on 4G", () => {
    expect(shouldSkipAmbientVideo({ saveData: true })).toBe(true);
    expect(shouldSkipAmbientVideo({ effectiveType: "2g" })).toBe(true);
    expect(shouldSkipAmbientVideo({ effectiveType: "slow-2g" })).toBe(true);
    expect(shouldSkipAmbientVideo({ effectiveType: "4g" })).toBe(false);
    expect(shouldSkipAmbientVideo(undefined)).toBe(false);
  });

  it("does not mount a <video> until allowVideo, so first HTML cannot start the mp4", () => {
    const source = readFileSync(
      resolve(process.cwd(), "components/media/AmbientVideo.tsx"),
      "utf8"
    );
    expect(source).toContain("allowVideo");
    expect(source).toContain("AMBIENT_VIDEO_DELAY_MS");
    expect(source).toMatch(/\{allowVideo && \(/);
    expect(source).toContain("preload=\"none\"");
  });
});

describe("first-load: anonymous proxy", () => {
  it("treats a visitor with no session cookie as anonymous (no getUser trip)", () => {
    expect(hasSupabaseAuthCookie([])).toBe(false);
    expect(
      hasSupabaseAuthCookie(["sb-xxxx-auth-token-code-verifier"])
    ).toBe(false);
  });

  it("proxy returns immediately when there is no session cookie", () => {
    const source = readFileSync(resolve(process.cwd(), "proxy.ts"), "utf8");
    expect(source).toContain("hasSupabaseAuthCookie");
    expect(source).toContain("return NextResponse.next({ request })");
    expect(source).toMatch(
      /!hasSupabaseAuthCookie\(cookieNames\)[\s\S]+return NextResponse\.next\(\{ request \}\)/
    );
  });
});
