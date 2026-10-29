import { describe, expect, it } from "vitest";
import { GENDER_OPTIONS, genderLabel, isGender } from "@/lib/gender";

describe("gender helpers", () => {
  it("lists the four allowed values", () => {
    expect(GENDER_OPTIONS.map((o) => o.value)).toEqual([
      "male",
      "female",
      "other",
      "prefer_not_to_say",
    ]);
  });

  it("validates and labels known values", () => {
    expect(isGender("male")).toBe(true);
    expect(isGender("nope")).toBe(false);
    expect(genderLabel("female")).toBe("Female");
    expect(genderLabel(null)).toBe("");
  });
});
