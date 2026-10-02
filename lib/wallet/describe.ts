export interface WalletTransactionLike {
  direction: "credit" | "debit";
  source: string;
  note?: string | null;
  game?: { title: string } | null;
}

/** Human labels for ledger rows: "Wallet top-up", "Match fee", never "Payment · Payment". */
export function describeWalletTransaction(tx: WalletTransactionLike): { title: string; detail: string | null } {
  const note = tx.note ?? "";
  const gameTitle = tx.game?.title ?? null;

  if (note.startsWith("paymongo_topup:")) return { title: "Wallet top-up", detail: "GCash, Maya, or card" };
  if (note.startsWith("game_earning:")) return { title: "Match earnings", detail: gameTitle };
  if (note.startsWith("wallet_pay:")) return { title: "Match fee", detail: gameTitle };
  if (note.startsWith("refund_reversal:")) return { title: "Refunded to player", detail: gameTitle };
  if (tx.source === "refund") return { title: "Refund", detail: gameTitle };
  if (tx.source === "payout") return { title: "Cash out", detail: "Bank transfer" };
  if (tx.source === "adjustment") return { title: "Adjustment", detail: "By the Rondo team" };
  if (tx.direction === "debit") return { title: "Match fee", detail: gameTitle };
  return { title: gameTitle ? "Match earnings" : "Wallet top-up", detail: gameTitle };
}
