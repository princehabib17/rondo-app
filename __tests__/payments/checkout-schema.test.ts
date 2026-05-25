import { describe, it, expect } from "vitest";
import { checkoutBodySchema } from "@/lib/payments/checkout-schema";

describe("checkoutBodySchema", () => {
  const validUuid = "550e8400-e29b-41d4-a716-446655440000";

  it("accepts valid game and team ids", () => {
    const result = checkoutBodySchema.safeParse({
      gameId: validUuid,
      teamId: validUuid,
    });
    expect(result.success).toBe(true);
  });

  it("accepts game without team", () => {
    const result = checkoutBodySchema.safeParse({ gameId: validUuid });
    expect(result.success).toBe(true);
  });

  it("rejects invalid game id", () => {
    const result = checkoutBodySchema.safeParse({ gameId: "not-a-uuid" });
    expect(result.success).toBe(false);
  });
});
