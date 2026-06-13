"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Bookmark, Clock3, Layers, LocateFixed, MapPin, Rows3, Users } from "lucide-react";
import type { Game } from "@/lib/supabase/types";
import { formatGameTime, formatPrice } from "@/lib/utils/format";

interface GameMapProps {
  games: Game[];
}

type PinnedGame = {
  game: Game;
  x: number;
  y: number;
};

const fallbackPins = [
  { x: 24, y: 24 },
  { x: 72, y: 28 },
  { x: 50, y: 44 },
  { x: 18, y: 64 },
  { x: 58, y: 72 },
  { x: 82, y: 62 },
];

function getPinnedGames(games: Game[]): PinnedGame[] {
  const withCoords = games.filter((g) => g.venue_lat != null && g.venue_lng != null);

  if (withCoords.length === 0) {
    return [];
  }

  const lats = withCoords.map((g) => g.venue_lat!);
  const lngs = withCoords.map((g) => g.venue_lng!);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const latSpan = Math.max(maxLat - minLat, 0.01);
  const lngSpan = Math.max(maxLng - minLng, 0.01);

  return withCoords.map((game, index) => {
    const normalizedLng = (game.venue_lng! - minLng) / lngSpan;
    const normalizedLat = (game.venue_lat! - minLat) / latSpan;
    const fallback = fallbackPins[index % fallbackPins.length];

    return {
      game,
      x: withCoords.length === 1 ? fallback.x : 14 + normalizedLng * 72,
      y: withCoords.length === 1 ? fallback.y : 18 + (1 - normalizedLat) * 64,
    };
  });
}

function CityLabels() {
  return (
    <div className="pointer-events-none absolute inset-0 font-heading uppercase tracking-[0.12em] text-white/36">
      <span className="absolute left-[8%] top-[18%] text-[0.7rem]">Makati</span>
      <span className="absolute right-[12%] top-[25%] text-[0.65rem]">Pasig</span>
      <span className="absolute left-[40%] top-[36%] text-[0.6rem]">BGC</span>
      <span className="absolute bottom-[26%] right-[13%] text-[0.72rem]">Taguig</span>
      <span className="absolute bottom-[18%] left-[24%] text-[0.58rem]">Dasmarinas</span>
    </div>
  );
}

function Pin({
  pinned,
  active,
  onSelect,
}: {
  pinned: PinnedGame;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="absolute z-20 -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${pinned.x}%`, top: `${pinned.y}%` }}
      aria-label={`View ${pinned.game.title}`}
    >
      <span
        className={[
          "relative grid place-items-center rounded-full border-2 border-rondo-accent bg-black/90 text-rondo-accent",
          "shadow-[0_0_18px_rgba(246,224,55,0.65),0_0_50px_rgba(246,224,55,0.28)]",
          active ? "h-16 w-16" : "h-12 w-12",
        ].join(" ")}
      >
        <span className="absolute inset-[-12px] rounded-full border border-rondo-accent/35" />
        <span className="absolute inset-[-24px] rounded-full border border-rondo-accent/15" />
        <MapPin size={active ? 28 : 22} fill="currentColor" strokeWidth={1.8} />
      </span>
      <span className="absolute left-1/2 top-full h-8 w-px -translate-x-1/2 bg-rondo-accent/70" />
      <span className="absolute left-1/2 top-[calc(100%+1.65rem)] h-3 w-3 -translate-x-1/2 rounded-full bg-rondo-accent" />
    </button>
  );
}

function EmptyState() {
  return (
    <div className="pointer-events-none absolute inset-0 z-30 flex flex-col items-center justify-center px-8 text-center">
      <div className="rounded-2xl border border-white/10 bg-zinc-950/82 px-6 py-5 shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur-md">
        <p className="font-heading text-xl font-black uppercase italic text-white">No games pinned yet</p>
        <p className="mt-2 max-w-[18rem] text-sm text-white/55">
          Games appear here once organizers add venue coordinates.
        </p>
      </div>
    </div>
  );
}

export default function GameMap({ games }: GameMapProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const pinnedGames = useMemo(() => getPinnedGames(games), [games]);
  const selected = pinnedGames.find((pin) => pin.game.id === selectedId)?.game ?? pinnedGames[0]?.game ?? null;

  return (
    <div className="rondo-map-shell relative h-full w-full overflow-hidden bg-black">
      <div className="absolute inset-0 opacity-60 [background-image:linear-gradient(28deg,transparent_0_45%,rgba(255,255,255,0.08)_45.5%_46%,transparent_46.5%_100%),linear-gradient(118deg,transparent_0_40%,rgba(255,255,255,0.07)_40.5%_41%,transparent_41.5%_100%),repeating-linear-gradient(6deg,rgba(255,255,255,0.035)_0_1px,transparent_1px_17px),repeating-linear-gradient(96deg,rgba(255,255,255,0.03)_0_1px,transparent_1px_21px)]" />
      <div className="absolute left-[-18%] top-[18%] h-72 w-72 rounded-full bg-rondo-accent/10 blur-3xl" />
      <div className="absolute right-[-22%] top-[12%] h-64 w-64 rounded-full bg-rondo-accent/10 blur-3xl" />
      <div className="absolute bottom-[-18%] left-[28%] h-80 w-80 rounded-full bg-rondo-accent/8 blur-3xl" />
      <CityLabels />

      {pinnedGames.map((pinned) => (
        <Pin
          key={pinned.game.id}
          pinned={pinned}
          active={selected?.id === pinned.game.id}
          onSelect={() => setSelectedId(pinned.game.id)}
        />
      ))}

      {pinnedGames.length === 0 && <EmptyState />}

      <div className="absolute bottom-28 right-3 z-30 flex flex-col gap-3">
        <button
          type="button"
          className="grid h-14 w-14 place-items-center rounded-full border border-white/20 bg-black/65 text-white shadow-[0_14px_40px_rgba(0,0,0,0.45)] backdrop-blur"
          aria-label="Map layers"
        >
          <Layers size={24} />
        </button>
        <button
          type="button"
          className="grid h-14 w-14 place-items-center rounded-full border border-white/20 bg-black/65 text-white shadow-[0_14px_40px_rgba(0,0,0,0.45)] backdrop-blur"
          aria-label="Center map"
        >
          <LocateFixed size={24} />
        </button>
        <button
          type="button"
          className="grid h-14 w-14 place-items-center rounded-full border border-white/20 bg-black/65 text-white shadow-[0_14px_40px_rgba(0,0,0,0.45)] backdrop-blur"
          aria-label="List view"
        >
          <Rows3 size={24} />
        </button>
      </div>

      {selected && (
        <div
          className="absolute bottom-4 left-3 right-3 z-40 overflow-hidden rounded-[1.35rem]"
          style={{
            background: "rgba(10,10,10,0.96)",
            border: "1px solid rgba(255,255,255,0.16)",
            boxShadow: "0 -4px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(245,230,66,0.08)",
          }}
        >
          <div className="mx-auto mt-3 h-1 w-12 rounded-full bg-white/30" />
          <div className="grid grid-cols-[38%_1fr] gap-0 p-3">
            <div className="relative min-h-[178px] overflow-hidden rounded-l-2xl bg-zinc-900">
              {selected.banner_url ? (
                <img src={selected.banner_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <Image src="/feed/hero-night-court.png" alt="" fill className="object-cover" sizes="180px" />
              )}
              <span className="absolute left-2 top-2 rounded-full border border-rondo-accent/35 bg-black/75 px-2.5 py-1 font-heading text-[0.58rem] font-black uppercase tracking-wide text-rondo-accent">
                {Math.max(0, selected.max_players - (selected.game_players?.length ?? 0))} spots left
              </span>
            </div>

            <div className="min-w-0 rounded-r-2xl border border-l-0 border-white/10 bg-white/[0.035] p-3">
              <div className="mb-3 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="rondo-hero-title truncate text-[1.55rem] leading-none">{selected.title}</p>
                  <div className="mt-2 flex items-center gap-1.5 text-rondo-accent">
                    <MapPin size={15} />
                    <span className="truncate font-body text-sm">{selected.venue_name}</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="grid min-h-9 min-w-9 place-items-center rounded-full border border-white/10 text-white hover:text-rondo-accent"
                  aria-label="Save match"
                >
                  <Bookmark size={18} />
                </button>
              </div>

              <div className="mb-3 grid grid-cols-[1fr_auto] items-end gap-2">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[0.68rem] text-white/65">
                  <span className="inline-flex items-center gap-1">
                    <Clock3 size={13} className="text-rondo-accent" />
                    {formatGameTime(selected.date_time)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Users size={13} className="text-rondo-accent" />
                    {selected.game_players?.length ?? 0}/{selected.max_players}
                  </span>
                  <span className="font-heading font-black uppercase text-white/80">{selected.format}</span>
                  <span className="font-heading font-black uppercase text-white/80">
                    {selected.skill_level ?? "Casual"}
                  </span>
                </div>
                <p className="text-right font-heading text-2xl font-black uppercase italic text-rondo-accent">
                  {formatPrice(selected.price_per_player)}
                  <span className="block font-body text-[0.56rem] font-semibold not-italic text-white/50">
                    per player
                  </span>
                </p>
              </div>

              <Link href={`/games/${selected.id}`} className="rondo-btn rondo-btn-primary min-h-11 text-xs">
                View Game
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
