import { describe, expect, it } from "vitest";
import { dropOutRule, entryLooksPaid, hasKickedOff } from "@/lib/match/drop-out";

const now = new Date("2026-10-02T10:00:00Z");
const hoursFromNow = (h: number) => new Date(now.getTime() + h * 3_600_000);

describe("dropOutRule", () => {
  it("releases unpaid spots any time before kickoff", () => {
    expect(dropOutRule({ kickoff: hoursFromNow(1), paid: false, now })).toEqual({ kind: "free" });
  });

  it("refunds paid spots a day or more out", () => {
    expect(dropOutRule({ kickoff: hoursFromNow(24), paid: true, now })).toEqual({ kind: "refund" });
    expect(dropOutRule({ kickoff: hoursFromNow(72), paid: true, now })).toEqual({ kind: "refund" });
  });

  it("sends late paid drop-outs to Help", () => {
    expect(dropOutRule({ kickoff: hoursFromNow(23.5), paid: true, now })).toEqual({ kind: "late" });
  });

  it("blocks drop-outs after kickoff", () => {
    expect(dropOutRule({ kickoff: hoursFromNow(-0.1), paid: false, now })).toEqual({ kind: "started" });
    expect(hasKickedOff(hoursFromNow(-0.1), now)).toBe(true);
    expect(hasKickedOff(hoursFromNow(0.1), now)).toBe(false);
  });
});

describe("entryLooksPaid", () => {
  it("does not treat an approved free or pay-at-venue spot as paid", () => {
    expect(entryLooksPaid({ paymentStatus: "approved", pricePerPlayer: 0, paymentType: "online" })).toBe(false);
    expect(entryLooksPaid({ paymentStatus: "approved", pricePerPlayer: 30000, paymentType: "venue" })).toBe(false);
    expect(entryLooksPaid({ paymentStatus: "approved", pricePerPlayer: 30000, paymentType: "online" })).toBe(true);
    expect(entryLooksPaid({ paymentStatus: "paid", pricePerPlayer: 30000, paymentType: "online" })).toBe(true);
    expect(entryLooksPaid({ paymentStatus: "reserved", pricePerPlayer: 30000, paymentType: "online" })).toBe(false);
  });
});
