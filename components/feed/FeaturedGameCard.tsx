"use client";

import Link from "next/link";
import Image from "next/image";
import { Calendar, MapPin, Star, Users } from "lucide-react";
import { motion } from "motion/react";
import { formatGameDate, formatPrice } from "@/lib/utils/format";
import type { Game } from "@/lib/supabase/types";
import { getOrganizerInitials } from "@/lib/feed/organizers";
import { GameBadges } from "@/components/feed/GameBadges";
import { bouncy } from "@/components/motion/springs";

interface FeaturedGameCardProps {
  game: Game;
}

function PlayerProgress({ current, max }: { current: number; max: number }) {
  const pct = max > 0 ? Math.min(100, (current / max) * 100) : 0;
  return (
    <div className="h-1 w-full rounded-full bg-white/15 overflow-hidden">
      <motion.div
        className="h-full bg-rondo-accent rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ ...bouncy, delay: 0.3 }}
      />
    </div>
  );
}

export function FeaturedGameCard({ game }: FeaturedGameCardProps) {
  const playerCount = game.game_players?.length ?? 0;
  const spotsLeft = Math.max(0, game.max_players - playerCount);
  const organizerName = game.organization?.name ?? game.organizer?.full_name ?? "Organizer";

  return (
    <section className="px-4 pt-6">
      <div className="flex items-center gap-2 mb-3">
        <Star size={14} className="text-rondo-accent fill-rondo-accent" />
        <h2 className="font-heading text-white font-black italic text-xs uppercase tracking-widest">
          Featured Match
        </h2>
      </div>

      <motion.article
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={bouncy}
        className="overflow-hidden rounded-2xl border border-white/8 bg-black/40"
      >
        {/* Full-width dominant image */}
        <div className="relative h-52">
          {game.banner_url ? (
            <img src={game.banner_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <Image
              src="/feed/hero-night-court.png"
              alt=""
              fill
              className="object-cover"
              sizes="400px"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent" />

          {/* Price — top right */}
          <span className="absolute right-3 top-3 rounded-full bg-rondo-accent px-3 py-1 font-heading text-xs font-black text-black">
            {formatPrice(game.price_per_player)}
          </span>

          {/* Spots left — top left */}
          <span className="absolute left-3 top-3 rounded-full border border-white/20 bg-black/60 px-3 py-1 font-heading text-[10px] font-black uppercase tracking-wide text-white/80 backdrop-blur-sm">
            {spotsLeft} spot{spotsLeft !== 1 ? "s" : ""} left
          </span>
        </div>

        {/* Content below image */}
        <div className="space-y-3 p-4">
          <div>
            <h3 className="font-heading text-2xl font-black uppercase italic leading-none text-white">
              {game.title}
            </h3>
            <div className="mt-2 flex items-center gap-2 font-body text-xs text-white/50">
              {game.organization?.logo_url ? (
                <Image
                  src={game.organization.logo_url}
                  alt=""
                  width={16}
                  height={16}
                  className="h-4 w-4 rounded-full object-cover"
                />
              ) : (
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-white/10 font-heading text-[8px] text-white">
                  {getOrganizerInitials(organizerName)}
                </span>
              )}
              <span className="truncate">{organizerName}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1 font-body text-xs text-white/45">
            <span className="flex items-center gap-1.5">
              <Calendar size={11} className="shrink-0" />
              {formatGameDate(game.date_time)}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin size={11} className="shrink-0" />
              {game.venue_name}
            </span>
            <span className="flex items-center gap-1.5">
              <Users size={11} className="shrink-0" />
              {playerCount} / {game.max_players}
            </span>
          </div>

          <GameBadges game={game} />

          <PlayerProgress current={playerCount} max={game.max_players} />

          <Link
            href={`/games/${game.id}`}
            className="flex min-h-[48px] items-center justify-center rounded-xl bg-rondo-accent font-heading text-xs font-black uppercase tracking-widest text-black transition active:scale-[0.98]"
          >
            View Match
          </Link>
        </div>
      </motion.article>
    </section>
  );
}

export function FeaturedGameSkeleton() {
  return (
    <section className="px-4 pt-6">
      <div className="h-3.5 w-28 rounded bg-white/8 animate-pulse mb-3" />
      <div className="h-[320px] rounded-2xl border border-white/8 bg-white/[0.025] animate-pulse" />
    </section>
  );
}
