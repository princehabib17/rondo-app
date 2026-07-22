import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isGuestUser } from "@/lib/auth/is-guest";
import type { Game, Tournament } from "@/lib/supabase/types";
import { fetchTopOrganizers } from "@/lib/feed/organizer-queries";
import { fetchOpenGames } from "@/lib/supabase/game-queries";
import { FeedPageClient } from "@/components/feed/FeedPageClient";
import { computeLiveSummary, type LiveSummary } from "@/lib/tournament/bracket";
import type { SupabaseClient } from "@supabase/supabase-js";

const PAGE_SIZE = 20;

/**
 * The tournament that leads the home screen: a live one beats one that is
 * still filling up; among equals the one kicking off soonest wins.
 */
async function fetchSpotlightTournament(supabase: SupabaseClient): Promise<Tournament | null> {
  const { data } = await supabase
    .from("tournaments")
    .select("*, tournament_teams(id, status)")
    .in("status", ["active", "registration"])
    .order("starts_at", { ascending: true })
    .limit(12);
  const tournaments = (data as Tournament[]) ?? [];
  return (
    tournaments.find((t) => t.status === "active") ??
    tournaments.find((t) => t.status === "registration") ??
    null
  );
}

/** Real round/progress for the spotlighted tournament, when it's live. */
async function fetchSpotlightLiveSummary(
  supabase: SupabaseClient,
  tournament: Tournament | null
): Promise<LiveSummary | null> {
  if (!tournament || tournament.status !== "active") return null;
  const { data } = await supabase
    .from("tournament_matches")
    .select("round, status")
    .eq("tournament_id", tournament.id);
  const teamCount = tournament.tournament_teams?.filter((t) => t.status === "registered").length ?? 0;
  return computeLiveSummary(tournament.format, teamCount, data ?? []);
}

export default async function FeedPage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

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

  const [initialGames, initialOrganizers, spotlightTournament, unreadCount] = await Promise.all([
    fetchOpenGames(supabase, { from: 0, to: PAGE_SIZE - 1 }),
    fetchTopOrganizers(supabase),
    fetchSpotlightTournament(supabase),
    user
      ? supabase
          .from("notifications")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .is("read_at", null)
          .then((result) => result.count ?? 0)
      : Promise.resolve(0),
  ]);
  const spotlightLiveSummary = await fetchSpotlightLiveSummary(supabase, spotlightTournament);

  return (
    <FeedPageClient
      initialGames={initialGames as Game[]}
      initialOrganizers={initialOrganizers}
      spotlightTournament={spotlightTournament}
      spotlightLiveSummary={spotlightLiveSummary}
      initialNotificationCount={unreadCount}
      initialHasMore={initialGames.length === PAGE_SIZE}
      shouldExpireReservations={Boolean(user && !isGuestUser(user))}
    />
  );
}
