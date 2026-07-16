"use client";

import Link from "next/link";
import Image from "next/image";
import { CalendarBlank, MapPin, SoccerBall, Users } from "@phosphor-icons/react";
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
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[color-mix(in_oklch,var(--ink-hi)_10%,transparent)]">
      <motion.div
        className="h-full rounded-full bg-[var(--gold)]"
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
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SoccerBall size={18} weight="duotone" className="text-[var(--gold)]" />
          <h2 className="rondo-label text-[var(--ink-hi)]">Featured match</h2>
        </div>
        <span className="rondo-label text-[var(--gold)]">{spotsLeft} open</span>
      </div>

      <motion.article
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={bouncy}
        className="overflow-hidden rounded-[var(--r-lg)] border border-[var(--stroke)] bg-[var(--bg-surface)]"
      >
        <div className="relative h-56">
          {game.banner_url ? (
            <img src={game.banner_url} alt="" className="h-full w-full object-cover saturate-90" />
          ) : (
            <Image
              src="/feed/hero-night-court.png"
              alt=""
              fill
              className="object-cover"
              sizes="400px"
            />
          )}
          <div className="absolute inset-0 rondo-map-shell opacity-20 mix-blend-screen" />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-page)] via-[color-mix(in_oklch,var(--bg-page)_46%,transparent)] to-transparent" />

          <span className="absolute right-3 top-3 rounded-full bg-[var(--gold)] px-3 py-1 font-heading text-xs font-black uppercase text-[var(--gold-ink)]">
            {formatPrice(game.price_per_player)}
          </span>

          <span className="absolute left-3 top-3 rounded-full border border-[var(--stroke)] bg-[color-mix(in_oklch,var(--bg-page)_70%,transparent)] px-3 py-1 font-heading text-[10px] font-black uppercase tracking-wide text-[var(--ink-hi)] backdrop-blur-sm">
            {playerCount}/{game.max_players}
          </span>
        </div>

        <div className="space-y-4 p-4">
          <div>
            <h3 className="font-heading text-3xl font-black uppercase leading-[0.9] tracking-[-0.02em] text-[var(--ink-hi)]">
              {game.title}
            </h3>
            <div className="mt-2 flex items-center gap-2 rondo-meta text-[var(--ink-low)]">
              {game.organization?.logo_url ? (
                <Image
                  src={game.organization.logo_url}
                  alt=""
                  width={16}
                  height={16}
                  className="h-4 w-4 rounded-full object-cover"
                />
              ) : (
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[var(--bg-inset)] font-heading text-[8px] text-[var(--ink-hi)]">
                  {getOrganizerInitials(organizerName)}
                </span>
              )}
              <span className="truncate">{organizerName}</span>
            </div>
          </div>

          <div className="grid gap-2 rounded-[var(--r-md)] border border-[var(--stroke)] bg-[var(--bg-inset)] p-3 rondo-meta text-[var(--ink-mid)]">
            <span className="flex items-center gap-1.5">
              <CalendarBlank size={14} weight="duotone" className="shrink-0 text-[var(--gold)]" />
              {formatGameDate(game.date_time)}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin size={14} weight="duotone" className="shrink-0 text-[var(--gold)]" />
              {game.venue_name}
            </span>
            <span className="flex items-center gap-1.5">
              <Users size={14} weight="duotone" className="shrink-0 text-[var(--gold)]" />
              {playerCount} / {game.max_players}
            </span>
          </div>

          <GameBadges game={game} />

          <PlayerProgress current={playerCount} max={game.max_players} />

          <Link
            href={`/games/${game.id}`}
            className="rondo-btn rondo-btn-primary"
          >
            View match
          </Link>
        </div>
      </motion.article>
    </section>
  );
}

export function FeaturedGameSkeleton() {
  return (
    <section className="px-4 pt-6">
      <div className="mb-3 h-3.5 w-28 rounded rondo-shimmer" />
      <div className="h-[360px] rounded-[var(--r-lg)] border border-[var(--stroke)] rondo-shimmer" />
    </section>
  );
}
