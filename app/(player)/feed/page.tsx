import { redirect } from "next/navigation";
import { after } from "next/server";
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
import { SupabaseConfigMissing } from "@/components/system/SupabaseConfigMissing";
import { withAuthTimeoutOr } from "@/lib/auth/auth-timeout";
import { ensurePublishedCity } from "@/lib/seed/ensure-published-city";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default async function FeedPage() {
  // The (player) layout renders the same shell, but the page segment still
  // executes; without this guard createClient() throws into the error boundary.
  if (!isSupabaseConfigured()) {
    return <SupabaseConfigMissing />;
  }

  const supabase = await createClient();
  const user = await withAuthTimeoutOr(
    supabase.auth.getUser().then((result) => result.data.user),
    null
  );
  const userId = user && !isGuestUser(user) ? user.id : null;

  if (user && !isGuestUser(user)) {
    const profile = await withAuthTimeoutOr(
      supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single()
        .then((result) => result.data),
      null
    );

    if (!profile?.role) {
      redirect("/onboarding/slides");
    }

    if (profile.role === "organizer") {
      redirect("/organizer/dashboard");
    }
  }

  const [nextUp, yourTournaments, openGames, recentMatches, unreadCount] = await Promise.all([
    withAuthTimeoutOr(fetchHomeNextUp(supabase, userId), null),
    withAuthTimeoutOr(fetchYourTournaments(supabase, userId), []),
    withAuthTimeoutOr(fetchOpenGames(supabase, { from: 0, to: 11 }), []),
    withAuthTimeoutOr(fetchRecentMatches(supabase, userId), []),
    user
      ? withAuthTimeoutOr(
          supabase
            .from("notifications")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id)
            .is("read_at", null)
            .then((result) => result.count ?? 0),
          0
        )
      : Promise.resolve(0),
  ]);

  // Empty city: seed a few placeholder listings after the response is sent so
  // this render never waits on the service client. The next visit shows them.
  if (openGames.length === 0) {
    after(() => ensurePublishedCity());
  }

  const aroundYou = await withAuthTimeoutOr(
    fetchAroundYouTournaments(
      supabase,
      yourTournaments.map((t) => t.id)
    ),
    []
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
