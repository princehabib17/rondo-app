"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Game } from "@/lib/supabase/types";

const GameMap = dynamic(() => import("@/components/map/GameMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-black">
      <div className="w-2 h-2 rounded-full bg-rondo-accent animate-ping" />
    </div>
  ),
});

export default function FeedMapPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [missingLocationCount, setMissingLocationCount] = useState(0);

  const fetchGames = useCallback(async () => {
    const supabase = createClient();
    const now = new Date().toISOString();
    const { data } = await supabase
      .from("games")
      .select("*, organizer:profiles!organizer_id(id,full_name,avatar_url), game_players(id)")
      .eq("status", "open")
      .gte("date_time", now)
      .order("date_time", { ascending: true })
      .limit(50);

    setGames((data as Game[]) ?? []);
    const gameRows = (data as Game[]) ?? [];
    setMissingLocationCount(gameRows.filter((g) => g.venue_lat == null || g.venue_lng == null).length);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  return (
    <div className="h-[100dvh] bg-black flex flex-col">
      <header className="shrink-0 flex items-center gap-3 px-4 py-3 border-b border-white/5 bg-black/95 backdrop-blur-md z-10">
        <Link
          href="/feed"
          className="w-10 h-10 flex items-center justify-center text-white/80 hover:text-white transition-colors"
          aria-label="Back to home"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="font-heading text-white font-black italic text-lg uppercase">Map</h1>
      </header>

      <div className="flex-1 min-h-0">
        {!loading && missingLocationCount > 0 && (
          <div className="absolute top-[68px] left-4 right-4 z-20 bg-zinc-900/95 border border-white/10 rounded-xl px-3 py-2">
            <p className="text-xs text-white/70">
              {missingLocationCount} game{missingLocationCount > 1 ? "s" : ""} missing map coordinates.
              Organizers need to add venue location to pin them.
            </p>
          </div>
        )}
        {loading ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-rondo-accent animate-ping" />
          </div>
        ) : (
          <GameMap games={games} />
        )}
      </div>
    </div>
  );
}
