import { createServiceClient } from "@/lib/supabase/service";
import { getWalletBalanceCentavos } from "@/lib/wallet/balance";

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
  | { ok: true; balanceAfter: number }
  | { ok: false; error: string; code: "INSUFFICIENT_BALANCE" | "ALREADY_PAID" | "GAME_FULL" | "INVALID" };

export async function payForGameWithWallet(params: {
  userId: string;
  gameId: string;
  teamId: string | null;
}): Promise<PayGameResult> {
  const supabase = createServiceClient();

  const { data: game, error: gameError } = await supabase
    .from("games")
    .select("id, title, price_per_player, payment_type, status, max_players, organizer_id")
    .eq("id", params.gameId)
    .single();

  if (gameError || !game) {
    return { ok: false, error: "Game not found", code: "INVALID" };
  }

  if (game.payment_type !== "online") {
    return { ok: false, error: "This game does not use wallet payment", code: "INVALID" };
  }

  if (game.status !== "open") {
    return { ok: false, error: "Game is not open for registration", code: "INVALID" };
  }

  if (params.teamId) {
    const { data: team } = await supabase
      .from("teams")
      .select("id")
      .eq("id", params.teamId)
      .eq("game_id", params.gameId)
      .maybeSingle();
    if (!team) {
      return { ok: false, error: "Invalid team", code: "INVALID" };
    }
  }

  const { count: playerCount } = await supabase
    .from("game_players")
    .select("id", { count: "exact", head: true })
    .eq("game_id", params.gameId);

  if (playerCount !== null && playerCount >= game.max_players) {
    return { ok: false, error: "Game is full", code: "GAME_FULL" };
  }

  const { data: existing } = await supabase
    .from("game_players")
    .select("payment_status")
    .eq("game_id", params.gameId)
    .eq("user_id", params.userId)
    .maybeSingle();

  if (existing?.payment_status === "paid") {
    return { ok: false, error: "Already paid for this game", code: "ALREADY_PAID" };
  }

  const price = game.price_per_player;
  const balance = await getWalletBalanceCentavos(params.userId);

  if (balance < price) {
    const shortfall = price - balance;
    return {
      ok: false,
      error: `Insufficient wallet balance. Add at least ₱${(shortfall / 100).toLocaleString("en-PH")} to continue.`,
      code: "INSUFFICIENT_BALANCE",
    };
  }

  const { error: debitError } = await supabase.from("wallet_transactions").insert({
    user_id: params.userId,
    game_id: params.gameId,
    organizer_id: game.organizer_id,
    amount: price,
    direction: "debit",
    source: "payment",
    note: `game_join:${params.gameId}`,
  });

  if (debitError) {
    return { ok: false, error: debitError.message, code: "INVALID" };
  }

  await creditOrganizerEarnings({
    organizerId: game.organizer_id,
    amountCentavos: price,
    gameId: params.gameId,
  });

  const { error: playerError } = await supabase.from("game_players").upsert(
    {
      game_id: params.gameId,
      user_id: params.userId,
      team_id: params.teamId,
      payment_status: "paid",
      paymongo_payment_id: null,
    },
    { onConflict: "game_id,user_id" }
  );

  if (playerError) {
    return { ok: false, error: playerError.message, code: "INVALID" };
  }

  const balanceAfter = balance - price;
  return { ok: true, balanceAfter };
}
