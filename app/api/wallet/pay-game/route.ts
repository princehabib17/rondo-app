import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { payForGameWithWallet } from "@/lib/wallet/ledger";
import { createServiceClient } from "@/lib/supabase/service";

const bodySchema = z.object({
  gameId: z.string().uuid(),
  teamId: z.string().uuid().nullable().optional(),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user || userData.user.is_anonymous) {
      return NextResponse.json({ error: "Please sign in to pay" }, { status: 401 });
    }

    const json = await request.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { gameId, teamId } = parsed.data;

    const result = await payForGameWithWallet({
      userId: userData.user.id,
      gameId,
      teamId: teamId ?? null,
    });

    if (!result.ok) {
      const status =
        result.code === "INSUFFICIENT_BALANCE"
          ? 402
          : result.code === "ALREADY_PAID"
            ? 400
            : 400;
      return NextResponse.json(
        { error: result.error, code: result.code },
        { status }
      );
    }

    const service = createServiceClient();
    await service.from("notifications").insert({
      user_id: userData.user.id,
      type: "payment_success",
      title: "Payment successful",
      body: "Your spot is confirmed. See you on the pitch!",
      link: `/games/${gameId}/confirmed`,
    });

    return NextResponse.json({
      status: "paid",
      balanceCentavos: result.balanceAfter,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Payment failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
