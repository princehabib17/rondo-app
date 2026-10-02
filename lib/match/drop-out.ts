/** Players can give their spot back with a full wallet refund up to this long before kickoff. */
export const FREE_DROP_OUT_HOURS = 24;

const PAID_STATUSES = new Set(["paid", "approved"]);

export function isPaidEntry(paymentStatus: string | null | undefined) {
  return PAID_STATUSES.has(paymentStatus ?? "");
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
export function dropOutRule(params: {
  kickoff: Date | string;
  paymentStatus: string | null | undefined;
  now?: Date;
}): DropOutRule {
  const now = params.now ?? new Date();
  const kickoff = new Date(params.kickoff);
  const msToKickoff = kickoff.getTime() - now.getTime();
  if (msToKickoff <= 0) return { kind: "started" };
  if (!isPaidEntry(params.paymentStatus)) return { kind: "free" };
  return msToKickoff >= FREE_DROP_OUT_HOURS * 3_600_000 ? { kind: "refund" } : { kind: "late" };
}
