"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Fire, MapTrifold, Trophy } from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import type { Game } from "@/lib/supabase/types";
import { fetchOpenGames } from "@/lib/supabase/game-queries";
import type { OrganizerGroup } from "@/lib/feed/organizers";
import { FeedHeader } from "@/components/feed/FeedHeader";
import { TopOrganizers } from "@/components/feed/TopOrganizers";
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

function partitionByTab(games: Game[], tab: GamesTab): Game[] {
  const now = Date.now();
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  if (tab === "nearby") {
    return games.filter((game) => {
      const delta = new Date(game.date_time).getTime() - now;
      return delta >= 0 && delta <= weekMs;
    });
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
    const more = await fetchOpenGames(supabase, {
      from: gamesOffset,
      to: gamesOffset + PAGE_SIZE - 1,
    });
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
  const openThisWeek = useMemo(() => partitionByTab(games, "nearby").length, [games]);

  return (
    <div className="min-h-[100dvh]">
      <FeedHeader notificationCount={notificationCount} />

      <section className="px-4 pt-4">
        <div className="grid grid-cols-2 gap-2">
          <Link
            href="/feed/map"
            className="group relative min-h-28 overflow-hidden rounded-[var(--r-md)] border border-[var(--stroke)] bg-[var(--bg-surface)] p-4"
          >
            <div className="relative flex h-full flex-col justify-between">
              <MapTrifold size={26} weight="duotone" className="text-[var(--gold)]" aria-hidden />
              <div>
                <p className="rondo-label text-[var(--gold)]">Street map</p>
                <p className="rondo-meta mt-1 text-[var(--ink-mid)]">See games around you</p>
              </div>
            </div>
          </Link>

          <Link
            href="/tournaments"
            className="group relative min-h-28 overflow-hidden rounded-[var(--r-md)] border border-[color-mix(in_oklch,var(--gold)_28%,var(--stroke))] bg-[color-mix(in_oklch,var(--gold)_9%,var(--bg-surface))] p-4"
          >
            <div className="relative flex h-full flex-col justify-between">
              <Trophy size={26} weight="duotone" className="text-[var(--gold)]" aria-hidden />
              <div>
                <p className="rondo-label text-[var(--gold)]">Tournaments</p>
                <p className="rondo-meta mt-1 text-[var(--ink-mid)]">Brackets and rooms</p>
              </div>
            </div>
          </Link>
        </div>
        <div className="mt-2 flex items-center gap-2 rounded-[var(--r-pill)] border border-[var(--stroke)] bg-[var(--bg-inset)] px-3 py-2">
          <Fire size={16} weight="duotone" className="text-[var(--gold)]" aria-hidden />
          <p className="rondo-meta text-[var(--ink-mid)]">
            {openThisWeek > 0 ? `${openThisWeek} open this week` : "No open matches this week yet"}
          </p>
        </div>
      </section>

      <NearbyGamesSection
        games={tabGames}
        tab={tab}
        onTabChange={setTab}
        loading={false}
        hasMore={hasMore}
        loadingMore={loadingMore}
        onLoadMore={loadMore}
      />

      <TopOrganizers organizers={initialOrganizers} />
    </div>
  );
}
