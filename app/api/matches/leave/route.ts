import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { isGuestUser } from "@/lib/auth/is-guest";
import { dropOutRule, FREE_DROP_OUT_HOURS } from "@/lib/match/drop-out";
import { notifyWaitlistSpotOpen } from "@/lib/match/waitlist";
import { loadRefundState, refundMatchFee } from "@/lib/wallet/refunds";
import { formatPrice } from "@/lib/utils/format";

const bodySchema = z.object({
  gameId: z.string().uuid(),
});

/**
 * A player gives their spot back. Unpaid spots are released any time before
 * kickoff; paid spots are refunded to the wallet up to FREE_DROP_OUT_HOURS
 * before kickoff, after which refunds go through Help.
 */
export async function POST(request: Request) {
  try {
    const parsed = bodySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    const { gameId } = parsed.data;

    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user || isGuestUser(user)) {
      return NextResponse.json({ error: "Sign in to manage your spot" }, { status: 401 });
    }

    const service = createServiceClient();
    const [{ data: game }, { data: row }] = await Promise.all([
      service
        .from("games")
        .select("id, title, organizer_id, date_time, status, price_per_player")
        .eq("id", gameId)
        .single(),
      service
        .from("game_players")
        .select("id, payment_status, paymongo_payment_id")
        .eq("game_id", gameId)
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

    if (!game) return NextResponse.json({ error: "Match not found" }, { status: 404 });
    if (!row) return NextResponse.json({ error: "You're not on this match" }, { status: 404 });
    if (game.status === "cancelled") {
      return NextResponse.json({ error: "This match was cancelled. Any fee is already back in your wallet." }, { status: 409 });
    }

    const refundParams = {
      gameId,
      organizerId: game.organizer_id,
      userId: user.id,
      pricePerPlayer: game.price_per_player ?? 0,
      paymentStatus: row.payment_status,
      paymongoPaymentId: row.paymongo_payment_id,
    };
    // Paid means money actually moved for this spot, not just an "approved" status.
    const { toPlayer } = await loadRefundState(service, refundParams);
    const rule = dropOutRule({ kickoff: game.date_time, paid: toPlayer > 0 });
    if (rule.kind === "started" || game.status === "completed") {
      return NextResponse.json({ error: "This match has already kicked off." }, { status: 409 });
    }
    if (rule.kind === "late") {
      return NextResponse.json(
        {
          error: `Kickoff is less than ${FREE_DROP_OUT_HOURS} hours away, so refunds go through Help.`,
          code: "LATE",
        },
        { status: 409 }
      );
    }

    const refunded = rule.kind === "refund" ? await refundMatchFee(service, refundParams) : 0;

    const { error: deleteError } = await service.from("game_players").delete().eq("id", row.id);
    if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });

    const { data: profile } = await service.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
    const name = profile?.full_name?.trim() || "A player";
    if (game.organizer_id !== user.id) {
      await service.from("notifications").insert({
        user_id: game.organizer_id,
        type: "player_dropped_out",
        title: "A spot opened up",
        body: refunded > 0
          ? `${name} dropped out of ${game.title} and was refunded ${formatPrice(refunded)}.`
          : `${name} dropped out of ${game.title}.`,
        link: `/organizer/games/${gameId}/manage`,
      });
    }
    await notifyWaitlistSpotOpen(gameId, game.title);

    return NextResponse.json({ left: true, refunded });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Could not drop out";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
