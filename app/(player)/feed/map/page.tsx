"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { Bell, Bookmark, MapPin } from "@phosphor-icons/react";
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
    <div className="rondo-map-shell relative h-full w-full overflow-hidden bg-[var(--bg-page)]">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-8 w-24 rounded-[var(--r-pill)] rondo-shimmer" />
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
  const [search, setSearch] = useState("");

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
    const sorted = sortFeedGames(filtered, filters.sort, ctx);
    const q = search.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter((g) => {
      const hay = `${g.title} ${g.venue_name ?? ""} ${g.organization?.name ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [games, filters, ctx, search]);

  const missingLocationCount = mapGames.filter(
    (g) => g.venue_lat == null || g.venue_lng == null
  ).length;

  return (
    <div className="flex h-[calc(100dvh-4rem)] w-full max-w-lg flex-col overflow-x-hidden bg-[var(--bg-page)]">
      <div className="z-30 shrink-0 border-b border-[var(--stroke)] bg-[color-mix(in_oklch,var(--bg-page)_96%,transparent)]">
        <div className="mx-auto box-border w-full max-w-full space-y-3 px-4 pb-2 pt-4">
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
            <div className="flex items-center gap-2">
              <Link
                href="/saved"
                className="grid min-h-11 min-w-11 place-items-center rounded-[var(--r-pill)] border border-[var(--stroke)] text-[var(--ink-hi)] hover:text-[var(--gold)]"
                aria-label="Saved games"
              >
                <Bookmark size={20} weight="duotone" />
              </Link>
              <Link
                href="/notifications"
                className="relative grid min-h-11 min-w-11 place-items-center rounded-[var(--r-pill)] border border-[var(--stroke)] text-[var(--ink-hi)] hover:text-[var(--gold)]"
                aria-label="Notifications"
              >
                <Bell size={20} weight="duotone" />
              </Link>
            </div>
          </div>

          <label className="flex min-h-12 min-w-0 items-center gap-3 rounded-[var(--r-md)] border border-[var(--stroke)] bg-[var(--bg-inset)] px-4 text-[var(--ink-low)]">
            <span className="sr-only">Search games or venues</span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search games or venues"
              className="min-w-0 flex-1 bg-transparent rondo-body text-[var(--ink-hi)] outline-none placeholder:text-[var(--ink-low)]"
            />
          </label>
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

      <div className="relative min-h-0 flex-1">
        <button
          type="button"
          onClick={fetchGames}
          className="rondo-sticky-action absolute bottom-4 left-1/2 z-20 inline-flex -translate-x-1/2 items-center gap-2 rounded-[var(--r-pill)] bg-[var(--gold)] px-6 py-3 font-heading text-sm font-bold uppercase text-[var(--gold-ink)]"
        >
          <MapPin size={18} weight="duotone" />
          Show games here
        </button>

        {!loading && missingLocationCount > 0 && (
          <div className="absolute left-4 right-4 top-4 z-20 mx-auto max-w-lg rounded-[var(--r-md)] border border-[var(--stroke)] bg-[var(--bg-surface)] px-3 py-2">
            <p className="rondo-meta text-[var(--ink-mid)]">
              {missingLocationCount} match{missingLocationCount > 1 ? "es" : ""} in your list have no
              map pin (venue coordinates missing).
            </p>
          </div>
        )}
        {loading ? (
          <div className="flex h-full w-full items-center justify-center">
            <div className="h-8 w-32 rounded-[var(--r-pill)] rondo-shimmer" />
          </div>
        ) : (
          <GameMap games={mapGames} />
        )}
      </div>

      {countActiveFilters(filters) > 0 && (
        <div className="shrink-0 border-t border-[var(--stroke)] bg-[color-mix(in_oklch,var(--bg-page)_90%,transparent)] px-4 py-2 text-center">
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
