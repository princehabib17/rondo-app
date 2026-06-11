import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { isGuestUser } from "@/lib/auth/is-guest";
import {
  checkAndRecordPaymentAttempt,
  PAYMENT_RATE_LIMIT_MESSAGE,
  settlePaymentAttempt,
} from "@/lib/payments/anti-fraud";
import { getPaymongoAuthHeader } from "@/lib/paymongo/client";
import { MAX_TOPUP_CENTAVOS, MIN_TOPUP_CENTAVOS } from "@/lib/wallet/constants";
import { logPayment } from "@/lib/payments/logger";

const bodySchema = z.object({
  amountCentavos: z.number().int().min(MIN_TOPUP_CENTAVOS).max(MAX_TOPUP_CENTAVOS),
  returnPath: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const secretKey = process.env.PAYMONGO_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json({ error: "Payment not configured" }, { status: 500 });
    }

    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user || isGuestUser(userData.user)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await request.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid amount" },
        { status: 400 }
      );
    }

    const { amountCentavos, returnPath } = parsed.data;

    const service = createServiceClient();
    const risk = await checkAndRecordPaymentAttempt(service, {
      userId: userData.user.id,
      kind: "wallet_topup",
      amountCentavos,
    });
    if (risk.rateLimited) {
      logPayment({ event: "wallet_topup_rate_limited", level: "warn", userId: userData.user.id });
      return NextResponse.json({ error: PAYMENT_RATE_LIMIT_MESSAGE }, { status: 429 });
    }
    if (risk.flagged) {
      logPayment({
        event: "wallet_topup_flagged",
        level: "warn",
        userId: userData.user.id,
        detail: risk.flagReason ?? undefined,
      });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const amountPhp = (amountCentavos / 100).toLocaleString("en-PH");
    const safeReturn =
      returnPath && returnPath.startsWith("/") && !returnPath.startsWith("//")
        ? encodeURIComponent(returnPath)
        : null;
    const returnQuery = safeReturn ? `&next=${safeReturn}` : "";

    const response = await fetch("https://api.paymongo.com/v1/checkout_sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: getPaymongoAuthHeader(),
      },
      body: JSON.stringify({
        data: {
          attributes: {
            billing: { name: userData.user.email ?? "Rondo player" },
            send_email_receipt: true,
            show_description: true,
            show_line_items: true,
            cancel_url: `${appUrl}/wallet?topup=cancelled${returnQuery}`,
            success_url: `${appUrl}/wallet?topup=success${returnQuery}`,
            line_items: [
              {
                currency: "PHP",
                amount: amountCentavos,
                description: "Add funds to your Rondo Wallet",
                name: `Rondo Wallet top-up (₱${amountPhp})`,
                quantity: 1,
              },
            ],
            payment_method_types: ["gcash", "maya", "card", "dob", "brankas_bdo"],
            reference_number: `rondo-wallet-${userData.user.id}-${Date.now()}`,
            metadata: {
              purpose: "wallet_topup",
              user_id: userData.user.id,
              amount_centavos: String(amountCentavos),
            },
          },
        },
      }),
    });

    const paymongoJson = await response.json();
    if (!response.ok) {
      await settlePaymentAttempt(service, risk.attemptId, "failed");
      logPayment({
        event: "wallet_topup_checkout_error",
        level: "error",
        detail: paymongoJson.errors?.[0]?.detail,
      });
      return NextResponse.json(
        { error: paymongoJson.errors?.[0]?.detail ?? "PayMongo error" },
        { status: 500 }
      );
    }

    const checkoutUrl = paymongoJson.data?.attributes?.checkout_url;
    const sessionId = paymongoJson.data?.id as string | undefined;

    logPayment({
      event: "wallet_topup_checkout_created",
      userId: userData.user.id,
      detail: sessionId,
    });

    return NextResponse.json({ checkoutUrl, sessionId });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Top-up failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
