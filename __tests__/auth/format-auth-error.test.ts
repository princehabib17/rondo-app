import { describe, expect, it } from "vitest";
import { formatAuthError } from "@/lib/auth/format-auth-error";

describe("formatAuthError", () => {
  it("explains abort/unreachable timeouts instead of raw fetch failed", () => {
    expect(formatAuthError("fetch failed")).toMatch(/unreachable/i);
    expect(formatAuthError("Failed to fetch")).toMatch(/unreachable/i);
    expect(formatAuthError("The operation was aborted.")).toMatch(/unreachable/i);
    expect(formatAuthError("Auth service is unreachable right now.")).toMatch(/unreachable/i);
  });

  it("keeps passkey and phone provider guidance", () => {
    expect(formatAuthError("Unsupported phone provider")).toMatch(/Phone login/i);
    expect(formatAuthError("passkey_disabled")).toMatch(/Passkeys aren't enabled/i);
  });
});
