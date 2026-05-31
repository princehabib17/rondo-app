import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { isGuestUser } from "@/lib/auth/is-guest";
import { isReservationExpired, UNPAID_RESERVE_STATUSES } from "@/lib/match/reservations";
import { notifyWaitlistSpotOpen } from "@/lib/match/waitlist";

/**
 * Release expired unpaid reservations (reserved / pending_payment).
 * Callable by signed-in users on app open; optional CRON_SECRET for scheduled jobs.
 */
export async function POST(request: Request) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = request.headers.get("authorization");
    const isCron = Boolean(cronSecret && authHeader === `Bearer ${cronSecret}`);

    if (!isCron) {
      const supabase = await createClient();
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user || isGuestUser(userData.user)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const service = createServiceClient();
    const now = new Date();

    const { data: rows } = await service
      .from("game_players")
      .select(
        "id, user_id, game_id, payment_status, joined_at, game:games(id, title, date_time, status)"
      )
      .in("payment_status", [...UNPAID_RESERVE_STATUSES]);

    type Row = {
      id: string;
      user_id: string;
      game_id: string;
      payment_status: string;
      joined_at: string;
      game: { id: string; title: string; date_time: string; status: string } | null;
    };

    let expired = 0;
    const notifiedGames = new Set<string>();

    for (const raw of (rows as unknown as Row[]) ?? []) {
      const game = Array.isArray(raw.game) ? raw.game[0] : raw.game;
      const row = { ...raw, game };
      if (!game || game.status === "cancelled") continue;
      if (!row.joined_at) continue;

      if (
        !isReservationExpired({
          joinedAt: row.joined_at,
          matchStartsAt: game.date_time,
          now,
        })
      ) {
        continue;
      }

      const { error: deleteError } = await service
        .from("game_players")
        .delete()
        .eq("id", row.id);

      if (deleteError) continue;

      expired += 1;

      await service.from("notifications").insert({
        user_id: row.user_id,
        type: "reservation_expired",
        title: "Reservation released",
        body: `Your unpaid spot for ${game.title} was released. You can join again if spots remain.`,
        link: `/games/${game.id}`,
      });

      if (!notifiedGames.has(game.id)) {
        await notifyWaitlistSpotOpen(game.id, game.title);
        notifiedGames.add(game.id);
      }
    }

    return NextResponse.json({ expired, gamesNotified: notifiedGames.size });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Expire reservations failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
