import { afterEach, describe, expect, it, vi } from "vitest";
import { AUTH_TIMEOUT_MS, withAuthTimeout, withAuthTimeoutOr } from "@/lib/auth/auth-timeout";

describe("withAuthTimeout", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("resolves when the promise finishes in time", async () => {
    await expect(withAuthTimeout(Promise.resolve("ok"), 50)).resolves.toBe("ok");
  });

  it("rejects with a human unreachable error when the promise hangs", async () => {
    vi.useFakeTimers();
    const pending = withAuthTimeout(new Promise(() => {}), 2000);
    const assertion = expect(pending).rejects.toThrow(/unreachable/i);
    await vi.advanceTimersByTimeAsync(2000);
    await assertion;
  });

  it("returns the fallback when the promise hangs", async () => {
    vi.useFakeTimers();
    const pending = withAuthTimeoutOr(new Promise<string>(() => {}), "fallback", 2000);
    const assertion = expect(pending).resolves.toBe("fallback");
    await vi.advanceTimersByTimeAsync(2000);
    await assertion;
  });
});

describe("signInAsGuest", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.resetModules();
    vi.doUnmock("@/lib/supabase/client");
  });

  it("fails within the auth timeout when anonymous sign-in hangs", async () => {
    vi.resetModules();
    vi.doMock("@/lib/supabase/client", () => ({
      createClient: () => ({
        auth: {
          signInAnonymously: () => new Promise(() => {}),
          signInWithPassword: () => new Promise(() => {}),
        },
      }),
    }));
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise(() => {}))
    );
    vi.useFakeTimers();

    const { signInAsGuest: hangingGuest } = await import("@/lib/auth/guest");
    const pending = hangingGuest();
    const assertion = expect(pending).resolves.toMatchObject({
      ok: false,
      error: expect.stringMatching(/unreachable/i),
    });
    await vi.advanceTimersByTimeAsync(AUTH_TIMEOUT_MS);
    await assertion;
  });
});
