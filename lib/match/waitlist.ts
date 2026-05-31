import { createServiceClient } from "@/lib/supabase/service";

/** Notify every waiting player that a spot may be available (first to claim wins). */
export async function notifyWaitlistSpotOpen(gameId: string, gameTitle: string) {
  const supabase = createServiceClient();

  const { data: rows } = await supabase
    .from("game_waitlist")
    .select("user_id")
    .eq("game_id", gameId)
    .eq("status", "waiting");

  if (!rows?.length) return;

  const notifications = rows.map((r) => ({
    user_id: r.user_id,
    type: "waitlist_spot_open",
    title: "Spot opened up",
    body: `A spot opened for ${gameTitle}. Open the app — first to accept gets in.`,
    link: `/games/${gameId}/join?claim=1`,
  }));

  await supabase.from("notifications").insert(notifications);
}
