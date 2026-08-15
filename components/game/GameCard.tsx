"use client";

import Link from "next/link";
import { CalendarBlank, MapPin, Users } from "@phosphor-icons/react";
import { motion } from "motion/react";
import { formatGameDate, formatPrice } from "@/lib/utils/format";
import type { Game } from "@/lib/supabase/types";
import { Badge } from "@/components/ui/badge";
import { bouncy } from "@/components/motion/springs";

interface GameCardProps {
  game: Game;
  index?: number;
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
        <article className="group overflow-hidden rounded-[var(--r-md)] border border-[var(--stroke)] bg-[var(--bg-surface)] transition active:scale-[0.98] hover:border-[color-mix(in_oklch,var(--gold)_25%,var(--stroke))]">
          <div className="relative h-40 overflow-hidden">
            {game.banner_url ? (
              <img
                src={game.banner_url}
                alt={game.title}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
            ) : (
              <div className="rondo-floodlight-scene h-full w-full" data-variant={index % 3} />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-page)] via-[color-mix(in_oklch,var(--bg-page)_20%,transparent)] to-transparent" />

            <span className="absolute right-3 top-3 rounded-full bg-[var(--gold)] px-2.5 py-1 font-heading text-[11px] font-black text-[var(--gold-ink)]">
              {game.price_per_player === 0 ? "Free" : formatPrice(game.price_per_player)}
            </span>

            {isFull && (
              <span className="absolute bottom-3 right-3 rounded-full bg-[var(--bg-inset)] px-2.5 py-1 font-body text-[10px] font-black uppercase tracking-wide text-[var(--ink-low)]">
                Full
              </span>
            )}
          </div>

          <div className="space-y-2.5 p-4">
            <h3 className="font-heading text-base font-black uppercase leading-tight text-[var(--ink-hi)]">
              {game.title}
            </h3>

            <div className="space-y-1.5 font-body text-xs text-[var(--ink-low)]">
              <div className="flex items-center gap-1.5">
                <CalendarBlank size={12} weight="duotone" className="shrink-0 text-[var(--gold)]" aria-hidden />
                <span className="truncate">{formatGameDate(game.date_time)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin size={12} weight="duotone" className="shrink-0 text-[var(--gold)]" aria-hidden />
                <span className="truncate">{game.venue_name}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users size={12} weight="duotone" className="shrink-0 text-[var(--gold)]" aria-hidden />
                <span>
                  {playerCount}/{game.max_players}
                  {!isFull && (
                    <span className="ml-1.5 text-[var(--gold)]">{spotsLeft} left</span>
                  )}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-0.5">
              <Badge variant="secondary" className="h-5 text-[10px]">
                {game.format}
              </Badge>
              <Badge variant="secondary" className="h-5 text-[10px]">
                {game.round_duration_minutes}m
              </Badge>
              {game.payment_type === "online" && (
                <Badge className="h-5 border-[color-mix(in_oklch,var(--gold)_25%,var(--stroke))] bg-[var(--gold-dim)] text-[10px] text-[var(--gold)]">
                  Online pay
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
    <div className="overflow-hidden rounded-[var(--r-md)] border border-[var(--stroke)] bg-[var(--bg-surface)]">
      <div className="h-40 rondo-shimmer" />
      <div className="space-y-3 p-4">
        <div className="h-4 w-3/4 rounded rondo-shimmer" />
        <div className="space-y-2">
          <div className="h-3 w-full rounded rondo-shimmer" />
          <div className="h-3 w-2/3 rounded rondo-shimmer" />
          <div className="h-3 w-1/2 rounded rondo-shimmer" />
        </div>
        <div className="flex gap-1.5">
          <div className="h-5 w-12 rounded rondo-shimmer" />
          <div className="h-5 w-16 rounded rondo-shimmer" />
        </div>
      </div>
    </div>
  );
}
