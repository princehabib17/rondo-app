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

    const { gameId, teamId, paymentStatus: requestedPaymentStatus } = parsed.data;
    const userId = userData.user.id;

    const service = createServiceClient();

    // Check capacity and insert, then re-verify below — see the post-insert
    // recount for why this pre-check alone is NOT sufficient to prevent overselling.
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

    // Private games always require organizer approval — the client's requested
    // status is only honored for public games.
    const paymentStatus = game.is_private ? "pending_approval" : requestedPaymentStatus;

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

    // Count current confirmed players — a best-effort guard, not a hard guarantee
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
    const perTeam = game.num_teams > 0 ? Math.ceil(game.max_players / game.num_teams) : null;
    if (perTeam !== null && teamId) {
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
    // against duplicate joins, but NOT against overselling capacity: this
    // check-then-insert is still racy under concurrency, so we re-count below
    // and roll back the insert if it turns out to have oversold the game/team.
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

    // Post-insert compensation: re-count now that our row is committed. The
    // count includes the row we just inserted, so overflow is count > cap
    // (not >=).
    const { count: postCount, error: postCountError } = await service
      .from("game_players")
      .select("id", { count: "exact", head: true })
      .eq("game_id", gameId);

    if (!postCountError && (postCount ?? 0) > game.max_players) {
      await service.from("game_players").delete().eq("game_id", gameId).eq("user_id", userId);
      return NextResponse.json({ error: "This match is full" }, { status: 409 });
    }

    if (perTeam !== null && teamId) {
      const { count: postTeamCount, error: postTeamCountError } = await service
        .from("game_players")
        .select("id", { count: "exact", head: true })
        .eq("game_id", gameId)
        .eq("team_id", teamId);

      if (!postTeamCountError && (postTeamCount ?? 0) > perTeam) {
        await service.from("game_players").delete().eq("game_id", gameId).eq("user_id", userId);
        return NextResponse.json({ error: "That team is full" }, { status: 409 });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Join failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
