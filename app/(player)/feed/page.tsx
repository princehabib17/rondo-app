"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Game, Profile } from "@/lib/supabase/types";
import { DEFAULT_CAROUSEL_SLIDES } from "@/lib/feed/carousel-slides";
import { PLACEHOLDER_ORGANIZERS, type OrganizerGroup } from "@/lib/feed/organizers";
import { FeedHeader } from "@/components/feed/FeedHeader";
import { HeroCarousel } from "@/components/feed/HeroCarousel";
import { TopOrganizers } from "@/components/feed/TopOrganizers";
import { FeaturedGameCard, FeaturedGameSkeleton } from "@/components/feed/FeaturedGameCard";
import { NearbyGamesSection } from "@/components/feed/NearbyGamesSection";

type GamesTab = "nearby" | "upcoming";

function pickFeaturedGame(games: Game[]): Game | null {
  if (games.length === 0) return null;
  return [...games].sort((a, b) => {
    const aCount = a.game_players?.length ?? 0;
    const bCount = b.game_players?.length ?? 0;
    if (bCount !== aCount) return bCount - aCount;
    return new Date(a.date_time).getTime() - new Date(b.date_time).getTime();
  })[0];
}

function splitGamesByTab(games: Game[], tab: GamesTab): Game[] {
  const now = Date.now();
  const weekMs = 7 * 24 * 60 * 60 * 1000;

  const sorted = [...games].sort(
    (a, b) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime()
  );

  if (tab === "nearby") {
    return sorted.filter((g) => new Date(g.date_time).getTime() - now <= weekMs);
  }

  return sorted.filter((g) => new Date(g.date_time).getTime() - now > weekMs);
}

export default function FeedPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [organizers, setOrganizers] = useState<OrganizerGroup[]>(PLACEHOLDER_ORGANIZERS);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<GamesTab>("nearby");
  const [notificationCount, setNotificationCount] = useState(0);

  const fetchData = useCallback(async () => {
    const supabase = createClient();
    const now = new Date().toISOString();

    const { data: userData } = await supabase.auth.getUser();
    const [{ data: gamesData }, { data: organizersData }, { count: unreadCount }] = await Promise.all([
      supabase
        .from("games")
        .select(
          "*, organizer:profiles!organizer_id(id,full_name,avatar_url), game_players(id)"
        )
        .eq("status", "open")
        .gte("date_time", now)
        .order("date_time", { ascending: true })
        .limit(50),
      supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .eq("role", "organizer")
        .order("created_at", { ascending: false })
        .limit(8),
      userData.user
        ? supabase
            .from("notifications")
            .select("id", { count: "exact", head: true })
            .eq("user_id", userData.user.id)
            .is("read_at", null)
        : Promise.resolve({ count: 0, data: null, error: null }),
    ]);

    setGames((gamesData as Game[]) ?? []);

    const realOrganizers = (organizersData as Profile[] | null)?.map((profile) => ({
      id: profile.id,
      full_name: profile.full_name,
      avatar_url: profile.avatar_url,
      verified: true,
    }));

    setOrganizers(realOrganizers && realOrganizers.length > 0 ? realOrganizers : []);
    setNotificationCount(unreadCount ?? 0);

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const handler = () => setNotificationCount(0);
    window.addEventListener("notifications-read", handler);
    return () => window.removeEventListener("notifications-read", handler);
  }, []);

  const featuredGame = useMemo(() => pickFeaturedGame(games), [games]);
  const listGames = useMemo(() => {
    const filtered = splitGamesByTab(games, tab);
    if (!featuredGame) return filtered;
    return filtered.filter((g) => g.id !== featuredGame.id);
  }, [games, tab, featuredGame]);

  return (
    <div className="min-h-[100dvh] bg-black">
      <FeedHeader notificationCount={notificationCount} />

      <HeroCarousel slides={DEFAULT_CAROUSEL_SLIDES} />

      <TopOrganizers organizers={organizers} />

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
      />
    </div>
  );
}
