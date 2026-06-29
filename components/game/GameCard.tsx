"use client";

import Link from "next/link";
import { Calendar, MapPin, Users } from "lucide-react";
import { motion } from "motion/react";
import { formatGameDate, formatPrice } from "@/lib/utils/format";
import type { Game } from "@/lib/supabase/types";
import { Badge } from "@/components/ui/badge";
import { bouncy } from "@/components/motion/springs";

interface GameCardProps {
  game: Game;
  index?: number;
}

// Deterministic gradient based on game id — no stock images as fallback
const fallbackGradients = [
  "from-emerald-900/60 to-black",
  "from-sky-900/60 to-black",
  "from-violet-900/60 to-black",
  "from-amber-900/60 to-black",
  "from-rose-900/60 to-black",
  "from-cyan-900/60 to-black",
];
function cardGradient(id: string) {
  const n = id.charCodeAt(0) + id.charCodeAt(id.length - 1);
  return fallbackGradients[n % fallbackGradients.length];
}

export function GameCard({ game, index = 0 }: GameCardProps) {
  const playerCount = game.game_players?.length ?? 0;
  const spotsLeft = game.max_players - playerCount;
  const isFull = spotsLeft <= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...bouncy, delay: index * 0.04 }}
    >
      <Link href={`/games/${game.id}`} className="block">
        <article className="group overflow-hidden rounded-2xl border border-white/8 bg-black/40 transition active:scale-[0.98] hover:border-rondo-accent/25">
          {/* Banner — taller, image dominant */}
          <div className="relative h-40 overflow-hidden">
            {game.banner_url ? (
              <img
                src={game.banner_url}
                alt={game.title}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
            ) : (
              <div className={`h-full w-full bg-gradient-to-br ${cardGradient(game.id)}`} />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            {/* Price badge — top right */}
            <span className="absolute right-3 top-3 rounded-full bg-rondo-accent px-2.5 py-1 font-heading text-[11px] font-black text-black">
              {game.price_per_player === 0 ? "Free" : formatPrice(game.price_per_player)}
            </span>

            {/* Status — bottom right of image */}
            {isFull && (
              <span className="absolute bottom-3 right-3 rounded-full bg-white/10 px-2.5 py-1 font-body text-[10px] font-black uppercase tracking-wide text-white/60 backdrop-blur-sm">
                Full
              </span>
            )}
          </div>

          {/* Content */}
          <div className="space-y-2.5 p-4">
            <h3 className="font-heading text-base font-black uppercase italic leading-tight text-white">
              {game.title}
            </h3>

            <div className="space-y-1.5 font-body text-xs text-white/45">
              <div className="flex items-center gap-1.5">
                <Calendar size={11} className="shrink-0 text-rondo-accent" />
                <span className="truncate">{formatGameDate(game.date_time)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin size={11} className="shrink-0 text-rondo-accent" />
                <span className="truncate">{game.venue_name}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users size={11} className="shrink-0 text-rondo-accent" />
                <span>
                  {playerCount}/{game.max_players}
                  {!isFull && (
                    <span className="ml-1.5 text-rondo-accent">{spotsLeft} left</span>
                  )}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-0.5">
              <Badge variant="secondary" className="h-5 text-[10px]">{game.format}</Badge>
              <Badge variant="secondary" className="h-5 text-[10px]">{game.round_duration_minutes}m</Badge>
              {game.payment_type === "online" && (
                <Badge className="h-5 text-[10px] bg-rondo-accent/15 text-rondo-accent border-rondo-accent/25">
                  Pay Online
                </Badge>
              )}
            </div>
          </div>
        </article>
      </Link>
    </motion.div>
  );
}

export function GameCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/8 bg-black/40">
      <div className="h-40 bg-white/[0.04] animate-pulse" />
      <div className="space-y-3 p-4">
        <div className="h-4 w-3/4 rounded bg-white/8 animate-pulse" />
        <div className="space-y-2">
          <div className="h-3 w-full rounded bg-white/6 animate-pulse" />
          <div className="h-3 w-2/3 rounded bg-white/6 animate-pulse" />
          <div className="h-3 w-1/2 rounded bg-white/6 animate-pulse" />
        </div>
        <div className="flex gap-1.5">
          <div className="h-5 w-12 rounded bg-white/6 animate-pulse" />
          <div className="h-5 w-16 rounded bg-white/6 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
