/** Hours after join before an unpaid reservation is released. */
export const RESERVE_TTL_HOURS = 48;

/** Release unpaid reservations this many hours before kick-off. */
export const RESERVE_CUTOFF_HOURS_BEFORE_MATCH = 2;

export const UNPAID_RESERVE_STATUSES = ["reserved", "pending_payment"] as const;

export function isReservationExpired(params: {
  joinedAt: string;
  matchStartsAt: string;
  now?: Date;
}): boolean {
  const now = params.now ?? new Date();
  const joined = new Date(params.joinedAt).getTime();
  const kickoff = new Date(params.matchStartsAt).getTime();
  const ttlMs = RESERVE_TTL_HOURS * 60 * 60 * 1000;
  const cutoffMs = RESERVE_CUTOFF_HOURS_BEFORE_MATCH * 60 * 60 * 1000;

  if (now.getTime() - joined >= ttlMs) return true;
  if (kickoff - now.getTime() <= cutoffMs) return true;
  return false;
}
