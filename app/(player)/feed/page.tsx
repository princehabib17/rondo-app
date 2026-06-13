"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isGuestUser } from "@/lib/auth/is-guest";
import type { Game, Profile } from "@/lib/supabase/types";
import { DEFAULT_CAROUSEL_SLIDES } from "@/lib/feed/carousel-slides";
import { PLACEHOLDER_ORGANIZERS, type OrganizerGroup } from "@/lib/feed/organizers";
import { FeedHeader } from "@/components/feed/FeedHeader";
import { HeroCarousel } from "@/components/feed/HeroCarousel";
import { TopOrganizers } from "@/components/feed/TopOrganizers";
import { FeaturedGameCard, FeaturedGameSkeleton } from "@/components/feed/FeaturedGameCard";
import { NearbyGamesSection } from "@/components/feed/NearbyGamesSection";

type GamesTab = "nearby" | "upcoming";

const PAGE_SIZE = 20;

function pickFeaturedGame(games: Game[]): Game | null {
  if (games.length === 0) return null;
  return [...games].sort((a, b) => {
    const aCount = a.game_players?.length ?? 0;
    const bCount = b.game_players?.length ?? 0;
    if (bCount !== aCount) return bCount - aCount;
    return new Date(a.date_time).getTime() - new Date(b.date_time).getTime();
  })[0];
}

/** Nearby = next 7 days; Upcoming = later than that. */
function partitionByTab(games: Game[], tab: GamesTab): Game[] {
  const now = Date.now();
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  if (tab === "nearby") {
    return games.filter((g) => new Date(g.date_time).getTime() - now <= weekMs);
  }
  return games.filter((g) => new Date(g.date_time).getTime() - now > weekMs);
}

export default function FeedPage() {
  const router = useRouter();
  const [games, setGames] = useState<Game[]>([]);
  const [organizers, setOrganizers] = useState<OrganizerGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<GamesTab>("nearby");
  const [notificationCount, setNotificationCount] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [gamesOffset, setGamesOffset] = useState(0);

  const fetchData = useCallback(async () => {
    const supabase = createClient();
    const now = new Date().toISOString();

    const { data: userData } = await supabase.auth.getUser();
    if (userData.user && !isGuestUser(userData.user)) {
      fetch("/api/matches/expire-reservations", { method: "POST" }).catch(() => {});
      // Redirect users who haven't completed onboarding
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", userData.user.id).single();
      if (!profile?.role) {
        router.replace("/onboarding/slides");
        return;
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
      userData.user
        ? supabase
            .from("notifications")
            .select("id", { count: "exact", head: true })
            .eq("user_id", userData.user.id)
            .is("read_at", null)
        : Promise.resolve({ count: 0, data: null, error: null }),
    ]);

    const fetchedGames = (gamesData as Game[]) ?? [];
    setGames(fetchedGames);
    setHasMore(fetchedGames.length === PAGE_SIZE);
    setGamesOffset(PAGE_SIZE);

    // Only accounts that actually host games qualify — stray profiles with an
    // organizer role but no games (e.g. mis-onboarded players) are excluded.
    const realOrganizers = (
      organizersData as (Profile & { games?: { id: string }[] })[] | null
    )
      ?.filter((profile) => (profile.games?.length ?? 0) > 0)
      .map((profile) => ({
        id: profile.id,
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
        verified: profile.organizer_verified ?? false,
      }));

    // Keep the placeholder groups until real organizers exist, instead of
    // flashing them and then clearing the row.
    setOrganizers(
      realOrganizers && realOrganizers.length > 0 ? realOrganizers : PLACEHOLDER_ORGANIZERS
    );
    setNotificationCount(unreadCount ?? 0);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const supabase = createClient();
    const now = new Date().toISOString();
    const { data } = await supabase
      .from("games")
      .select("*, organizer:profiles!organizer_id(id,full_name,avatar_url), organization:organizations(id,name,slug,logo_url,verified,created_by), game_players(id)")
      .eq("status", "open")
      .gte("date_time", now)
      .order("date_time", { ascending: true })
      .range(gamesOffset, gamesOffset + PAGE_SIZE - 1);
    const more = (data as Game[]) ?? [];
    if (more.length > 0) {
      setGames((prev) => [...prev, ...more]);
      setGamesOffset((off) => off + PAGE_SIZE);
    }
    setHasMore(more.length === PAGE_SIZE);
    setLoadingMore(false);
  }, [gamesOffset, hasMore, loadingMore]);

  useEffect(() => {
    const handler = () => setNotificationCount(0);
    window.addEventListener("notifications-read", handler);
    return () => window.removeEventListener("notifications-read", handler);
  }, []);

  const tabGames = useMemo(() => partitionByTab(games, tab), [games, tab]);
  const featuredGame = useMemo(() => pickFeaturedGame(games), [games]);
  const listGames = useMemo(() => {
    if (!featuredGame) return tabGames;
    return tabGames.filter((g) => g.id !== featuredGame.id);
  }, [tabGames, featuredGame]);

  return (
    <div className="min-h-[100dvh] rondo-page">
      <FeedHeader notificationCount={notificationCount} />

      <HeroCarousel slides={DEFAULT_CAROUSEL_SLIDES} />

      <TopOrganizers organizers={organizers} loading={loading} />

      {loading ? (
        <FeaturedGameSkeleton />
      ) : featuredGame ? (
        <FeaturedGameCard game={featuredGame} />
      ) : null}

      <NearbyGamesSection
        games={listGames}
        tab={tab}
        onTabChange={setTab}
        loading={loading}
        hasMore={hasMore}
        loadingMore={loadingMore}
        onLoadMore={loadMore}
      />
    </div>
  );
}
