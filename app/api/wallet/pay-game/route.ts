import { NextResponse, after } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { isGuestUser } from "@/lib/auth/is-guest";
import { payForGameWithWallet } from "@/lib/wallet/ledger";
import { createServiceClient } from "@/lib/supabase/service";
import {
  checkAndRecordPaymentAttempt,
  PAYMENT_RATE_LIMIT_MESSAGE,
  settlePaymentAttempt,
} from "@/lib/payments/anti-fraud";

const bodySchema = z.object({
  gameId: z.string().uuid(),
  teamId: z.string().uuid().nullable().optional(),
  idempotencyKey: z.string().min(8).max(128),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user || isGuestUser(userData.user)) {
      return NextResponse.json({ error: "Please sign in to pay" }, { status: 401 });
    }

    const json = await request.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { gameId, teamId, idempotencyKey } = parsed.data;

    const service = createServiceClient();
    const { data: game } = await service
      .from("games")
      .select("price_per_player")
      .eq("id", gameId)
      .single();

    const risk = await checkAndRecordPaymentAttempt(service, {
      userId: userData.user.id,
      kind: "wallet_pay",
      amountCentavos: game?.price_per_player ?? 0,
    });
    if (risk.rateLimited) {
      return NextResponse.json({ error: PAYMENT_RATE_LIMIT_MESSAGE }, { status: 429 });
    }

    const result = await payForGameWithWallet({
      userId: userData.user.id,
      gameId,
      teamId: teamId ?? null,
      idempotencyKey,
    });

    await settlePaymentAttempt(service, risk.attemptId, result.ok ? "succeeded" : "failed");

    if (!result.ok) {
      const status =
        result.code === "INSUFFICIENT_BALANCE"
          ? 402
          : result.code === "IN_PROGRESS"
            ? 409
            : result.code === "ALREADY_PAID"
              ? 400
              : 400;
      return NextResponse.json(
        {
          error: result.error,
          code: result.code,
          balanceCentavos: result.balanceCentavos,
        },
        { status }
      );
    }

    const payerId = userData.user.id;
    after(async () => {
      await service.from("notifications").insert({
        user_id: payerId,
        type: "payment_success",
        title: "Payment successful",
        body: "Your spot is confirmed. See you on the pitch!",
        link: `/games/${gameId}/confirmed`,
      });
    });

    return NextResponse.json({
      status: result.paymentStatus,
      balanceCentavos: result.balanceAfter,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Payment failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
