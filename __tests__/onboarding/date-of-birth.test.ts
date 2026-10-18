import { describe, expect, it } from "vitest";
import {
  MIN_AGE,
  clampDay,
  daysInMonth,
  defaultBirthParts,
  fromIsoDate,
  isOldEnough,
  toIsoDate,
  yearRange,
} from "../../mobile/lib/date-of-birth";

describe("date of birth helpers", () => {
  it("counts days in month including leap years", () => {
    expect(daysInMonth(2024, 1)).toBe(29);
    expect(daysInMonth(2025, 1)).toBe(28);
    expect(daysInMonth(2025, 8)).toBe(30);
  });

  it("clamps overflow days when the month is shorter", () => {
    expect(clampDay(2025, 1, 31)).toBe(28);
    expect(toIsoDate({ year: 2025, month: 1, day: 31 })).toBe("2025-02-28");
  });

  it("round-trips ISO dates", () => {
    expect(fromIsoDate("2008-10-06")).toEqual({ year: 2008, month: 9, day: 6 });
    expect(toIsoDate({ year: 2008, month: 9, day: 6 })).toBe("2008-10-06");
  });

  it("defaults to 18 years ago and keeps the year range 13–80", () => {
    const now = new Date(2026, 9, 6);
    expect(defaultBirthParts(now)).toEqual({ year: 2008, month: 9, day: 6 });
    expect(yearRange(now)).toEqual({ min: 1946, max: 2013 });
    expect(isOldEnough({ year: 2013, month: 9, day: 6 }, now)).toBe(true);
    expect(isOldEnough({ year: 2014, month: 9, day: 6 }, now)).toBe(false);
    expect(MIN_AGE).toBe(13);
  });
});
