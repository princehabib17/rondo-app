import { describe, expect, it } from "vitest";
import { dropOutRule } from "@/lib/match/drop-out";

const now = new Date("2026-10-02T10:00:00Z");
const hoursFromNow = (h: number) => new Date(now.getTime() + h * 3_600_000);

describe("dropOutRule", () => {
  it("releases unpaid spots any time before kickoff", () => {
    expect(dropOutRule({ kickoff: hoursFromNow(1), paymentStatus: "reserved", now })).toEqual({ kind: "free" });
    expect(dropOutRule({ kickoff: hoursFromNow(1), paymentStatus: "venue", now })).toEqual({ kind: "free" });
  });

  it("refunds paid spots a day or more out", () => {
    expect(dropOutRule({ kickoff: hoursFromNow(24), paymentStatus: "paid", now })).toEqual({ kind: "refund" });
    expect(dropOutRule({ kickoff: hoursFromNow(72), paymentStatus: "approved", now })).toEqual({ kind: "refund" });
  });

  it("sends late paid drop-outs to Help", () => {
    expect(dropOutRule({ kickoff: hoursFromNow(23.5), paymentStatus: "paid", now })).toEqual({ kind: "late" });
  });

  it("blocks drop-outs after kickoff", () => {
    expect(dropOutRule({ kickoff: hoursFromNow(-0.1), paymentStatus: "reserved", now })).toEqual({ kind: "started" });
  });
});
