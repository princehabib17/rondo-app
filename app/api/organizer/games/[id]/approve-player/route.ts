import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { isGuestUser } from "@/lib/auth/is-guest";

const bodySchema = z.object({
  playerId: z.string().uuid(),
});

/**
 * Organizer approval for private matches:
 * - Paid from the wallet already: pending_approval -> approved, and the
 *   organizer's earning is settled once.
 * - Not paid yet on an online-paid match: -> reserved, so the player is asked
 *   to pay to confirm (paying then confirms without a second approval).
 * - Free or pay-at-venue match: -> approved.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: gameId } = await params;
    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
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
      .select("id, organizer_id, title, price_per_player, payment_type")
      .eq("id", gameId)
      .single();

    if (!game || game.organizer_id !== userData.user.id) {
      return NextResponse.json({ error: "Not allowed" }, { status: 403 });
    }

    const { data: playerRow } = await service
      .from("game_players")
      .select("id, user_id, payment_status")
      .eq("id", parsed.data.playerId)
      .eq("game_id", gameId)
      .single();

    if (!playerRow) {
      return NextResponse.json({ error: "Player row not found" }, { status: 404 });
    }

    if (playerRow.payment_status !== "pending_approval") {
      return NextResponse.json({ status: playerRow.payment_status });
    }

    const { data: ledger } = await service
      .from("wallet_transactions")
      .select("amount, direction, source")
      .eq("user_id", playerRow.user_id)
      .eq("game_id", gameId);
    const paidCentavos = (ledger ?? []).reduce((sum, row) => {
      if (row.source === "payment" && row.direction === "debit") return sum + row.amount;
      if (row.source === "refund" && row.direction === "credit") return sum - row.amount;
      return sum;
    }, 0);
    const price = game.price_per_player ?? 0;
    const alreadyPaid = price > 0 && paidCentavos >= price;
    const needsPayment = !alreadyPaid && price > 0 && game.payment_type === "online";
    const nextStatus = needsPayment ? "reserved" : "approved";

    const { error: updateError } = await service
      .from("game_players")
      .update({ payment_status: nextStatus })
      .eq("id", playerRow.id);
    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Settle organizer earnings once for pre-paid private approvals.
    if (alreadyPaid) {
      const note = `private_approval:${gameId}:${playerRow.user_id}`;
      const { data: existingCredit } = await service
        .from("wallet_transactions")
        .select("id")
        .eq("user_id", game.organizer_id)
        .eq("organizer_id", game.organizer_id)
        .eq("game_id", gameId)
        .eq("note", note)
        .maybeSingle();

      if (!existingCredit) {
        await service.from("wallet_transactions").insert({
          user_id: game.organizer_id,
          organizer_id: game.organizer_id,
          game_id: gameId,
          amount: price,
          direction: "credit",
          source: "payment",
          note,
        });
      }
    }

    await service.from("notifications").insert({
      user_id: playerRow.user_id,
      type: "approval_accepted",
      title: "You're in",
      body: needsPayment
        ? `You're approved for ${game.title}. Pay to lock in your spot.`
        : `You're approved for ${game.title}.`,
      link: needsPayment ? `/games/${gameId}/payment` : `/games/${gameId}/confirmed`,
    });

    return NextResponse.json({ status: nextStatus });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Approval failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

