"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Game } from "@/lib/supabase/types";
import { DEFAULT_CAROUSEL_SLIDES } from "@/lib/feed/carousel-slides";
import type { OrganizerGroup } from "@/lib/feed/organizers";
import { FeedHeader } from "@/components/feed/FeedHeader";
import { HeroCarousel } from "@/components/feed/HeroCarousel";
import { TopOrganizers } from "@/components/feed/TopOrganizers";
import { FeaturedGameCard } from "@/components/feed/FeaturedGameCard";
import { NearbyGamesSection } from "@/components/feed/NearbyGamesSection";

type GamesTab = "nearby" | "upcoming";

const PAGE_SIZE = 20;

interface FeedPageClientProps {
  initialGames: Game[];
  initialOrganizers: OrganizerGroup[];
  initialNotificationCount: number;
  initialHasMore: boolean;
  shouldExpireReservations: boolean;
}

function pickFeaturedGame(games: Game[]): Game | null {
  if (games.length === 0) return null;
  return [...games].sort((a, b) => {
    const aCount = a.game_players?.length ?? 0;
    const bCount = b.game_players?.length ?? 0;
    if (bCount !== aCount) return bCount - aCount;
    return new Date(a.date_time).getTime() - new Date(b.date_time).getTime();
  })[0];
}

function partitionByTab(games: Game[], tab: GamesTab): Game[] {
  const now = Date.now();
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  if (tab === "nearby") {
    return games.filter((game) => new Date(game.date_time).getTime() - now <= weekMs);
  }
  return games.filter((game) => new Date(game.date_time).getTime() - now > weekMs);
}

export function FeedPageClient({
  initialGames,
  initialOrganizers,
  initialNotificationCount,
  initialHasMore,
  shouldExpireReservations,
}: FeedPageClientProps) {
  const [games, setGames] = useState<Game[]>(initialGames);
  const [tab, setTab] = useState<GamesTab>("nearby");
  const [notificationCount, setNotificationCount] = useState(initialNotificationCount);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loadingMore, setLoadingMore] = useState(false);
  const [gamesOffset, setGamesOffset] = useState(initialGames.length);

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
      setGamesOffset((offset) => offset + more.length);
    }
    setHasMore(more.length === PAGE_SIZE);
    setLoadingMore(false);
  }, [gamesOffset, hasMore, loadingMore]);

  useEffect(() => {
    if (!shouldExpireReservations) return;
    fetch("/api/matches/expire-reservations", { method: "POST" }).catch(() => {});
  }, [shouldExpireReservations]);

  useEffect(() => {
    const handler = () => setNotificationCount(0);
    window.addEventListener("notifications-read", handler);
    return () => window.removeEventListener("notifications-read", handler);
  }, []);

  const tabGames = useMemo(() => partitionByTab(games, tab), [games, tab]);
  const featuredGame = useMemo(() => pickFeaturedGame(games), [games]);
  const listGames = useMemo(() => {
    if (!featuredGame) return tabGames;
    return tabGames.filter((game) => game.id !== featuredGame.id);
  }, [tabGames, featuredGame]);

  return (
    <div className="min-h-[100dvh] rondo-page">
      <FeedHeader notificationCount={notificationCount} />

      <HeroCarousel slides={DEFAULT_CAROUSEL_SLIDES} />

      <TopOrganizers organizers={initialOrganizers} />

      {featuredGame ? <FeaturedGameCard game={featuredGame} /> : null}

      <NearbyGamesSection
        games={listGames}
        tab={tab}
        onTabChange={setTab}
        loading={false}
        hasMore={hasMore}
        loadingMore={loadingMore}
        onLoadMore={loadMore}
      />
    </div>
  );
}
