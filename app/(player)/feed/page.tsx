import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isGuestUser } from "@/lib/auth/is-guest";
import { fetchOpenGames } from "@/lib/supabase/game-queries";
import {
  fetchAroundYouTournaments,
  fetchHomeNextUp,
  fetchRecentMatches,
  fetchYourTournaments,
} from "@/lib/feed/home-queries";
import { FeedPageClient } from "@/components/feed/FeedPageClient";

export default async function FeedPage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  const userId = user && !isGuestUser(user) ? user.id : null;

  if (user && !isGuestUser(user)) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile?.role) {
      redirect("/onboarding/slides");
    }

    if (profile.role === "organizer") {
      redirect("/organizer/dashboard");
    }
  }

  const [nextUp, yourTournaments, openGames, recentMatches, unreadCount] = await Promise.all([
    fetchHomeNextUp(supabase, userId),
    fetchYourTournaments(supabase, userId),
    fetchOpenGames(supabase, { from: 0, to: 11 }),
    fetchRecentMatches(supabase, userId),
    user
      ? supabase
          .from("notifications")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .is("read_at", null)
          .then((result) => result.count ?? 0)
      : Promise.resolve(0),
  ]);

  const aroundYou = await fetchAroundYouTournaments(
    supabase,
    yourTournaments.map((t) => t.id)
  );

  return (
    <FeedPageClient
      nextUp={nextUp}
      yourTournaments={yourTournaments}
      aroundYou={aroundYou}
      recentMatches={recentMatches}
      openGames={openGames}
      initialNotificationCount={unreadCount}
      shouldExpireReservations={Boolean(userId)}
    />
  );
}
