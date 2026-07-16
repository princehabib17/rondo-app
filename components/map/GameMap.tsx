"use client";

import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Link from "next/link";
import { Clock, MapPin, Users, X } from "@phosphor-icons/react";
import type { Game } from "@/lib/supabase/types";
import { formatGameTime, formatPrice } from "@/lib/utils/format";

const METRO_MANILA: [number, number] = [14.5995, 120.9842];

function makePin(active: boolean) {
  const size = active ? 44 : 34;
  const bg = active ? "oklch(86% 0.115 96)" : "oklch(11% 0.008 102)";
  const fill = active ? "oklch(20% 0.02 96)" : "oklch(86% 0.115 96)";
  const border = active ? "oklch(86% 0.115 96)" : "oklch(26% 0.012 102)";
  return L.divIcon({
    className: "",
    html: `<div style="width:${size}px;height:${size}px;background:${bg};border:2px solid ${border};border-radius:999px;display:grid;place-items:center;cursor:pointer;transition:transform .15s,border-color .15s,background-color .15s;">
      <svg viewBox="0 0 24 24" width="${Math.round(size * 0.44)}" height="${Math.round(size * 0.44)}" fill="${fill}">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
      </svg>
    </div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size - 4],
  });
}

function BoundsFitter({ games }: { games: Game[] }) {
  const map = useMap();
  useEffect(() => {
    const pts = games
      .filter((g) => g.venue_lat != null && g.venue_lng != null)
      .map((g) => [g.venue_lat!, g.venue_lng!] as [number, number]);
    if (pts.length === 0) return;
    if (pts.length === 1) { map.setView(pts[0], 14); return; }
    map.fitBounds(L.latLngBounds(pts), { padding: [40, 40], maxZoom: 15 });
  }, [games, map]);
  return null;
}

interface GameMapProps {
  games: Game[];
}

export default function GameMap({ games }: GameMapProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const pinned = useMemo(
    () => games.filter((g) => g.venue_lat != null && g.venue_lng != null),
    [games]
  );

  const selected = useMemo(
    () => pinned.find((g) => g.id === selectedId) ?? null,
    [pinned, selectedId]
  );

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={METRO_MANILA}
        zoom={12}
        className="h-full w-full"
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={19}
          className="rondo-street-tiles"
        />
        <BoundsFitter games={pinned} />
        {pinned.map((game) => (
          <Marker
            key={game.id}
            position={[game.venue_lat!, game.venue_lng!]}
            icon={makePin(selectedId === game.id)}
            eventHandlers={{
              click: () => setSelectedId((prev) => (prev === game.id ? null : game.id)),
            }}
          />
        ))}
      </MapContainer>

      {/* No games state */}
      {pinned.length === 0 && (
        <div className="pointer-events-none absolute inset-0 z-[1000] flex items-center justify-center">
          <div className="rounded-[var(--r-md)] border border-[var(--stroke)] bg-[var(--bg-surface)] px-6 py-5 text-center backdrop-blur">
            <p className="rondo-title text-[var(--ink-hi)]">No games pinned yet</p>
            <p className="mt-1 rondo-meta text-[var(--ink-low)]">Games show here once organizers add venue addresses.</p>
          </div>
        </div>
      )}

      {/* Selected game card */}
      {selected && (
        <div
          className="absolute bottom-4 left-3 right-3 z-[1000] overflow-hidden rounded-[var(--r-lg)] border border-[var(--stroke)] bg-[var(--bg-surface)]"
        >
          <div className="flex items-center justify-between px-4 pt-3 pb-1">
            <div className="h-1 w-8 rounded-[var(--r-pill)] bg-[var(--gold)] mx-auto" />
          </div>
          <button
            type="button"
            onClick={() => setSelectedId(null)}
            className="absolute top-3 right-3 z-10 w-8 h-8 rounded-[var(--r-pill)] bg-[var(--bg-inset)] flex items-center justify-center text-[var(--ink-low)] hover:text-[var(--ink-hi)]"
          >
            <X size={14} />
          </button>
          <div className="grid grid-cols-[38%_1fr] gap-0 p-3 pt-1">
            <div className="relative min-h-[160px] overflow-hidden rounded-l-[var(--r-md)] bg-[var(--bg-inset)]">
              {selected.banner_url ? (
                <img src={selected.banner_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-zinc-900 to-zinc-800 flex items-center justify-center">
                  <MapPin size={28} className="text-[var(--ink-low)]" />
                </div>
              )}
              <span className="absolute left-2 top-2 rounded-[var(--r-pill)] border border-[var(--gold)] bg-[var(--bg-page)] px-3 py-1 rondo-label text-[var(--gold)]">
                {Math.max(0, (selected.max_players ?? 0) - (selected.game_players?.length ?? 0))} spots
              </span>
            </div>

            <div className="min-w-0 rounded-r-[var(--r-md)] border border-l-0 border-[var(--stroke)] bg-[var(--bg-inset)] p-3">
              <p className="rondo-title truncate text-[var(--ink-hi)] mb-1">{selected.title}</p>
              <div className="flex items-center gap-1 text-[var(--gold)] mb-2">
                <MapPin size={12} />
                <span className="truncate rondo-meta">{selected.venue_name}</span>
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1 rondo-meta text-[var(--ink-low)] mb-3">
                <span className="flex items-center gap-1">
                  <Clock size={14} className="text-[var(--gold)]" />
                  {formatGameTime(selected.date_time)}
                </span>
                <span className="flex items-center gap-1">
                  <Users size={14} className="text-[var(--gold)]" />
                  {selected.game_players?.length ?? 0}/{selected.max_players}
                </span>
                <span className="rondo-label text-[var(--ink-mid)]">{selected.format}</span>
              </div>
              <p className="font-heading text-2xl font-bold text-[var(--gold)] mb-3">
                {formatPrice(selected.price_per_player)}
                <span className="block rondo-label text-[var(--ink-low)]">per player</span>
              </p>
              <Link
                href={`/games/${selected.id}`}
                className="block rounded-[var(--r-pill)] bg-[var(--gold)] py-2.5 text-center font-heading text-sm font-bold uppercase text-[var(--gold-ink)] active:scale-[0.98] transition-transform"
              >
                View Game
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
