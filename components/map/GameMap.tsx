"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MapContainer, Marker, TileLayer, ZoomControl, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Bookmark, Clock3, MapPin, Users } from "lucide-react";
import type { Game } from "@/lib/supabase/types";
import { formatGameTime, formatPrice } from "@/lib/utils/format";

function makeIcon(active = false) {
  const size = active ? 58 : 46;
  const glow = active
    ? "0 0 18px #F6E037, 0 0 42px rgba(246,224,55,0.55), 0 0 80px rgba(246,224,55,0.2)"
    : "0 0 12px #F6E037, 0 0 30px rgba(246,224,55,0.38)";

  return L.divIcon({
    className: "",
    html: `
      <div style="position:relative;width:76px;height:76px;display:flex;align-items:center;justify-content:center;">
        <span class="rondo-pulse-ring"></span>
        <span class="rondo-pulse-ring rondo-pulse-ring-2"></span>
        <span style="
          display:flex;
          align-items:center;
          justify-content:center;
          width:${size}px;
          height:${size}px;
          border-radius:50%;
          border:2px solid #F6E037;
          background:rgba(8,8,8,0.88);
          color:#F6E037;
          font-size:${active ? 26 : 20}px;
          font-weight:900;
          box-shadow:${glow};
          transition:all 0.2s ease;
        ">+</span>
      </div>
    `,
    iconSize: [76, 76],
    iconAnchor: [38, 38],
  });
}

function MapTapListener({ onTap }: { onTap: () => void }) {
  useMapEvents({ click: onTap });
  return null;
}

interface GameMapProps {
  games: Game[];
}

export default function GameMap({ games }: GameMapProps) {
  const [selected, setSelected] = useState<Game | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const withCoords = games.filter((g) => g.venue_lat != null && g.venue_lng != null);

  const center: [number, number] =
    withCoords.length > 0
      ? [
          withCoords.reduce((s, g) => s + g.venue_lat!, 0) / withCoords.length,
          withCoords.reduce((s, g) => s + g.venue_lng!, 0) / withCoords.length,
        ]
      : [14.5995, 120.9842];

  const zoom = withCoords.length > 0 ? 13 : 11;

  return (
    <div className="rondo-map-shell relative h-full w-full">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: "100%", width: "100%", background: "transparent" }}
        zoomControl={false}
        attributionControl
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={19}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        <ZoomControl position="bottomright" />

        <MapTapListener onTap={() => setSelected(null)} />

        {withCoords.map((game) => (
          <Marker
            key={game.id}
            position={[game.venue_lat!, game.venue_lng!]}
            icon={makeIcon(selected?.id === game.id)}
            eventHandlers={{
              click: (e) => {
                e.originalEvent.stopPropagation();
                setSelected(game);
              },
            }}
          />
        ))}
      </MapContainer>

      <div className="pointer-events-none absolute inset-0 z-[450] opacity-25 rondo-map-shell" aria-hidden />

      {withCoords.length === 0 && (
        <div className="pointer-events-none absolute inset-0 z-[500] flex flex-col items-center justify-center">
          <div className="rounded-2xl border border-white/10 bg-zinc-950/80 px-6 py-5 text-center backdrop-blur-md">
            <p className="text-sm font-semibold text-white">No games pinned yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Games appear here once organizers add their venue location
            </p>
          </div>
        </div>
      )}

      {selected && (
        <div
          className="absolute bottom-4 left-3 right-3 z-[1000] overflow-hidden rounded-[1.6rem]"
          style={{
            background: "rgba(10,10,10,0.95)",
            border: "1px solid rgba(255,255,255,0.16)",
            boxShadow: "0 -4px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(245,230,66,0.08)",
          }}
        >
          <div className="mx-auto mt-3 h-1 w-12 rounded-full bg-white/30" />
          <div className="grid grid-cols-[38%_1fr] gap-0 p-4">
            <div className="relative min-h-[190px] overflow-hidden rounded-l-2xl bg-zinc-900">
              {selected.banner_url ? (
                <img src={selected.banner_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <Image src="/feed/hero-night-court.png" alt="" fill className="object-cover" sizes="180px" />
              )}
              <span className="absolute left-3 top-3 rounded-full border border-rondo-accent/35 bg-black/75 px-3 py-1 font-heading text-[10px] font-black uppercase tracking-wide text-rondo-accent">
                {Math.max(0, selected.max_players - (selected.game_players?.length ?? 0))} spots left
              </span>
            </div>

            <div className="min-w-0 rounded-r-2xl border border-l-0 border-white/10 bg-white/[0.035] p-4">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="rondo-hero-title truncate text-[2rem] leading-none">{selected.title}</p>
                  <div className="mt-3 flex items-center gap-2 text-rondo-accent">
                    <MapPin size={17} />
                    <span className="font-body text-base">{selected.venue_name}</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="grid min-h-10 min-w-10 place-items-center rounded-full border border-white/10 text-white hover:text-rondo-accent"
                  aria-label="Save match"
                >
                  <Bookmark size={20} />
                </button>
              </div>

              <div className="mb-4 grid grid-cols-[1fr_auto] items-end gap-3">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-white/65">
                  <span className="inline-flex items-center gap-1.5">
                    <Clock3 size={14} className="text-rondo-accent" />
                    {formatGameTime(selected.date_time)}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Users size={14} className="text-rondo-accent" />
                    {selected.game_players?.length ?? 0}/{selected.max_players} spots
                  </span>
                  <span className="font-heading font-black uppercase text-white/80">
                    {selected.format}
                  </span>
                  <span className="font-heading font-black uppercase text-white/80">
                    {selected.skill_level ?? "Casual"}
                  </span>
                </div>
                <p className="text-right font-heading text-3xl font-black uppercase italic text-rondo-accent">
                  {formatPrice(selected.price_per_player)}
                  <span className="block font-body text-[10px] font-semibold not-italic text-white/50">
                    per player
                  </span>
                </p>
              </div>

              <Link href={`/games/${selected.id}`} className="rondo-btn rondo-btn-primary">
                View Game
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
