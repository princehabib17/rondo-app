import type { SupabaseClient } from "@supabase/supabase-js";

type LedgerRow = {
  amount: number;
  direction: "credit" | "debit";
  source: string;
  note: string | null;
};

export function refundNote(gameId: string, userId: string) {
  return `refund:${gameId}:${userId}`;
}

export function earningReversalNote(gameId: string, userId: string) {
  return `refund_reversal:${gameId}:${userId}`;
}

/**
 * How much of a player's match fee is still owed back to them, and how much of
 * it the organizer was credited and has not yet handed back. Pure so it can be
 * tested without a database.
 */
export function outstandingRefund(params: {
  gameId: string;
  userId: string;
  pricePerPlayer: number;
  paymentStatus: string | null;
  paidByCard: boolean;
  playerLedger: LedgerRow[];
  organizerLedger: LedgerRow[];
}) {
  const { gameId, userId } = params;
  const paidFromWallet = params.playerLedger
    .filter((row) => row.direction === "debit" && row.source === "payment")
    .reduce((sum, row) => sum + row.amount, 0);
  const alreadyRefunded = params.playerLedger
    .filter((row) => row.direction === "credit" && row.source === "refund")
    .reduce((sum, row) => sum + row.amount, 0);

  // Card checkouts (PayMongo straight to the platform) leave no wallet debit.
  // The platform holds that money, so it comes back as wallet credit.
  const paidByCard =
    paidFromWallet === 0 &&
    params.paidByCard &&
    ["paid", "approved"].includes(params.paymentStatus ?? "")
      ? params.pricePerPlayer
      : 0;

  const toPlayer = Math.max(0, paidFromWallet + paidByCard - alreadyRefunded);

  const earningNotes = new Set([
    `game_earning:${gameId}:${userId}`,
    `private_approval:${gameId}:${userId}`,
  ]);
  const earned = params.organizerLedger
    .filter((row) => row.direction === "credit" && row.note && earningNotes.has(row.note))
    .reduce((sum, row) => sum + row.amount, 0);
  const reversed = params.organizerLedger
    .filter((row) => row.direction === "debit" && row.note === earningReversalNote(gameId, userId))
    .reduce((sum, row) => sum + row.amount, 0);
  const fromOrganizer = Math.max(0, Math.min(earned - reversed, toPlayer + alreadyRefunded));

  return { toPlayer, fromOrganizer };
}

/**
 * Give a player their match fee back as wallet credit and take the matching
 * earning back from the organizer. Safe to call twice: the second call finds
 * nothing outstanding. Needs the service-role client.
 */
export async function refundMatchFee(
  service: SupabaseClient,
  params: {
    gameId: string;
    organizerId: string;
    userId: string;
    pricePerPlayer: number;
    paymentStatus: string | null;
    paymongoPaymentId: string | null;
  }
): Promise<number> {
  const { gameId, organizerId, userId } = params;

  const [{ data: playerLedger, error: playerError }, { data: organizerLedger, error: organizerError }] =
    await Promise.all([
      service
        .from("wallet_transactions")
        .select("amount, direction, source, note")
        .eq("user_id", userId)
        .eq("game_id", gameId),
      service
        .from("wallet_transactions")
        .select("amount, direction, source, note")
        .eq("user_id", organizerId)
        .eq("game_id", gameId)
        .in("note", [
          `game_earning:${gameId}:${userId}`,
          `private_approval:${gameId}:${userId}`,
          earningReversalNote(gameId, userId),
        ]),
    ]);
  if (playerError) throw new Error(playerError.message);
  if (organizerError) throw new Error(organizerError.message);

  const { toPlayer, fromOrganizer } = outstandingRefund({
    gameId,
    userId,
    pricePerPlayer: params.pricePerPlayer,
    paymentStatus: params.paymentStatus,
    paidByCard: Boolean(params.paymongoPaymentId),
    playerLedger: (playerLedger as LedgerRow[] | null) ?? [],
    organizerLedger: userId === organizerId ? [] : ((organizerLedger as LedgerRow[] | null) ?? []),
  });

  if (toPlayer > 0) {
    const { error } = await service.from("wallet_transactions").insert({
      user_id: userId,
      organizer_id: null,
      game_id: gameId,
      amount: toPlayer,
      direction: "credit",
      source: "refund",
      note: refundNote(gameId, userId),
    });
    if (error) throw new Error(error.message);
  }

  if (fromOrganizer > 0) {
    const { error } = await service.from("wallet_transactions").insert({
      user_id: organizerId,
      organizer_id: organizerId,
      game_id: gameId,
      amount: fromOrganizer,
      direction: "debit",
      source: "refund",
      note: earningReversalNote(gameId, userId),
    });
    if (error) throw new Error(error.message);
  }

  return toPlayer;
}
