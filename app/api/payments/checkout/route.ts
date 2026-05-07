import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const { gameId, teamId } = await request.json();
    const supabase = await createClient();

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: game } = await supabase
      .from("games")
      .select("id, title, price_per_player")
      .eq("id", gameId)
      .single();

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    // Create PayMongo checkout session
    const response = await fetch("https://api.paymongo.com/v1/checkout_sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(
          process.env.PAYMONGO_SECRET_KEY + ":"
        ).toString("base64")}`,
      },
      body: JSON.stringify({
        data: {
          attributes: {
            billing: { name: userData.user.email },
            send_email_receipt: true,
            show_description: true,
            show_line_items: true,
            cancel_url: `${appUrl}/games/${gameId}/payment`,
            success_url: `${appUrl}/games/${gameId}/confirmed?teamId=${teamId}&userId=${userData.user.id}`,
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
              team_id: teamId,
            },
          },
        },
      }),
    });

    const json = await response.json();
    if (!response.ok) {
      return NextResponse.json(
        { error: json.errors?.[0]?.detail ?? "PayMongo error" },
        { status: 500 }
      );
    }

    const checkoutUrl = json.data?.attributes?.checkout_url;
    return NextResponse.json({ checkoutUrl });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
