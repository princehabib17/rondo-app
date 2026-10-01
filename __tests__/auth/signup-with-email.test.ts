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
      username: "ab",
      email: "bad",
      password: "short",
    });
    expect(result).toEqual({ ok: false, error: "Enter your name." });
    expect(signUp).not.toHaveBeenCalled();
  });

  it("signs in through the server without waiting on a hanging browser signup", async () => {
    const signUp = vi.fn(
      () =>
        new Promise<{
          data: { user: { id: string } | null; session: unknown };
          error: { message: string } | null;
        }>(() => {})
    );
    const signInWithPassword = vi.fn(async () => ({ error: null }));
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ ok: true, userId: "u1" }),
    })) as unknown as typeof fetch;

    const result = await signupWithEmail({
      supabase: { auth: { signUp, signInWithPassword } },
      fullName: "Juan dela Cruz",
      username: "juan_dc",
      email: "juan@email.com",
      password: "password123",
      fetchImpl,
    });

    expect(signUp).not.toHaveBeenCalled();
    expect(signInWithPassword).toHaveBeenCalledWith({
      email: "juan@email.com",
      password: "password123",
    });
    expect(result).toEqual({ ok: true });
  });

  it("signs in when the email already exists and the password matches", async () => {
    const signInWithPassword = vi.fn(async () => ({ error: null }));
    const fetchImpl = vi.fn(async () => ({
      ok: false,
      status: 409,
      json: async () => ({ error: "An account with this email already exists." }),
    })) as unknown as typeof fetch;

    const result = await signupWithEmail({
      supabase: {
        auth: {
          signUp: vi.fn(),
          signInWithPassword,
        },
      },
      fullName: "Juan dela Cruz",
      username: "juan_dc",
      email: "juan@email.com",
      password: "password123",
      fetchImpl,
    });

    expect(result).toEqual({ ok: true });
  });

  it("uses browser signup only when the server API is down", async () => {
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
      username: "juan_dc",
      email: "juan@email.com",
      password: "password123",
      fetchImpl: vi.fn(async () => {
        throw new Error("fetch failed");
      }) as unknown as typeof fetch,
    });
    expect(result).toEqual({ ok: true });
  });

  it("asks for email confirmation when the server is down and signup has no session", async () => {
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
      username: "juan_dc",
      email: "juan@email.com",
      password: "password123",
      fetchImpl,
    });

    expect(result).toEqual({ ok: true, needsEmailConfirmation: true });
  });
});
