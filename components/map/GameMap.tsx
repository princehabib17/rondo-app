"use client";

import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Link from "next/link";
import { X, Users, ChevronRight, Calendar } from "lucide-react";
import type { Game } from "@/lib/supabase/types";
import { formatPrice, formatGameDate } from "@/lib/utils/format";

// Build the pulsating DivIcon once — reused for all markers
function makeIcon(active = false) {
  const size = active ? 16 : 12;
  const glow = active
    ? "0 0 12px #F5E642, 0 0 28px rgba(245,230,66,0.7), 0 0 48px rgba(245,230,66,0.3)"
    : "0 0 8px #F5E642, 0 0 18px rgba(245,230,66,0.5)";

  return L.divIcon({
    className: "",
    html: `
      <div style="position:relative;width:44px;height:44px;display:flex;align-items:center;justify-content:center;">
        <span class="rondo-pulse-ring"></span>
        <span class="rondo-pulse-ring rondo-pulse-ring-2"></span>
        <span style="
          display:block;
          width:${size}px;
          height:${size}px;
          border-radius:50%;
          background:#F5E642;
          box-shadow:${glow};
          transition:all 0.2s ease;
        "></span>
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });
}

// Dismiss selected card when map background is tapped
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

  // Ensure Leaflet only renders client-side
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  const withCoords = games.filter((g) => g.venue_lat != null && g.venue_lng != null);

  // Center on games centroid, fall back to Manila
  const center: [number, number] =
    withCoords.length > 0
      ? [
          withCoords.reduce((s, g) => s + g.venue_lat!, 0) / withCoords.length,
          withCoords.reduce((s, g) => s + g.venue_lng!, 0) / withCoords.length,
        ]
      : [14.5995, 120.9842];

  const zoom = withCoords.length > 0 ? 13 : 11;

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: "100%", width: "100%", background: "#0a0a0a" }}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={19}
        />

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

      {/* Empty state overlay */}
      {withCoords.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-[500]">
          <div className="bg-zinc-950/80 border border-white/10 rounded-2xl px-6 py-5 text-center backdrop-blur-md">
            <p className="text-white font-semibold text-sm">No games pinned yet</p>
            <p className="text-muted-foreground text-xs mt-1">
              Games appear here once organizers add their venue location
            </p>
          </div>
        </div>
      )}

      {/* Selected game card — slides up from bottom */}
      {selected && (
        <div
          className="absolute bottom-4 left-3 right-3 z-[1000] rounded-2xl overflow-hidden"
          style={{
            background: "rgba(10,10,10,0.95)",
            border: "1px solid rgba(255,255,255,0.1)",
            boxShadow: "0 -4px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(245,230,66,0.08)",
          }}
        >
          {/* Yellow glow bar at top */}
          <div
            style={{
              height: "2px",
              background: "linear-gradient(90deg, transparent, #F5E642, transparent)",
              opacity: 0.7,
            }}
          />

          <div className="p-4">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm leading-tight">{selected.title}</p>
                <p className="text-muted-foreground text-xs mt-0.5 truncate">{selected.venue_name}</p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-white transition-colors shrink-0 cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            <div className="flex items-center gap-4 mb-4">
              <span className="text-rondo-yellow font-black text-lg">
                {formatPrice(selected.price_per_player)}
              </span>
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                <Users size={11} />
                <span>
                  {selected.game_players?.length ?? 0}/{selected.max_players} players
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                <Calendar size={11} />
                <span>{formatGameDate(selected.date_time).split(",")[0]}</span>
              </div>
            </div>

            <Link
              href={`/games/${selected.id}`}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-black uppercase tracking-widest text-xs active:scale-[0.98] transition-all cursor-pointer"
              style={{
                background: "#F5E642",
                color: "#0A0A0A",
                boxShadow: "0 0 16px rgba(245,230,66,0.35)",
              }}
            >
              View Game <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
