"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import {
  Bell,
  Bookmark,
  CircleDollarSign,
  Clock3,
  MapPinned,
  Search,
  SlidersHorizontal,
  Star,
  Users,
} from "lucide-react";
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
      .select("*, organizer:profiles!organizer_id(id,full_name,avatar_url), organization:organizations(id,name,slug,logo_url,verified,created_by), game_players(id)")
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
      <div className="shrink-0 z-30 bg-black/96 border-b border-white/8">
        <div className="px-4 pt-4 pb-3 max-w-lg mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <Image
              src="/rondo-logo.png"
              alt="RONDO"
              width={40}
              height={40}
              className="object-contain"
              style={{ width: "auto", height: "auto" }}
              priority
            />
            <Link
              href="/notifications"
              className="relative grid min-h-11 min-w-11 place-items-center rounded-full border border-white/10 text-white hover:text-rondo-accent"
              aria-label="Notifications"
            >
              <Bell size={22} />
              <span className="absolute right-2.5 top-2.5 h-2.5 w-2.5 rounded-full bg-rondo-accent" />
            </Link>
          </div>

          <div className="flex gap-3">
            <label className="flex min-h-14 flex-1 items-center gap-3 rounded-2xl border border-white/12 bg-white/[0.045] px-4 text-white/60">
              <Search size={24} className="shrink-0 text-white" />
              <span className="sr-only">Search games or venues</span>
              <input
                type="search"
                placeholder="Search games or venues"
                className="min-w-0 flex-1 bg-transparent font-body text-base text-white outline-none placeholder:text-white/38"
              />
            </label>
            <Link
              href="/saved"
              className="inline-flex min-h-14 items-center gap-2 rounded-2xl border border-white/14 bg-white/[0.035] px-4 font-body text-sm font-semibold text-white"
            >
              <Bookmark size={20} />
              Saved
            </Link>
          </div>

          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
            <button type="button" className="rondo-chip" data-active="true">
              <Clock3 size={16} /> Tonight
            </button>
            <button type="button" className="rondo-chip">
              <Users size={16} /> Format
            </button>
            <button type="button" className="rondo-chip">
              <Star size={16} /> Level
            </button>
            <button type="button" className="rondo-chip">
              <CircleDollarSign size={16} /> Price
            </button>
            <button type="button" onClick={requestLocation} className="rondo-chip">
              <MapPinned size={16} /> {locating ? "Locating" : coords ? "Near me" : "Use location"}
            </button>
            <button type="button" className="rondo-chip">
              <SlidersHorizontal size={16} /> More
            </button>
          </div>
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
        <button
          type="button"
          onClick={fetchGames}
          className="absolute left-1/2 top-5 z-20 inline-flex -translate-x-1/2 items-center gap-2 rounded-full bg-rondo-accent px-6 py-3 font-heading text-sm font-black uppercase tracking-wide text-black shadow-[0_0_30px_rgba(246,224,55,0.35)]"
        >
          <MapPinned size={18} />
          Search this area
        </button>

        {!loading && missingLocationCount > 0 && (
          <div className="absolute top-20 left-4 right-4 z-20 bg-zinc-900/95 border border-white/10 rounded-xl px-3 py-2 max-w-lg mx-auto">
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
