import { createServiceClient } from "@/lib/supabase/service";

/** Balance in centavos (PHP × 100). Credits minus debits for the player wallet. */
export async function getWalletBalanceCentavos(userId: string): Promise<number> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("wallet_transactions")
    .select("amount, direction")
    .eq("user_id", userId);

  if (error) throw new Error(error.message);

  return (data ?? []).reduce((sum, row) => {
    return sum + (row.direction === "credit" ? row.amount : -row.amount);
  }, 0);
}
