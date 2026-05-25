import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import {
  isCheckoutSessionPaid,
  retrieveCheckoutSession,
} from "@/lib/paymongo/client";
import { logPayment } from "@/lib/payments/logger";

const confirmSchema = z.object({
  gameId: z.string().uuid(),
  sessionId: z.string().min(1).optional(),
});

/**
 * Confirms online payment without a webhook (for local dev and as a fallback).
 * After PayMongo redirects back, the success page calls this with the checkout session id.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = confirmSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { gameId, sessionId } = parsed.data;
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let checkoutSessionId = sessionId;

    if (!checkoutSessionId) {
      const { data: player } = await supabase
        .from("game_players")
        .select("payment_status, paymongo_payment_id")
        .eq("game_id", gameId)
        .eq("user_id", userData.user.id)
        .maybeSingle();

      if (player?.payment_status === "paid") {
        return NextResponse.json({ status: "paid" });
      }

      checkoutSessionId = player?.paymongo_payment_id ?? undefined;
      if (!checkoutSessionId) {
        return NextResponse.json({ status: "pending" });
      }
    }

    const session = await retrieveCheckoutSession(checkoutSessionId);
    if (!isCheckoutSessionPaid(session)) {
      return NextResponse.json({ status: "pending" });
    }

    const metadata = session.attributes?.metadata as Record<string, string> | undefined;
    const metaGameId = metadata?.game_id;
    const metaUserId = metadata?.user_id;

    if (metaGameId !== gameId || metaUserId !== userData.user.id) {
      logPayment({
        event: "confirm_metadata_mismatch",
        level: "warn",
        gameId,
        userId: userData.user.id,
      });
      return NextResponse.json({ error: "Payment does not match this game" }, { status: 400 });
    }

    const service = createServiceClient();
    const paymentId =
      session.attributes?.payments?.[0]?.id ??
      (session.attributes?.payment_intent as { id?: string } | undefined)?.id ??
      null;

    const { error } = await service.from("game_players").upsert(
      {
        game_id: gameId,
        user_id: userData.user.id,
        team_id: metadata?.team_id || null,
        payment_status: "paid",
        paymongo_payment_id: paymentId ?? checkoutSessionId,
      },
      { onConflict: "game_id,user_id" }
    );

    if (error) {
      logPayment({ event: "confirm_upsert_failed", level: "error", error: error.message });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    logPayment({ event: "confirm_payment_success", gameId, userId: userData.user.id });
    return NextResponse.json({ status: "paid" });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Internal server error";
    logPayment({ event: "confirm_error", level: "error", message });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
