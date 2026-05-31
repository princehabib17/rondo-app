import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

const bodySchema = z.object({
  waitlistId: z.string().uuid(),
  teamId: z.string().uuid().nullable().optional(),
});

/** Organizer manually adds a waitlisted player to the roster. */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: gameId } = await params;
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user || userData.user.is_anonymous) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await request.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const service = createServiceClient();
    const { data: game } = await service
      .from("games")
      .select("id, organizer_id, is_private, payment_type, allow_pay_later, max_players, registration_open, status")
      .eq("id", gameId)
      .single();

    if (!game || game.organizer_id !== userData.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: wl } = await service
      .from("game_waitlist")
      .select("id, user_id, team_id, status")
      .eq("id", parsed.data.waitlistId)
      .eq("game_id", gameId)
      .eq("status", "waiting")
      .single();

    if (!wl) {
      return NextResponse.json({ error: "Waitlist entry not found" }, { status: 404 });
    }

    const { count } = await service
      .from("game_players")
      .select("id", { count: "exact", head: true })
      .eq("game_id", gameId);

    if (count !== null && count >= game.max_players) {
      return NextResponse.json({ error: "Match is full" }, { status: 409 });
    }

    const teamId = parsed.data.teamId ?? wl.team_id;
    const needsApproval = Boolean(game.is_private);
    let paymentStatus = needsApproval ? "pending_approval" : "reserved";
    if (!needsApproval && game.payment_type === "online" && !game.allow_pay_later) {
      paymentStatus = "pending_payment";
    }
    if (!needsApproval && game.payment_type === "venue" && !game.allow_pay_later) {
      paymentStatus = "venue";
    }

    const { error: insertError } = await service.from("game_players").insert({
      game_id: gameId,
      user_id: wl.user_id,
      team_id: teamId,
      payment_status: paymentStatus,
    });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    await service.from("game_waitlist").delete().eq("id", wl.id);

    await service.from("notifications").insert({
      user_id: wl.user_id,
      type: "waitlist_added",
      title: "Added to match",
      body: "The organizer added you from the waitlist.",
      link: `/games/${gameId}`,
    });

    return NextResponse.json({ status: "added", paymentStatus });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Add from waitlist failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
