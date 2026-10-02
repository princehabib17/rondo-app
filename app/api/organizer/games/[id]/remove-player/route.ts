import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { isGuestUser } from "@/lib/auth/is-guest";
import { refundMatchFee } from "@/lib/wallet/refunds";
import { formatPrice } from "@/lib/utils/format";

const bodySchema = z.object({
  playerId: z.string().uuid(),
});

/** Organizer removes someone from the roster. A paid player gets their fee back first. */
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
      .select("id, organizer_id, title, price_per_player")
      .eq("id", gameId)
      .single();

    if (!game || game.organizer_id !== userData.user.id) {
      return NextResponse.json({ error: "Not allowed" }, { status: 403 });
    }

    const { data: row } = await service
      .from("game_players")
      .select("id, user_id, payment_status, paymongo_payment_id")
      .eq("id", parsed.data.playerId)
      .eq("game_id", gameId)
      .maybeSingle();

    if (!row) {
      return NextResponse.json({ error: "That player is not on this match" }, { status: 404 });
    }

    const refunded =
      row.user_id === game.organizer_id
        ? 0
        : await refundMatchFee(service, {
            gameId,
            organizerId: game.organizer_id,
            userId: row.user_id,
            pricePerPlayer: game.price_per_player ?? 0,
            paymentStatus: row.payment_status,
            paymongoPaymentId: row.paymongo_payment_id,
          });

    const { error: deleteError } = await service.from("game_players").delete().eq("id", row.id);
    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    if (row.user_id !== game.organizer_id) {
      await service.from("notifications").insert({
        user_id: row.user_id,
        type: "removed_from_game",
        title: "Removed from a match",
        body:
          refunded > 0
            ? `The organizer took you off ${game.title}. ${formatPrice(refunded)} is back in your wallet.`
            : `The organizer took you off ${game.title}.`,
        link: `/games/${gameId}`,
      });
    }

    return NextResponse.json({ removed: true, refunded });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Could not remove that player";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
