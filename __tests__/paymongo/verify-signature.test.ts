import { createHmac } from "crypto";
import { describe, it, expect } from "vitest";
import { verifyPaymongoSignature } from "@/lib/paymongo/verify-signature";

describe("verifyPaymongoSignature", () => {
  const secret = "whsk_test_secret";
  const payload = '{"data":{"id":"evt_123"}}';
  const timestamp = "1619426488";

  function buildHeader(mode: "test" | "live") {
    const computed = createHmac("sha256", secret)
      .update(`${timestamp}${payload}`)
      .digest("hex");
    const key = mode === "test" ? "te" : "li";
    return `t=${timestamp},${key}=${computed}`;
  }

  it("accepts valid test mode signature", () => {
    expect(verifyPaymongoSignature(buildHeader("test"), payload, secret)).toBe(true);
  });

  it("accepts valid live mode signature", () => {
    expect(verifyPaymongoSignature(buildHeader("live"), payload, secret)).toBe(true);
  });

  it("rejects invalid signature", () => {
    expect(verifyPaymongoSignature(buildHeader("test"), payload, "wrong-secret")).toBe(false);
  });

  it("rejects missing header", () => {
    expect(verifyPaymongoSignature(null, payload, secret)).toBe(false);
  });
});
