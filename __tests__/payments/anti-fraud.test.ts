import { describe, expect, it } from "vitest";
import { evaluatePaymentRisk, PAYMENT_RATE_LIMIT } from "@/lib/payments/anti-fraud";

const base = {
  recentAttempts: 0,
  recentFailures: 0,
  amountCentavos: 20_000, // ₱200
  accountAgeDays: 90,
};

describe("evaluatePaymentRisk", () => {
  it("passes a normal payment", () => {
    expect(evaluatePaymentRisk(base)).toEqual({
      rateLimited: false,
      flagged: false,
      flagReason: null,
    });
  });

  it("rate-limits rapid repeated attempts", () => {
    const result = evaluatePaymentRisk({ ...base, recentAttempts: PAYMENT_RATE_LIMIT.max });
    expect(result.rateLimited).toBe(true);
  });

  it("flags a failure streak", () => {
    const result = evaluatePaymentRisk({ ...base, recentFailures: 3 });
    expect(result.flagged).toBe(true);
    expect(result.flagReason).toContain("failed attempts");
  });

  it("flags high-value attempts from brand-new accounts", () => {
    const result = evaluatePaymentRisk({
      ...base,
      amountCentavos: 500_000, // ₱5,000
      accountAgeDays: 1,
    });
    expect(result.flagged).toBe(true);
    expect(result.flagReason).toContain("day(s) old");
  });

  it("does not flag high-value attempts from established accounts", () => {
    const result = evaluatePaymentRisk({ ...base, amountCentavos: 500_000 });
    expect(result.flagged).toBe(false);
  });

  it("flags without blocking — flagged attempts are not rate limited", () => {
    const result = evaluatePaymentRisk({ ...base, recentFailures: 5 });
    expect(result.rateLimited).toBe(false);
    expect(result.flagged).toBe(true);
  });
});
