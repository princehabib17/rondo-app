import { afterEach, describe, expect, it, vi } from "vitest";
import { withAuthTimeout, withAuthTimeoutOr } from "@/lib/auth/auth-timeout";

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
    const assertion = expect(pending).rejects.toThrow(/can't reach login/i);
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

  it("stores the server session and succeeds", async () => {
    vi.resetModules();
    const setSession = vi.fn(async () => ({ error: null }));
    vi.doMock("@/lib/supabase/client", () => ({
      createClient: () => ({
        auth: { setSession },
      }),
    }));
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          ok: true,
          access_token: "access",
          refresh_token: "refresh",
        }),
      }))
    );

    const { signInAsGuest } = await import("@/lib/auth/guest");
    await expect(signInAsGuest()).resolves.toEqual({ ok: true });
    expect(setSession).toHaveBeenCalledWith({
      access_token: "access",
      refresh_token: "refresh",
    });
  });

  it("fails within the guest timeout when the server never answers", async () => {
    vi.resetModules();
    vi.doMock("@/lib/supabase/client", () => ({
      createClient: () => ({
        auth: { setSession: vi.fn() },
      }),
    }));
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        const error = new Error("The operation was aborted.");
        error.name = "TimeoutError";
        throw error;
      })
    );

    const { signInAsGuest } = await import("@/lib/auth/guest");
    await expect(signInAsGuest()).resolves.toMatchObject({
      ok: false,
      error: expect.stringMatching(/can't reach login/i),
    });
  });
});
