import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { isGuestUser } from "@/lib/auth/is-guest";

const bodySchema = z.object({
  gameId: z.string().uuid(),
  teamId: z.string().uuid().nullable().optional(),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user || isGuestUser(userData.user)) {
      return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    }

    const json = await request.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { gameId, teamId } = parsed.data;

    const { data: game } = await supabase
      .from("games")
      .select("id, title, max_players, status, registration_open")
      .eq("id", gameId)
      .single();

    if (!game) return NextResponse.json({ error: "Match not found" }, { status: 404 });
    if (game.status === "cancelled" || game.registration_open === false) {
      return NextResponse.json({ error: "Registration is closed" }, { status: 400 });
    }

    const { count } = await supabase
      .from("game_players")
      .select("id", { count: "exact", head: true })
      .eq("game_id", gameId);

    if (count !== null && count < game.max_players) {
      return NextResponse.json(
        { error: "Match still has open spots. Join directly instead." },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("game_waitlist").upsert(
      {
        game_id: gameId,
        user_id: userData.user.id,
        team_id: teamId ?? null,
        status: "waiting",
      },
      { onConflict: "game_id,user_id" }
    );

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ status: "waiting" });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Waitlist failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** Leave waitlist (mark refused — stays out until they join again). */
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user || isGuestUser(userData.user)) {
      return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get("gameId");
    if (!gameId) {
      return NextResponse.json({ error: "gameId required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("game_waitlist")
      .update({ status: "refused" })
      .eq("game_id", gameId)
      .eq("user_id", userData.user.id)
      .eq("status", "waiting");

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ status: "refused" });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Leave waitlist failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
