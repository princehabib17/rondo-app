import { describe, expect, it } from "vitest";
import {
  COUNTRY_OPTIONS,
  findCountry,
  getCountryName,
  getFlagEmoji,
  searchCountries,
} from "@/lib/countries";

describe("countries", () => {
  it("lists every current ISO region, including territories", () => {
    const names = COUNTRY_OPTIONS.map((c) => c.name);
    expect(COUNTRY_OPTIONS.length).toBeGreaterThan(240);
    expect(new Set(COUNTRY_OPTIONS.map((c) => c.code)).size).toBe(COUNTRY_OPTIONS.length);
    expect(names[0]).toBe("Afghanistan");
    expect(names).toContain("American Samoa");
    expect(names).toContain("Antigua and Barbuda");
    expect(names).toContain("Eritrea");
    expect(names).toContain("Åland Islands");
    expect(names.at(-1)).toBe("Zimbabwe");
    expect(names).not.toContain("Unknown Region");
  });

  it("searches 'Eri' the way a country picker should", () => {
    expect(searchCountries("Eri").map((c) => c.name)).toEqual([
      "Algeria",
      "American Samoa",
      "Eritrea",
      "Liberia",
      "Nigeria",
    ]);
  });

  it("resolves names, ISO codes, and legacy labels to a flag", () => {
    expect(getFlagEmoji("PH")).toBe("🇵🇭");
    expect(getFlagEmoji("Filipino")).toBe("🇵🇭");
    expect(getFlagEmoji("Philippines")).toBe("🇵🇭");
    expect(getFlagEmoji("US")).toBe("🇺🇸");
    expect(getFlagEmoji("United States")).toBe("🇺🇸");
    expect(getFlagEmoji("england")).toBe("🇬🇧");
    expect(findCountry("AN")?.code).toBe("CW");
    expect(getCountryName("ER")).toBe("Eritrea");
    expect(getFlagEmoji(null)).toBe("");
  });
});
