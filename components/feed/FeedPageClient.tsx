"use client";

import { useEffect, useState } from "react";
import type { Game, Tournament } from "@/lib/supabase/types";
import type { HomeNextUp, RecentMatchRow } from "@/lib/feed/home-queries";
import { FeedHeader } from "@/components/feed/FeedHeader";
import {
  AroundYouSection,
  NextUpSection,
  RecentSection,
  YourTournamentsSection,
} from "@/components/feed/HomeSections";

interface FeedPageClientProps {
  nextUp: HomeNextUp;
  yourTournaments: Tournament[];
  aroundYou: Tournament[];
  recentMatches: RecentMatchRow[];
  openGames: Game[];
  initialNotificationCount: number;
  shouldExpireReservations: boolean;
}

export function FeedPageClient({
  nextUp,
  yourTournaments,
  aroundYou,
  recentMatches,
  openGames,
  initialNotificationCount,
  shouldExpireReservations,
}: FeedPageClientProps) {
  const [notificationCount, setNotificationCount] = useState(initialNotificationCount);

  useEffect(() => {
    if (!shouldExpireReservations) return;
    fetch("/api/matches/expire-reservations", { method: "POST" }).catch(() => {});
  }, [shouldExpireReservations]);

  useEffect(() => {
    const handler = () => setNotificationCount(0);
    window.addEventListener("notifications-read", handler);
    return () => window.removeEventListener("notifications-read", handler);
  }, []);

  const fallbackGame = !nextUp && openGames[0] ? openGames[0] : null;

  return (
    <div className="min-h-[100dvh] rondo-page pb-24">
      <FeedHeader notificationCount={notificationCount} />
      <NextUpSection nextUp={nextUp} fallbackGame={fallbackGame} />
      <YourTournamentsSection tournaments={yourTournaments} />
      <AroundYouSection tournaments={aroundYou} games={openGames} />
      <RecentSection rows={recentMatches} />
    </div>
  );
}
