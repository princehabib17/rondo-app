import { createHmac, timingSafeEqual } from "crypto";

/**
 * Verifies PayMongo webhook Paymongo-Signature header.
 * @see https://developers.paymongo.com/docs/webhooks
 */
export function verifyPaymongoSignature(
  signatureHeader: string | null,
  rawPayload: string,
  secret: string
): boolean {
  if (!signatureHeader || !secret) return false;

  const map: Record<string, string> = {};
  for (const part of signatureHeader.split(",")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    map[part.slice(0, eq).trim()] = part.slice(eq + 1).trim();
  }

  const timestamp = map["t"] ?? "";
  const sigTest = map["te"] ?? "";
  const sigLive = map["li"] ?? "";
  const computed = createHmac("sha256", secret)
    .update(`${timestamp}${rawPayload}`)
    .digest("hex");

  const safeCompare = (a: string, b: string) => {
    try {
      const bufA = Buffer.from(a, "hex");
      const bufB = Buffer.from(b, "hex");
      if (bufA.length !== bufB.length) return false;
      return timingSafeEqual(bufA, bufB);
    } catch {
      return false;
    }
  };

  if (sigTest && safeCompare(sigTest, computed)) return true;
  if (sigLive && safeCompare(sigLive, computed)) return true;
  return false;
}
