import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { verifyPaymongoSignature } from "@/lib/paymongo/verify-signature";
import { logPayment } from "@/lib/payments/logger";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("paymongo-signature");
  const webhookSecret = process.env.PAYMONGO_WEBHOOK_SECRET_KEY;

  if (!webhookSecret) {
    logPayment({ event: "webhook_skipped", level: "warn", message: "No PAYMONGO_WEBHOOK_SECRET_KEY" });
    return NextResponse.json({ received: true, skipped: true });
  }

  if (!verifyPaymongoSignature(signature, rawBody, webhookSecret)) {
    logPayment({ event: "webhook_signature_invalid", level: "warn" });
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const data = body?.data as Record<string, unknown> | undefined;
  const attributes = data?.attributes as Record<string, unknown> | undefined;
  const eventId = data?.id as string | undefined;
  const eventType = attributes?.type as string | undefined;

  if (!eventId) {
    return NextResponse.json({ error: "Missing event id" }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data: existing } = await supabase
    .from("webhook_events")
    .select("id")
    .eq("id", eventId)
    .maybeSingle();

  if (existing) {
    logPayment({ event: "webhook_duplicate", eventId, eventType });
    return NextResponse.json({ received: true, duplicate: true });
  }

  if (eventType !== "checkout_session.payment.paid") {
    await supabase.from("webhook_events").insert({
      id: eventId,
      event_type: eventType ?? "unknown",
    });
    return NextResponse.json({ received: true });
  }

  try {
    const nested = attributes?.data as Record<string, unknown> | undefined;
    const nestedAttrs = nested?.attributes as Record<string, unknown> | undefined;
    const metadata = nestedAttrs?.metadata as Record<string, string> | undefined;
    const paymentId = nested?.id as string | undefined;

    const game_id = metadata?.game_id;
    const user_id = metadata?.user_id;
    const team_id = metadata?.team_id ?? null;

    if (!game_id || !user_id) {
      logPayment({ event: "webhook_missing_metadata", level: "error", eventId });
      return NextResponse.json({ error: "Missing metadata" }, { status: 400 });
    }

    const { error: upsertError } = await supabase.from("game_players").upsert(
      {
        game_id,
        user_id,
        team_id,
        payment_status: "paid",
        paymongo_payment_id: paymentId ?? null,
      },
      { onConflict: "game_id,user_id" }
    );

    if (upsertError) {
      logPayment({
        event: "webhook_upsert_failed",
        level: "error",
        eventId,
        error: upsertError.message,
      });
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }

    await supabase.from("webhook_events").insert({
      id: eventId,
      event_type: eventType,
    });

    logPayment({ event: "webhook_payment_confirmed", eventId, game_id, user_id });
    return NextResponse.json({ received: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Internal server error";
    logPayment({ event: "webhook_error", level: "error", eventId, message });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
