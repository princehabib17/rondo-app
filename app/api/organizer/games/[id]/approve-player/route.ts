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
 * - pending_approval -> approved
 * - If player already paid via wallet, settle organizer earnings once.
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
      .select("id, organizer_id, title, price_per_player")
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

    const wasPaidBeforeApproval = playerRow.payment_status === "pending_approval";

    const { error: updateError } = await service
      .from("game_players")
      .update({ payment_status: "approved" })
      .eq("id", playerRow.id);
    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Settle organizer earnings once for pre-paid private approvals.
    if (wasPaidBeforeApproval && game.price_per_player > 0) {
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
          amount: game.price_per_player,
          direction: "credit",
          source: "payment",
          note,
        });
      }

      await service.from("notifications").insert({
        user_id: playerRow.user_id,
        type: "approval_accepted",
        title: "Approved",
        body: `You're approved for ${game.title}.`,
        link: `/games/${gameId}/confirmed`,
      });
    }

    return NextResponse.json({ status: "approved" });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Approval failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

