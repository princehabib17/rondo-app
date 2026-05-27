import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPaymongoAuthHeader } from "@/lib/paymongo/client";
import { checkoutBodySchema } from "@/lib/payments/checkout-schema";
import { logPayment } from "@/lib/payments/logger";

export async function POST(request: Request) {
  try {
    const secretKey = process.env.PAYMONGO_SECRET_KEY;
    if (!secretKey) {
      logPayment({ event: "checkout_config_error", level: "error" });
      return NextResponse.json({ error: "Payment not configured" }, { status: 500 });
    }

    const json = await request.json();
    const parsed = checkoutBodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid request" },
        { status: 400 }
      );
    }

    const { gameId, teamId } = parsed.data;
    const supabase = await createClient();

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (userData.user.is_anonymous) {
      return NextResponse.json(
        { error: "Please create an account before payment" },
        { status: 403 }
      );
    }

    const { data: game, error: gameError } = await supabase
      .from("games")
      .select("id, title, price_per_player, payment_type, status, max_players")
      .eq("id", gameId)
      .single();

    if (gameError || !game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    if (game.payment_type !== "online") {
      return NextResponse.json(
        { error: "This game does not accept online payment" },
        { status: 400 }
      );
    }

    if (game.status !== "open") {
      return NextResponse.json({ error: "Game is not open for registration" }, { status: 400 });
    }

    if (teamId) {
      const { data: team } = await supabase
        .from("teams")
        .select("id")
        .eq("id", teamId)
        .eq("game_id", gameId)
        .maybeSingle();

      if (!team) {
        return NextResponse.json({ error: "Invalid team for this game" }, { status: 400 });
      }
    }

    const { count: playerCount } = await supabase
      .from("game_players")
      .select("id", { count: "exact", head: true })
      .eq("game_id", gameId);

    if (playerCount !== null && playerCount >= game.max_players) {
      return NextResponse.json({ error: "Game is full" }, { status: 400 });
    }

    const { data: existingPlayer } = await supabase
      .from("game_players")
      .select("payment_status")
      .eq("game_id", gameId)
      .eq("user_id", userData.user.id)
      .maybeSingle();

    if (existingPlayer?.payment_status === "paid") {
      return NextResponse.json({ error: "Already paid for this game" }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const response = await fetch("https://api.paymongo.com/v1/checkout_sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: getPaymongoAuthHeader(),
      },
      body: JSON.stringify({
        data: {
          attributes: {
            billing: { name: userData.user.email },
            send_email_receipt: true,
            show_description: true,
            show_line_items: true,
            cancel_url: `${appUrl}/games/${gameId}/payment`,
            success_url: `${appUrl}/games/${gameId}/confirmed?teamId=${teamId ?? ""}`,
            line_items: [
              {
                currency: "PHP",
                amount: game.price_per_player,
                description: `${game.title} — player slot`,
                name: game.title,
                quantity: 1,
              },
            ],
            payment_method_types: ["gcash", "maya", "card", "dob", "brankas_bdo"],
            reference_number: `rondo-${gameId}-${userData.user.id}-${Date.now()}`,
            metadata: {
              game_id: gameId,
              user_id: userData.user.id,
              team_id: teamId ?? "",
            },
          },
        },
      }),
    });

    const paymongoJson = await response.json();
    if (!response.ok) {
      logPayment({
        event: "checkout_paymongo_error",
        level: "error",
        gameId,
        detail: paymongoJson.errors?.[0]?.detail,
      });
      return NextResponse.json(
        { error: paymongoJson.errors?.[0]?.detail ?? "PayMongo error" },
        { status: 500 }
      );
    }

    const checkoutUrl = paymongoJson.data?.attributes?.checkout_url;
    const checkoutSessionId = paymongoJson.data?.id as string | undefined;

    if (checkoutSessionId) {
      await supabase.from("game_players").upsert(
        {
          game_id: gameId,
          user_id: userData.user.id,
          team_id: teamId ?? null,
          payment_status: "pending_payment",
          paymongo_payment_id: checkoutSessionId,
        },
        { onConflict: "game_id,user_id" }
      );
    }

    logPayment({ event: "checkout_session_created", gameId, userId: userData.user.id });
    return NextResponse.json({ checkoutUrl });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Internal server error";
    logPayment({ event: "checkout_error", level: "error", message });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
