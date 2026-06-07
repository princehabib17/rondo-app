import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isGuestUser } from "@/lib/auth/is-guest";
import { getWalletBalanceCentavos } from "@/lib/wallet/balance";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user || isGuestUser(userData.user)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const balanceCentavos = await getWalletBalanceCentavos(userData.user.id);

    const { data: transactions } = await supabase
      .from("wallet_transactions")
      .select("id, amount, direction, source, note, game_id, created_at")
      .eq("user_id", userData.user.id)
      .order("created_at", { ascending: false })
      .limit(30);

    return NextResponse.json({
      balanceCentavos,
      transactions: transactions ?? [],
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to load wallet";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
