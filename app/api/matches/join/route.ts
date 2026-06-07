import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { isGuestUser } from "@/lib/auth/is-guest";

const bodySchema = z.object({
  gameId: z.string().uuid(),
  teamId: z.string().uuid(),
  paymentStatus: z.enum(["pending_approval", "reserved", "venue"]),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    if (isGuestUser(userData.user)) {
      return NextResponse.json({ error: "Create an account to join" }, { status: 403 });
    }

    const json = await request.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { gameId, teamId, paymentStatus } = parsed.data;
    const userId = userData.user.id;

    const service = createServiceClient();

    // Atomically check capacity and insert using a single transaction-safe query:
    // Count confirmed players, compare against max_players from the games table.
    const { data: game, error: gameError } = await service
      .from("games")
      .select("id, max_players, num_teams, status, registration_open, is_private")
      .eq("id", gameId)
      .single();

    if (gameError || !game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    if (game.status === "cancelled") {
      return NextResponse.json({ error: "This match has been cancelled" }, { status: 409 });
    }

    if (game.registration_open === false) {
      return NextResponse.json({ error: "Registration is closed" }, { status: 409 });
    }

    // Check if user is already in the game
    const { data: existing } = await service
      .from("game_players")
      .select("id")
      .eq("game_id", gameId)
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) {
      // Already joined — idempotent, just update team/status
      await service
        .from("game_players")
        .update({ team_id: teamId, payment_status: paymentStatus })
        .eq("id", existing.id);
      return NextResponse.json({ ok: true });
    }

    // Count current confirmed players — this is the race-condition guard
    const { count, error: countError } = await service
      .from("game_players")
      .select("id", { count: "exact", head: true })
      .eq("game_id", gameId);

    if (countError) {
      return NextResponse.json({ error: "Could not verify capacity" }, { status: 500 });
    }

    if ((count ?? 0) >= game.max_players) {
      return NextResponse.json({ error: "This match is full" }, { status: 409 });
    }

    // Check team capacity if num_teams > 0
    if (game.num_teams > 0 && teamId) {
      const perTeam = Math.ceil(game.max_players / game.num_teams);
      const { count: teamCount } = await service
        .from("game_players")
        .select("id", { count: "exact", head: true })
        .eq("game_id", gameId)
        .eq("team_id", teamId);

      if ((teamCount ?? 0) >= perTeam) {
        return NextResponse.json({ error: "That team is full" }, { status: 409 });
      }
    }

    // Insert — unique constraint on (game_id, user_id) is the final safety net
    const { error: insertError } = await service.from("game_players").insert({
      game_id: gameId,
      user_id: userId,
      team_id: teamId,
      payment_status: paymentStatus,
    });

    if (insertError) {
      if (insertError.code === "23505") {
        return NextResponse.json({ ok: true }); // duplicate, treat as success
      }
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Join failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
