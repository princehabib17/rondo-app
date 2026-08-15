import { describe, it, expect, vi, afterEach } from "vitest";
import { formatAuthError } from "@/lib/auth/format-auth-error";
import { isPasskeySupported, renamePasskey } from "@/lib/auth/passkey";

describe("formatAuthError passkey messages", () => {
  it("maps passkey_disabled", () => {
    expect(formatAuthError("passkey_disabled")).toMatch(/aren't enabled/i);
  });

  it("maps challenge expiry", () => {
    expect(formatAuthError("webauthn_challenge_expired")).toMatch(/timed out/i);
  });

  it("maps unsupported WebAuthn", () => {
    expect(formatAuthError("Browser does not support WebAuthn")).toMatch(/doesn't support passkeys/i);
  });

  it("maps cancelled ceremonies", () => {
    expect(formatAuthError("NotAllowedError: The operation was aborted.")).toMatch(/cancelled/i);
  });

  it("keeps phone provider mapping", () => {
    expect(formatAuthError("Unsupported phone provider")).toMatch(/Phone login isn't enabled/i);
  });
});

describe("isPasskeySupported", () => {
  const originalWindow = globalThis.window;
  const originalNavigator = globalThis.navigator;

  afterEach(() => {
    Object.defineProperty(globalThis, "window", {
      value: originalWindow,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(globalThis, "navigator", {
      value: originalNavigator,
      configurable: true,
      writable: true,
    });
  });

  it("returns false when PublicKeyCredential is missing", () => {
    Object.defineProperty(globalThis, "window", {
      value: { PublicKeyCredential: undefined },
      configurable: true,
      writable: true,
    });
    Object.defineProperty(globalThis, "navigator", {
      value: { credentials: { create: vi.fn(), get: vi.fn() } },
      configurable: true,
      writable: true,
    });
    expect(isPasskeySupported()).toBe(false);
  });

  it("returns true when WebAuthn APIs exist", () => {
    Object.defineProperty(globalThis, "window", {
      value: { PublicKeyCredential: function PublicKeyCredential() {} },
      configurable: true,
      writable: true,
    });
    Object.defineProperty(globalThis, "navigator", {
      value: {
        credentials: {
          create: vi.fn(),
          get: vi.fn(),
        },
      },
      configurable: true,
      writable: true,
    });
    expect(isPasskeySupported()).toBe(true);
  });
});

describe("renamePasskey", () => {
  it("rejects blank names without calling the network", async () => {
    const result = await renamePasskey("pk-1", "   ");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/Enter a name/i);
  });
});
