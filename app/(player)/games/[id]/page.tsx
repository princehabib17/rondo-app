import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { GAME_DETAIL_SELECT } from "@/lib/supabase/game-queries";
import { SupabaseConfigMissing } from "@/components/system/SupabaseConfigMissing";
import MatchDetail from "@/components/match/MatchDetail";
import type { Game } from "@/lib/supabase/types";

export default async function MatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!isSupabaseConfigured()) {
    return <SupabaseConfigMissing />;
  }

  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("games")
    .select(GAME_DETAIL_SELECT)
    .eq("id", id)
    .single();

  return <MatchDetail initialGame={(data as Game | null) ?? null} />;
}
