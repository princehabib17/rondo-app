import { createServiceClient } from "@/lib/supabase/service";

const TOPUP_NOTE_PREFIX = "paymongo_topup:";

export function topUpNote(sessionOrPaymentId: string) {
  return `${TOPUP_NOTE_PREFIX}${sessionOrPaymentId}`;
}

export function isTopUpNote(note: string | null | undefined) {
  return Boolean(note?.startsWith(TOPUP_NOTE_PREFIX));
}

export async function hasTopUpBeenCredited(sessionOrPaymentId: string): Promise<boolean> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("wallet_transactions")
    .select("id")
    .eq("note", topUpNote(sessionOrPaymentId))
    .maybeSingle();
  return Boolean(data);
}

export async function creditWallet(params: {
  userId: string;
  amountCentavos: number;
  source: "payment" | "refund" | "adjustment";
  note?: string | null;
  gameId?: string | null;
}) {
  if (params.amountCentavos <= 0) {
    throw new Error("Credit amount must be positive");
  }

  const supabase = createServiceClient();
  const { error } = await supabase.from("wallet_transactions").insert({
    user_id: params.userId,
    amount: params.amountCentavos,
    direction: "credit",
    source: params.source,
    note: params.note ?? null,
    game_id: params.gameId ?? null,
    organizer_id: null,
  });

  if (error) throw new Error(error.message);
}

export async function creditOrganizerEarnings(params: {
  organizerId: string;
  amountCentavos: number;
  gameId: string;
  note?: string;
}) {
  const supabase = createServiceClient();
  const { error } = await supabase.from("wallet_transactions").insert({
    user_id: params.organizerId,
    organizer_id: params.organizerId,
    game_id: params.gameId,
    amount: params.amountCentavos,
    direction: "credit",
    source: "payment",
    note: params.note ?? `game_earning:${params.gameId}`,
  });

  if (error) throw new Error(error.message);
}

export type PayGameResult =
  | {
      ok: true;
      balanceAfter: number;
      paymentStatus: string;
    }
  | {
      ok: false;
      error: string;
      code:
        | "INSUFFICIENT_BALANCE"
        | "ALREADY_PAID"
        | "GAME_FULL"
        | "TEAM_FULL"
        | "IN_PROGRESS"
        | "INVALID";
      balanceCentavos?: number;
    };

type RpcPayResult = {
  ok: boolean;
  code?: string;
  error?: string;
  balanceAfter?: number;
  balanceCentavos?: number;
  paymentStatus?: string;
};

/** Atomic match payment: balance, capacity, debit, organizer credit, roster — one DB transaction. */
export async function payForGameWithWallet(params: {
  userId: string;
  gameId: string;
  teamId: string | null;
  idempotencyKey: string;
}): Promise<PayGameResult> {
  const supabase = createServiceClient();

  const { data, error } = await supabase.rpc("pay_match_with_wallet", {
    p_user_id: params.userId,
    p_game_id: params.gameId,
    p_team_id: params.teamId,
    p_idempotency_key: params.idempotencyKey,
  });

  if (error) {
    if (error.message.includes("pay_match_with_wallet")) {
      return {
        ok: false,
        error:
          "Wallet payment is not available yet. Run the latest Supabase migration (20260529200000_wallet_pay_atomic.sql).",
        code: "INVALID",
      };
    }
    return { ok: false, error: error.message, code: "INVALID" };
  }

  const row = data as RpcPayResult;
  if (!row?.ok) {
    const code = row?.code ?? "INVALID";
    const allowed = [
      "INSUFFICIENT_BALANCE",
      "ALREADY_PAID",
      "GAME_FULL",
      "TEAM_FULL",
      "IN_PROGRESS",
      "INVALID",
    ] as const;
    const safeCode = allowed.includes(code as (typeof allowed)[number])
      ? (code as (typeof allowed)[number])
      : "INVALID";
    return {
      ok: false,
      error: row?.error ?? "Payment failed",
      code: safeCode,
      balanceCentavos: row?.balanceCentavos,
    };
  }

  return {
    ok: true,
    balanceAfter: row.balanceAfter ?? 0,
    paymentStatus: row.paymentStatus ?? "paid",
  };
}
