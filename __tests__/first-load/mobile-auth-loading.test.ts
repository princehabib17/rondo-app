import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("mobile useAuth loading", () => {
  it("never clears loading on a timer while session or profile is unknown", () => {
    const source = readFileSync(resolve(process.cwd(), "mobile/hooks/useAuth.ts"), "utf8");
    expect(source).not.toMatch(/setTimeout\([\s\S]{0,80}setLoading\(false\)/);
    expect(source).toMatch(/await loadProfile\(session\.user\.id\);\s*if \(!cancelled\) setLoading\(false\)/);
  });
});
