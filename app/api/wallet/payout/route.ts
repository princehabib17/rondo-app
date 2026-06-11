import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { isGuestUser } from "@/lib/auth/is-guest";
import { getWalletBalanceCentavos } from "@/lib/wallet/balance";
import {
  checkAndRecordPaymentAttempt,
  PAYMENT_RATE_LIMIT_MESSAGE,
  settlePaymentAttempt,
} from "@/lib/payments/anti-fraud";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user || isGuestUser(userData.user)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: requests } = await supabase
      .from("payout_requests")
      .select("id, amount, status, bank_name, bank_account_name, note, created_at")
      .eq("organizer_id", userData.user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    return NextResponse.json({ requests: requests ?? [] });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user || isGuestUser(userData.user)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { amountCentavos, bankName, bankAccountName, bankAccountNumber } = body as {
      amountCentavos: number;
      bankName: string;
      bankAccountName: string;
      bankAccountNumber: string;
    };

    if (!amountCentavos || amountCentavos < 10000) {
      return NextResponse.json({ error: "Minimum payout is ₱100" }, { status: 400 });
    }
    if (!bankName || !bankAccountName || !bankAccountNumber) {
      return NextResponse.json({ error: "Bank details are required" }, { status: 400 });
    }

    const service = createServiceClient();
    const risk = await checkAndRecordPaymentAttempt(service, {
      userId: userData.user.id,
      kind: "payout_request",
      amountCentavos,
    });
    if (risk.rateLimited) {
      return NextResponse.json({ error: PAYMENT_RATE_LIMIT_MESSAGE }, { status: 429 });
    }

    const balance = await getWalletBalanceCentavos(userData.user.id);
    if (amountCentavos > balance) {
      await settlePaymentAttempt(service, risk.attemptId, "failed");
      return NextResponse.json({ error: "Amount exceeds your available balance" }, { status: 400 });
    }

    // Check for existing pending request
    const { data: pending } = await supabase
      .from("payout_requests")
      .select("id")
      .eq("organizer_id", userData.user.id)
      .eq("status", "pending")
      .maybeSingle();

    if (pending) {
      return NextResponse.json(
        { error: "You already have a pending payout request. Please wait for it to be processed." },
        { status: 409 }
      );
    }

    const { data: req, error: insertErr } = await supabase
      .from("payout_requests")
      .insert({
        organizer_id: userData.user.id,
        amount: amountCentavos,
        bank_name: bankName,
        bank_account_name: bankAccountName,
        bank_account_number: bankAccountNumber,
      })
      .select("id")
      .single();

    if (insertErr) {
      await settlePaymentAttempt(service, risk.attemptId, "failed");
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    await settlePaymentAttempt(service, risk.attemptId, "succeeded");
    return NextResponse.json({ ok: true, requestId: req.id });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}
