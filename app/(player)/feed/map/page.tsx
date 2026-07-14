"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import {
  Bell,
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
import { fetchOpenGames } from "@/lib/supabase/game-queries";
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
    <div className="rondo-map-shell relative h-full w-full overflow-hidden bg-black">
      <div className="absolute left-8 top-16 h-20 w-20 rounded-full border border-rondo-accent/25 bg-rondo-accent/10 blur-sm" />
      <div className="absolute right-10 top-36 h-16 w-16 rounded-full border border-rondo-accent/20 bg-rondo-accent/10 blur-sm" />
      <div className="absolute bottom-24 left-1/3 h-24 w-24 rounded-full border border-rondo-accent/20 bg-rondo-accent/10 blur-sm" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-2 w-2 rounded-full bg-rondo-accent shadow-[0_0_32px_rgba(246,224,55,0.8)] animate-ping" />
      </div>
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
    const data = await fetchOpenGames(supabase, { from: 0, to: 79 });
    setGames(data);
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
    <div className="h-[calc(100dvh-4rem)] w-full max-w-[430px] overflow-x-hidden bg-[var(--bg-page)] flex flex-col">
      <div className="shrink-0 z-30 bg-[color-mix(in_oklch,var(--bg-page)_96%,transparent)] border-b border-[var(--stroke)]">
        <div className="box-border w-full max-w-full px-4 pt-4 pb-3 mx-auto space-y-4">
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
            className="relative grid min-h-11 min-w-11 place-items-center rounded-[var(--r-pill)] border border-[var(--stroke)] text-[var(--ink-hi)] hover:text-[var(--gold)]"
              aria-label="Notifications"
            >
              <Bell size={22} />
              <span className="absolute right-2.5 top-2.5 h-2.5 w-2.5 rounded-[var(--r-pill)] bg-[var(--gold)]" />
            </Link>
          </div>

          <label className="flex min-h-14 min-w-0 items-center gap-3 rounded-[var(--r-md)] border border-[var(--stroke)] bg-[var(--bg-inset)] px-4 text-[var(--ink-low)]">
            <Search size={24} className="shrink-0 text-[var(--ink-hi)]" />
            <span className="sr-only">Search games or venues</span>
            <input
              type="search"
              placeholder="Search games or venues"
              className="min-w-0 flex-1 bg-transparent rondo-body text-[var(--ink-hi)] outline-none placeholder:text-[var(--ink-low)]"
            />
          </label>

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
          className="absolute left-1/2 top-5 z-20 inline-flex -translate-x-1/2 items-center gap-2 rounded-[var(--r-pill)] bg-[var(--gold)] px-6 py-3 font-heading text-sm font-bold uppercase text-[var(--gold-ink)]"
        >
          <MapPinned size={18} />
          Show games here
        </button>

        {!loading && missingLocationCount > 0 && (
          <div className="absolute top-20 left-4 right-4 z-20 bg-[var(--bg-surface)] border border-[var(--stroke)] rounded-[var(--r-md)] px-3 py-2 max-w-lg mx-auto">
            <p className="rondo-meta text-[var(--ink-mid)]">
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
          <div className="shrink-0 px-4 py-2 border-t border-[var(--stroke)] bg-[color-mix(in_oklch,var(--bg-page)_90%,transparent)] text-center">
          <button
            type="button"
            onClick={() => setFilters(DEFAULT_FILTERS)}
            className="rondo-label text-[var(--gold)]"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}
