import { describe, it, expect } from "vitest";
import { venueTime, venueDate } from "@/lib/match/venue-time";
describe("Philippine venue time", () => {
  it("shows the scheduled evening time for a noon UTC kickoff", () => {
    expect(venueTime("2026-11-01T12:00:00Z")).toBe("8:00 PM");
    expect(venueTime("2026-11-01T10:00:00Z")).toBe("6:00 PM");
  });
  it("uses the venue calendar after midnight in Manila", () => {
    expect(venueDate("2026-11-01T17:00:00Z")).toBe("Mon, Nov 2");
  });
});
