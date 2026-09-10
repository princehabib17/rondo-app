import { describe, expect, it } from "vitest";
import { formatAuthError } from "@/lib/auth/format-auth-error";

describe("formatAuthError", () => {
  it("explains abort/unreachable timeouts instead of raw fetch failed", () => {
    expect(formatAuthError("fetch failed")).toMatch(/can't reach login/i);
    expect(formatAuthError("Failed to fetch")).toMatch(/can't reach login/i);
    expect(formatAuthError("The operation was aborted.")).toMatch(/can't reach login/i);
    expect(formatAuthError("Auth service is unreachable right now.")).toMatch(/can't reach login/i);
  });

  it("keeps passkey and phone provider guidance", () => {
    expect(formatAuthError("Unsupported phone provider")).toMatch(/can't text a login code/i);
    expect(formatAuthError("passkey_disabled")).toMatch(/Passkeys aren't enabled/i);
    expect(formatAuthError("Invalid API key")).toMatch(/Can't reach login/i);
  });
});
