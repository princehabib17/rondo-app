import { describe, expect, it } from "vitest";
import { earningReversalNote, outstandingRefund, refundNote } from "@/lib/wallet/refunds";

const gameId = "g1";
const userId = "u1";
const base = { gameId, userId, pricePerPlayer: 30000, paymentStatus: "paid", paidByCard: false };

describe("outstandingRefund", () => {
  it("refunds a wallet payment and reverses the organizer earning", () => {
    expect(
      outstandingRefund({
        ...base,
        playerLedger: [{ amount: 30000, direction: "debit", source: "payment", note: "wallet_pay:k" }],
        organizerLedger: [{ amount: 30000, direction: "credit", source: "payment", note: `game_earning:${gameId}:${userId}` }],
      })
    ).toEqual({ toPlayer: 30000, fromOrganizer: 30000 });
  });

  it("is a no-op the second time", () => {
    expect(
      outstandingRefund({
        ...base,
        playerLedger: [
          { amount: 30000, direction: "debit", source: "payment", note: "wallet_pay:k" },
          { amount: 30000, direction: "credit", source: "refund", note: refundNote(gameId, userId) },
        ],
        organizerLedger: [
          { amount: 30000, direction: "credit", source: "payment", note: `game_earning:${gameId}:${userId}` },
          { amount: 30000, direction: "debit", source: "refund", note: earningReversalNote(gameId, userId) },
        ],
      })
    ).toEqual({ toPlayer: 0, fromOrganizer: 0 });
  });

  it("finishes an organizer reversal that failed after the player was refunded", () => {
    expect(
      outstandingRefund({
        ...base,
        playerLedger: [
          { amount: 30000, direction: "debit", source: "payment", note: "wallet_pay:k" },
          { amount: 30000, direction: "credit", source: "refund", note: refundNote(gameId, userId) },
        ],
        organizerLedger: [{ amount: 30000, direction: "credit", source: "payment", note: `game_earning:${gameId}:${userId}` }],
      })
    ).toEqual({ toPlayer: 0, fromOrganizer: 30000 });
  });

  it("does not take money from the organizer for an unapproved private payment", () => {
    expect(
      outstandingRefund({
        ...base,
        paymentStatus: "pending_approval",
        playerLedger: [{ amount: 30000, direction: "debit", source: "payment", note: "wallet_pay:k" }],
        organizerLedger: [],
      })
    ).toEqual({ toPlayer: 30000, fromOrganizer: 0 });
  });

  it("credits card payers back to their wallet", () => {
    expect(
      outstandingRefund({ ...base, paidByCard: true, playerLedger: [], organizerLedger: [] })
    ).toEqual({ toPlayer: 30000, fromOrganizer: 0 });
  });

  it("owes nothing to someone who only reserved", () => {
    expect(
      outstandingRefund({ ...base, paymentStatus: "reserved", playerLedger: [], organizerLedger: [] })
    ).toEqual({ toPlayer: 0, fromOrganizer: 0 });
  });
});
