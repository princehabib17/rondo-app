import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isGuestUser } from "@/lib/auth/is-guest";
import type { Game, Profile } from "@/lib/supabase/types";
import { PLACEHOLDER_ORGANIZERS, type OrganizerGroup } from "@/lib/feed/organizers";
import { FeedPageClient } from "@/components/feed/FeedPageClient";

const PAGE_SIZE = 20;

function normalizeOrganizers(
  organizersData: (Profile & { games?: { id: string }[] })[] | null
): OrganizerGroup[] {
  const realOrganizers = organizersData
    ?.filter((profile) => (profile.games?.length ?? 0) > 0)
    .map((profile) => ({
      id: profile.id,
      full_name: profile.full_name,
      avatar_url: profile.avatar_url,
      verified: profile.organizer_verified ?? false,
    }));

  return realOrganizers && realOrganizers.length > 0 ? realOrganizers : PLACEHOLDER_ORGANIZERS;
}

export default async function FeedPage() {
  const supabase = await createClient();
  const now = new Date().toISOString();
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
  }

  const [{ data: gamesData }, { data: organizersData }, { count: unreadCount }] = await Promise.all([
    supabase
      .from("games")
      .select(
        "*, organizer:profiles!organizer_id(id,full_name,avatar_url), organization:organizations(id,name,slug,logo_url,verified,created_by), game_players(id)"
      )
      .eq("status", "open")
      .gte("date_time", now)
      .order("date_time", { ascending: true })
      .range(0, PAGE_SIZE - 1),
    supabase
      .from("profiles")
      .select("id, full_name, avatar_url, organizer_verified, games!organizer_id(id)")
      .eq("role", "organizer")
      .order("created_at", { ascending: false })
      .limit(20),
    user
      ? supabase
          .from("notifications")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .is("read_at", null)
      : Promise.resolve({ count: 0, data: null, error: null }),
  ]);

  const initialGames = (gamesData as Game[]) ?? [];

  return (
    <FeedPageClient
      initialGames={initialGames}
      initialOrganizers={normalizeOrganizers(
        organizersData as (Profile & { games?: { id: string }[] })[] | null
      )}
      initialNotificationCount={unreadCount ?? 0}
      initialHasMore={initialGames.length === PAGE_SIZE}
      shouldExpireReservations={Boolean(user && !isGuestUser(user))}
    />
  );
}
