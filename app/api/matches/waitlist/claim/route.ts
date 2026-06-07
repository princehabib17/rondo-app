import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { isGuestUser } from "@/lib/auth/is-guest";

const bodySchema = z.object({
  gameId: z.string().uuid(),
  teamId: z.string().uuid().nullable().optional(),
});

/** First authenticated waitlisted player to claim while a spot exists wins. */
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
    const service = createServiceClient();

    const { data: wl } = await service
      .from("game_waitlist")
      .select("id, team_id, status")
      .eq("game_id", gameId)
      .eq("user_id", userData.user.id)
      .eq("status", "waiting")
      .maybeSingle();

    if (!wl) {
      return NextResponse.json({ error: "You are not on the waitlist" }, { status: 400 });
    }

    const { data: game } = await service
      .from("games")
      .select("id, max_players, is_private, payment_type, allow_pay_later, registration_open, status")
      .eq("id", gameId)
      .single();

    if (!game || game.status === "cancelled" || game.registration_open === false) {
      return NextResponse.json({ error: "Registration is closed" }, { status: 400 });
    }

    const { count } = await service
      .from("game_players")
      .select("id", { count: "exact", head: true })
      .eq("game_id", gameId);

    if (count !== null && count >= game.max_players) {
      return NextResponse.json({ error: "No spots left — someone else got it" }, { status: 409 });
    }

    const chosenTeam = teamId ?? wl.team_id;
    const needsApproval = Boolean(game.is_private);
    const paymentStatus = needsApproval
      ? "pending_approval"
      : game.payment_type === "online"
        ? game.allow_pay_later
          ? "reserved"
          : "pending_payment"
        : game.allow_pay_later
          ? "reserved"
          : "venue";

    const { error: insertError } = await service.from("game_players").insert({
      game_id: gameId,
      user_id: userData.user.id,
      team_id: chosenTeam,
      payment_status: paymentStatus,
    });

    if (insertError) {
      if (insertError.code === "23505") {
        return NextResponse.json({ error: "Already on roster" }, { status: 400 });
      }
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    await service.from("game_waitlist").delete().eq("id", wl.id);

    return NextResponse.json({
      status: "claimed",
      paymentStatus,
      nextPath:
        paymentStatus === "pending_payment"
          ? `/games/${gameId}/payment?teamId=${chosenTeam ?? ""}`
          : paymentStatus === "pending_approval"
            ? `/games/${gameId}/confirmed`
            : `/games/${gameId}/confirmed`,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Claim failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
