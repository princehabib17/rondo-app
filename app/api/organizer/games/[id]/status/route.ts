import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { isGuestUser } from "@/lib/auth/is-guest";
import { refundMatchFee } from "@/lib/wallet/refunds";
import { hasKickedOff } from "@/lib/match/drop-out";
import { formatPrice } from "@/lib/utils/format";

const bodySchema = z.object({
  status: z.enum(["cancelled", "open"]),
});

/**
 * Organizer cancels or reopens a match. Cancelling refunds every paid player to
 * their wallet, takes the matching earnings back from the organizer, and tells
 * each player. Reopening clears the refunded spots so they count as free again.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: gameId } = await params;
    const parsed = bodySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user || isGuestUser(userData.user)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const service = createServiceClient();
    const { data: game } = await service
      .from("games")
      .select("id, organizer_id, title, price_per_player, status, date_time")
      .eq("id", gameId)
      .single();

    if (!game || game.organizer_id !== userData.user.id) {
      return NextResponse.json({ error: "Not allowed" }, { status: 403 });
    }

    if (parsed.data.status === "open") {
      if (game.status !== "cancelled") {
        return NextResponse.json({ status: game.status });
      }
      await service
        .from("game_players")
        .delete()
        .eq("game_id", gameId)
        .in("payment_status", ["refunded", "cancelled"]);
      const { error } = await service.from("games").update({ status: "open" }).eq("id", gameId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ status: "open" });
    }

    if (game.status === "completed" || hasKickedOff(game.date_time)) {
      return NextResponse.json(
        { error: "This match has already kicked off, so it can't be cancelled. Refund individual players through Help." },
        { status: 409 }
      );
    }

    const { error: statusError } = await service
      .from("games")
      .update({ status: "cancelled" })
      .eq("id", gameId);
    if (statusError) return NextResponse.json({ error: statusError.message }, { status: 500 });

    const { data: roster } = await service
      .from("game_players")
      .select("id, user_id, payment_status, paymongo_payment_id")
      .eq("game_id", gameId);

    let refundedPlayers = 0;
    let refundedTotal = 0;
    const notifications: Array<Record<string, string>> = [];

    for (const row of roster ?? []) {
      if (row.user_id === game.organizer_id) continue;
      const amount = await refundMatchFee(service, {
        gameId,
        organizerId: game.organizer_id,
        userId: row.user_id,
        pricePerPlayer: game.price_per_player ?? 0,
        paymentStatus: row.payment_status,
        paymongoPaymentId: row.paymongo_payment_id,
      });

      if (amount > 0) {
        refundedPlayers += 1;
        refundedTotal += amount;
      }
      if (amount > 0 || row.payment_status !== "refunded") {
        await service
          .from("game_players")
          .update({ payment_status: amount > 0 || row.payment_status === "refunded" ? "refunded" : "cancelled" })
          .eq("id", row.id);
      }

      notifications.push({
        user_id: row.user_id,
        type: "game_cancelled",
        title: "Match cancelled",
        body:
          amount > 0
            ? `${game.title} was cancelled. ${formatPrice(amount)} is back in your wallet.`
            : `${game.title} was cancelled by the organizer.`,
        link: `/games/${gameId}`,
      });
    }

    if (game.status !== "cancelled" && notifications.length > 0) {
      await service.from("notifications").insert(notifications);
    }

    return NextResponse.json({ status: "cancelled", refundedPlayers, refundedTotal });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Could not update the match";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
