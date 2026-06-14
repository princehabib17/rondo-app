"use client";

import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Link from "next/link";
import { Clock3, MapPin, Users, X } from "lucide-react";
import type { Game } from "@/lib/supabase/types";
import { formatGameTime, formatPrice } from "@/lib/utils/format";

const METRO_MANILA: [number, number] = [14.5995, 120.9842];

function makePin(active: boolean) {
  const size = active ? 46 : 36;
  const bg = active ? "#E9FF3A" : "rgba(0,0,0,0.92)";
  const fill = active ? "#000" : "#E9FF3A";
  const glow = active ? "0.75" : "0.4";
  return L.divIcon({
    className: "",
    html: `<div style="width:${size}px;height:${size}px;background:${bg};border:2.5px solid #E9FF3A;border-radius:50%;display:grid;place-items:center;box-shadow:0 0 20px rgba(233,255,58,${glow}),0 2px 8px rgba(0,0,0,0.6);cursor:pointer;transition:all .15s;">
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
          <div className="rounded-2xl border border-white/10 bg-zinc-950/92 px-6 py-5 text-center backdrop-blur">
            <p className="font-heading text-lg font-black uppercase italic text-white">No games pinned yet</p>
            <p className="mt-1 text-sm text-white/50">Games show here once organizers add venue addresses.</p>
          </div>
        </div>
      )}

      {/* Selected game card */}
      {selected && (
        <div
          className="absolute bottom-4 left-3 right-3 z-[1000] overflow-hidden rounded-[1.35rem]"
          style={{
            background: "rgba(10,10,10,0.97)",
            border: "1px solid rgba(255,255,255,0.16)",
            boxShadow: "0 -4px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(245,230,66,0.08)",
          }}
        >
          <div className="flex items-center justify-between px-4 pt-3 pb-1">
            <div className="h-1 w-12 rounded-full bg-white/25 mx-auto" />
          </div>
          <button
            type="button"
            onClick={() => setSelectedId(null)}
            className="absolute top-3 right-3 z-10 w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white"
          >
            <X size={14} />
          </button>
          <div className="grid grid-cols-[38%_1fr] gap-0 p-3 pt-1">
            <div className="relative min-h-[160px] overflow-hidden rounded-l-2xl bg-zinc-900">
              {selected.banner_url ? (
                <img src={selected.banner_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-zinc-900 to-zinc-800 flex items-center justify-center">
                  <MapPin size={28} className="text-white/15" />
                </div>
              )}
              <span className="absolute left-2 top-2 rounded-full border border-rondo-accent/35 bg-black/80 px-2.5 py-1 font-heading text-[0.58rem] font-black uppercase tracking-wide text-rondo-accent">
                {Math.max(0, (selected.max_players ?? 0) - (selected.game_players?.length ?? 0))} spots
              </span>
            </div>

            <div className="min-w-0 rounded-r-2xl border border-l-0 border-white/10 bg-white/[0.03] p-3">
              <p className="rondo-hero-title truncate text-xl leading-tight mb-1">{selected.title}</p>
              <div className="flex items-center gap-1.5 text-rondo-accent mb-2">
                <MapPin size={12} />
                <span className="truncate font-body text-xs">{selected.venue_name}</span>
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-white/55 mb-3">
                <span className="flex items-center gap-1">
                  <Clock3 size={11} className="text-rondo-accent" />
                  {formatGameTime(selected.date_time)}
                </span>
                <span className="flex items-center gap-1">
                  <Users size={11} className="text-rondo-accent" />
                  {selected.game_players?.length ?? 0}/{selected.max_players}
                </span>
                <span className="font-heading font-black text-white/80 uppercase text-[10px]">{selected.format}</span>
              </div>
              <p className="font-heading text-xl font-black italic text-rondo-accent mb-3">
                {formatPrice(selected.price_per_player)}
                <span className="block font-body text-[0.55rem] font-normal not-italic text-white/50">per player</span>
              </p>
              <Link
                href={`/games/${selected.id}`}
                className="block text-center bg-rondo-accent text-black font-heading font-black text-xs uppercase tracking-wide py-2.5 rounded-xl active:scale-[0.98] transition-all"
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
