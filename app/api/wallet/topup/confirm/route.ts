import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  isCheckoutSessionPaid,
  retrieveCheckoutSession,
} from "@/lib/paymongo/client";
import {
  creditWallet,
  hasTopUpBeenCredited,
  topUpNote,
} from "@/lib/wallet/ledger";
import { getWalletBalanceCentavos } from "@/lib/wallet/balance";
import { logPayment } from "@/lib/payments/logger";

const bodySchema = z.object({
  sessionId: z.string().min(1).optional(),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user || userData.user.is_anonymous) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await request.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const sessionId = parsed.data.sessionId;
    if (!sessionId) {
      return NextResponse.json({ status: "pending" });
    }

    const session = await retrieveCheckoutSession(sessionId);
    if (!isCheckoutSessionPaid(session)) {
      return NextResponse.json({ status: "pending" });
    }

    const metadata = session.attributes?.metadata as Record<string, string> | undefined;
    if (metadata?.purpose !== "wallet_topup" || metadata.user_id !== userData.user.id) {
      return NextResponse.json({ error: "Invalid top-up session" }, { status: 400 });
    }

    const amountCentavos = Number(metadata.amount_centavos);
    if (!Number.isFinite(amountCentavos) || amountCentavos <= 0) {
      return NextResponse.json({ error: "Invalid amount in session" }, { status: 400 });
    }

    const paymentId =
      session.attributes?.payments?.[0]?.id ??
      (session.attributes?.payment_intent as { id?: string } | undefined)?.id ??
      sessionId;

    const paymentReference =
      session.attributes?.reference_number ??
      paymentId ??
      sessionId;

    if (await hasTopUpBeenCredited(paymentId)) {
      const balanceCentavos = await getWalletBalanceCentavos(userData.user.id);
      return NextResponse.json({
        status: "credited",
        balanceCentavos,
        paymentReference,
      });
    }

    await creditWallet({
      userId: userData.user.id,
      amountCentavos,
      source: "payment",
      note: topUpNote(paymentId),
    });

    logPayment({
      event: "wallet_topup_confirmed",
      userId: userData.user.id,
      detail: String(amountCentavos),
    });

    const balanceCentavos = await getWalletBalanceCentavos(userData.user.id);
    return NextResponse.json({
      status: "credited",
      balanceCentavos,
      amountCentavos,
      paymentReference,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Confirmation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
