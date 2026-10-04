import { describe, expect, it } from "vitest";
import { buildIcsEvent } from "@/lib/calendar/ics";

describe("buildIcsEvent", () => {
  it("writes a UTC event with a reminder and escaped text", () => {
    const ics = buildIcsEvent({
      uid: "game-1",
      title: "Open Play · Friday Night",
      start: new Date("2026-10-02T12:00:00Z"),
      durationMinutes: 120,
      location: "BGC Turf, Taguig",
      description: "Bring both shirts; dark and light",
    });
    expect(ics).toContain("DTSTART:20261002T120000Z");
    expect(ics).toContain("DTEND:20261002T140000Z");
    expect(ics).toContain("LOCATION:BGC Turf\\, Taguig");
    expect(ics).toContain("DESCRIPTION:Bring both shirts\\; dark and light");
    expect(ics).toContain("TRIGGER:-PT2H");
    expect(ics.split("\r\n")[0]).toBe("BEGIN:VCALENDAR");
  });
});
