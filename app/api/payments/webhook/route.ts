import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const eventType = body?.data?.attributes?.type;

    if (eventType !== "checkout_session.payment.paid") {
      return NextResponse.json({ received: true });
    }

    const metadata = body?.data?.attributes?.data?.attributes?.metadata;
    const { game_id, user_id, team_id } = metadata ?? {};

    if (!game_id || !user_id) {
      return NextResponse.json({ error: "Missing metadata" }, { status: 400 });
    }

    const supabase = await createClient();

    // Upsert game player record with paid status
    const { error } = await supabase.from("game_players").upsert(
      {
        game_id,
        user_id,
        team_id: team_id ?? null,
        payment_status: "paid",
      },
      { onConflict: "game_id,user_id" }
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ received: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
