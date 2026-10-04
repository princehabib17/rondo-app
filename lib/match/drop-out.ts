/** Players can give their spot back with a full wallet refund up to this long before kickoff. */
export const FREE_DROP_OUT_HOURS = 24;

/**
 * Best guess on the client at whether this spot was paid online. "approved"
 * alone is not payment: free and pay-at-venue private matches are approved
 * without money moving. The server decides from the ledger.
 */
export function entryLooksPaid(params: {
  paymentStatus: string | null | undefined;
  pricePerPlayer: number;
  paymentType: string | null | undefined;
}) {
  if (params.paymentStatus === "paid") return true;
  return (
    params.paymentStatus === "approved" && params.pricePerPlayer > 0 && params.paymentType === "online"
  );
}

export type DropOutRule =
  | { kind: "free" }
  | { kind: "refund" }
  | { kind: "late" }
  | { kind: "started" };

/**
 * What happens if this player drops out now:
 * - free: nothing was paid, the spot is simply released
 * - refund: paid, early enough for an automatic wallet refund
 * - late: paid, inside the window, so refunds go through Help
 * - started: kickoff has passed, nothing to drop out of
 */
export function dropOutRule(params: { kickoff: Date | string; paid: boolean; now?: Date }): DropOutRule {
  const now = params.now ?? new Date();
  const msToKickoff = new Date(params.kickoff).getTime() - now.getTime();
  if (msToKickoff <= 0) return { kind: "started" };
  if (!params.paid) return { kind: "free" };
  return msToKickoff >= FREE_DROP_OUT_HOURS * 3_600_000 ? { kind: "refund" } : { kind: "late" };
}

/** True once kickoff has passed: rosters are history and nothing is refunded automatically. */
export function hasKickedOff(kickoff: Date | string, now: Date = new Date()) {
  return new Date(kickoff).getTime() <= now.getTime();
}
