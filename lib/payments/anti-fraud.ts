import type { SupabaseClient } from "@supabase/supabase-js";

export type PaymentAttemptKind = "wallet_topup" | "wallet_pay" | "payout_request";

export const PAYMENT_RATE_LIMIT = { max: 5, windowMinutes: 10 };
export const PAYMENT_RATE_LIMIT_MESSAGE =
  "Too many payment attempts — please wait a few minutes before trying again.";

/** Repeated failures inside this window look like card testing / probing. */
const FAILURE_FLAG = { count: 3, windowMinutes: 30 };
/** Big spend from a brand-new account is worth a human look. */
const NEW_ACCOUNT_FLAG = { amountCentavos: 500_000, accountAgeDays: 7 };

export interface PaymentRiskInput {
  /** Attempts of any status in the rate-limit window. */
  recentAttempts: number;
  /** Failed attempts in the failure-flag window. */
  recentFailures: number;
  amountCentavos: number;
  accountAgeDays: number;
}

export interface PaymentRiskResult {
  rateLimited: boolean;
  flagged: boolean;
  flagReason: string | null;
}

/** Pure decision logic — kept separate from the DB so it is unit-testable. */
export function evaluatePaymentRisk(input: PaymentRiskInput): PaymentRiskResult {
  const rateLimited = input.recentAttempts >= PAYMENT_RATE_LIMIT.max;

  let flagReason: string | null = null;
  if (input.recentFailures >= FAILURE_FLAG.count) {
    flagReason = `${input.recentFailures} failed attempts in ${FAILURE_FLAG.windowMinutes} minutes`;
  } else if (
    input.amountCentavos >= NEW_ACCOUNT_FLAG.amountCentavos &&
    input.accountAgeDays < NEW_ACCOUNT_FLAG.accountAgeDays
  ) {
    flagReason = `high-value attempt from account ${Math.floor(input.accountAgeDays)} day(s) old`;
  }

  return { rateLimited, flagged: flagReason !== null, flagReason };
}

/**
 * Evaluates risk for a payment attempt and records it (service role).
 * When rate-limited, nothing is recorded and the caller should reject with 429.
 * Flagged attempts still proceed — the flag is for admin review, not blocking.
 */
export async function checkAndRecordPaymentAttempt(
  service: SupabaseClient,
  input: { userId: string; kind: PaymentAttemptKind; amountCentavos: number; createdAt?: string }
): Promise<PaymentRiskResult & { attemptId: string | null }> {
  const now = Date.now();
  const rateWindow = new Date(now - PAYMENT_RATE_LIMIT.windowMinutes * 60_000).toISOString();
  const failureWindow = new Date(now - FAILURE_FLAG.windowMinutes * 60_000).toISOString();

  const [{ count: recentAttempts }, { count: recentFailures }, { data: profile }] =
    await Promise.all([
      service
        .from("payment_attempts")
        .select("id", { count: "exact", head: true })
        .eq("user_id", input.userId)
        .gte("created_at", rateWindow),
      service
        .from("payment_attempts")
        .select("id", { count: "exact", head: true })
        .eq("user_id", input.userId)
        .eq("status", "failed")
        .gte("created_at", failureWindow),
      service.from("profiles").select("created_at").eq("id", input.userId).single(),
    ]);

  const accountAgeDays = profile?.created_at
    ? (now - new Date(profile.created_at).getTime()) / 86_400_000
    : Number.POSITIVE_INFINITY;

  const risk = evaluatePaymentRisk({
    recentAttempts: recentAttempts ?? 0,
    recentFailures: recentFailures ?? 0,
    amountCentavos: input.amountCentavos,
    accountAgeDays,
  });

  if (risk.rateLimited) {
    return { ...risk, attemptId: null };
  }

  const { data: attempt } = await service
    .from("payment_attempts")
    .insert({
      user_id: input.userId,
      kind: input.kind,
      amount: input.amountCentavos,
      flagged: risk.flagged,
      flag_reason: risk.flagReason,
    })
    .select("id")
    .single();

  return { ...risk, attemptId: attempt?.id ?? null };
}

/** Best-effort outcome update so failure streaks feed back into flagging. */
export async function settlePaymentAttempt(
  service: SupabaseClient,
  attemptId: string | null,
  status: "failed" | "succeeded"
) {
  if (!attemptId) return;
  await service.from("payment_attempts").update({ status }).eq("id", attemptId);
}
