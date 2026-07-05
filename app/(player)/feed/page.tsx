import { createClient } from "@/lib/supabase/server";
import { isGuestUser } from "@/lib/auth/is-guest";
import type { Game } from "@/lib/supabase/types";
import { fetchTopOrganizers } from "@/lib/feed/organizer-queries";
import { fetchOpenGames } from "@/lib/supabase/game-queries";
import { FeedPageClient } from "@/components/feed/FeedPageClient";

const PAGE_SIZE = 20;

export default async function FeedPage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  const [initialGames, initialOrganizers, unreadCount] = await Promise.all([
    fetchOpenGames(supabase, { from: 0, to: PAGE_SIZE - 1 }),
    fetchTopOrganizers(supabase),
    user
      ? supabase
          .from("notifications")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .is("read_at", null)
          .then((result) => result.count ?? 0)
      : Promise.resolve(0),
  ]);

  return (
    <FeedPageClient
      initialGames={initialGames as Game[]}
      initialOrganizers={initialOrganizers}
      initialNotificationCount={unreadCount}
      initialHasMore={initialGames.length === PAGE_SIZE}
      shouldExpireReservations={Boolean(user && !isGuestUser(user))}
    />
  );
}
