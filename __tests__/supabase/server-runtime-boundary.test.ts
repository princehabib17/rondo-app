import { beforeEach, describe, expect, it, vi } from "vitest";

const requestBoundary = new Error("NEXT_REQUEST_TIME_BOUNDARY");

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => {
    throw requestBoundary;
  }),
  headers: vi.fn(async () => new Headers()),
}));

describe("server Supabase runtime boundary", () => {
  beforeEach(() => {
    vi.resetModules();
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  });

  it("reaches the Next request boundary before validating runtime configuration", async () => {
    const { createClient } = await import("@/lib/supabase/server");

    await expect(createClient()).rejects.toBe(requestBoundary);
  });
});
