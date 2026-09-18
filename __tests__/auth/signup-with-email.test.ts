import { describe, expect, it, vi } from "vitest";
import { isValidEmail, normalizeEmail } from "@/lib/auth/email";
import { signupWithEmail } from "@/lib/auth/signup-with-email";

describe("email helpers", () => {
  it("accepts common emails and rejects junk", () => {
    expect(isValidEmail("you@email.com")).toBe(true);
    expect(isValidEmail("  a@b.co ")).toBe(true);
    expect(isValidEmail("nope")).toBe(false);
    expect(isValidEmail("@x.com")).toBe(false);
  });

  it("normalizes casing and whitespace", () => {
    expect(normalizeEmail("  You@Email.COM ")).toBe("you@email.com");
  });
});

describe("signupWithEmail", () => {
  it("rejects invalid input without calling auth", async () => {
    const signUp = vi.fn();
    const result = await signupWithEmail({
      supabase: { auth: { signUp, signInWithPassword: vi.fn() } },
      fullName: "A",
      email: "bad",
      password: "short",
    });
    expect(result).toEqual({ ok: false, error: "Enter your name." });
    expect(signUp).not.toHaveBeenCalled();
  });

  it("returns ok when client signup yields a session", async () => {
    const result = await signupWithEmail({
      supabase: {
        auth: {
          signUp: vi.fn(async () => ({
            data: { user: { id: "u1" }, session: { access_token: "a" } },
            error: null,
          })),
          signInWithPassword: vi.fn(),
        },
      },
      fullName: "Juan dela Cruz",
      email: "juan@email.com",
      password: "password123",
      fetchImpl: vi.fn(),
    });
    expect(result).toEqual({ ok: true });
  });

  it("falls back to /api/auth/signup and signs in", async () => {
    const signInWithPassword = vi.fn(async () => ({ error: null }));
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      json: async () => ({ ok: true, userId: "u2" }),
    })) as unknown as typeof fetch;

    const result = await signupWithEmail({
      supabase: {
        auth: {
          signUp: vi.fn(async () => ({
            data: { user: { id: "u2" }, session: null },
            error: null,
          })),
          signInWithPassword,
        },
      },
      fullName: "Juan dela Cruz",
      email: "juan@email.com",
      password: "password123",
      fetchImpl,
    });

    expect(fetchImpl).toHaveBeenCalled();
    expect(signInWithPassword).toHaveBeenCalledWith({
      email: "juan@email.com",
      password: "password123",
    });
    expect(result).toEqual({ ok: true });
  });

  it("asks for email confirmation when no session and API unavailable", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error("fetch failed");
    }) as unknown as typeof fetch;

    const result = await signupWithEmail({
      supabase: {
        auth: {
          signUp: vi.fn(async () => ({
            data: { user: { id: "u3" }, session: null },
            error: null,
          })),
          signInWithPassword: vi.fn(),
        },
      },
      fullName: "Juan dela Cruz",
      email: "juan@email.com",
      password: "password123",
      fetchImpl,
    });

    expect(result).toEqual({ ok: true, needsEmailConfirmation: true });
  });
});
