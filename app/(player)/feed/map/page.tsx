"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";
import type { Game } from "@/lib/supabase/types";
import {
  DEFAULT_FILTERS,
  applyFeedFilters,
  sortFeedGames,
  countActiveFilters,
  type FeedFilters,
  type Coords,
  type FilterContext,
} from "@/lib/feed/filters";
import { FeedFiltersBar } from "@/components/feed/FeedFilters";

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
  const [filters, setFilters] = useState<FeedFilters>(DEFAULT_FILTERS);
  const [coords, setCoords] = useState<Coords | null>(null);
  const [locating, setLocating] = useState(false);

  const fetchGames = useCallback(async () => {
    const supabase = createClient();
    const now = new Date().toISOString();
    const { data } = await supabase
      .from("games")
      .select("*, organizer:profiles!organizer_id(id,full_name,avatar_url), game_players(id)")
      .eq("status", "open")
      .gte("date_time", now)
      .order("date_time", { ascending: true })
      .limit(80);

    setGames((data as Game[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  const requestLocation = useCallback(() => {
    if (!("geolocation" in navigator)) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const next = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(next);
        setLocating(false);
        fetch("/api/profile/location", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(next),
        }).catch(() => {});
      },
      () => setLocating(false),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
    );
  }, []);

  const ctx: FilterContext = useMemo(() => ({ coords }), [coords]);

  const mapGames = useMemo(() => {
    const filtered = applyFeedFilters(games, filters);
    return sortFeedGames(filtered, filters.sort, ctx);
  }, [games, filters, ctx]);

  const missingLocationCount = mapGames.filter(
    (g) => g.venue_lat == null || g.venue_lng == null
  ).length;

  return (
    <div className="h-[calc(100dvh-4rem)] bg-black flex flex-col">
      <div className="shrink-0 z-20 bg-black/95 border-b border-white/5">
        <div className="px-4 py-3 max-w-lg mx-auto">
          <h1 className="font-heading text-white font-black italic text-lg uppercase mb-1">
            Map
          </h1>
          <p className="font-body text-white/45 text-xs">
            Filter by area, date, skill, and more. Pins update as you change filters.
          </p>
        </div>
        <FeedFiltersBar
          filters={filters}
          onChange={setFilters}
          resultCount={mapGames.length}
          onUseLocation={requestLocation}
          locating={locating}
          hasLocation={coords != null}
        />
      </div>

      <div className="flex-1 min-h-0 relative">
        {!loading && missingLocationCount > 0 && (
          <div className="absolute top-3 left-4 right-4 z-20 bg-zinc-900/95 border border-white/10 rounded-xl px-3 py-2 max-w-lg mx-auto">
            <p className="text-xs text-white/70">
              {missingLocationCount} match{missingLocationCount > 1 ? "es" : ""} in your list have no
              map pin (venue coordinates missing).
            </p>
          </div>
        )}
        {loading ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-rondo-accent animate-ping" />
          </div>
        ) : (
          <GameMap games={mapGames} />
        )}
      </div>

      {countActiveFilters(filters) > 0 && (
        <div className="shrink-0 px-4 py-2 border-t border-white/5 bg-black/90 text-center">
          <button
            type="button"
            onClick={() => setFilters(DEFAULT_FILTERS)}
            className="text-rondo-accent text-xs font-semibold uppercase"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}
