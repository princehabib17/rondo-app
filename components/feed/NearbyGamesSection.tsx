"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, MapPin, MapTrifold } from "@phosphor-icons/react";
import { motion } from "motion/react";
import { formatGameTime, formatPrice } from "@/lib/utils/format";
import type { Game } from "@/lib/supabase/types";
import { getOrganizerInitials } from "@/lib/feed/organizers";
import { GameBadges } from "@/components/feed/GameBadges";
import { getPlayerCount, isFull, type Coords } from "@/lib/feed/filters";
import { format } from "date-fns";
import { bouncy } from "@/components/motion/springs";

interface NearbyGameRowProps {
  game: Game;
  coords?: Coords | null;
}

function PlayerProgress({ current, max }: { current: number; max: number }) {
  const pct = max > 0 ? Math.min(100, (current / max) * 100) : 0;
  const full = current >= max;
  return (
    <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-[color-mix(in_oklch,var(--ink-hi)_8%,transparent)]">
      <div
        className={`h-full rounded-full transition-[width] duration-300 ${
          full ? "bg-[color-mix(in_oklch,var(--ink-hi)_28%,transparent)]" : pct >= 80 ? "bg-[var(--live)]" : "bg-[var(--gold)]"
        }`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function formatShortDate(dateString: string): string {
  return format(new Date(dateString), "EEE, MMM d");
}

export function NearbyGameRow({ game, coords = null }: NearbyGameRowProps) {
  const playerCount = getPlayerCount(game);
  const organizerName = game.organization?.name ?? game.organizer?.full_name ?? "Organizer";
  const full = isFull(game);
  const spotsLeft = game.max_players - playerCount;

  return (
    <Link
      href={`/games/${game.id}`}
      className="group grid grid-cols-[3.25rem_minmax(0,1fr)_auto] items-center gap-3 rounded-[var(--r-md)] border border-[var(--stroke)] bg-[color-mix(in_oklch,var(--bg-surface)_84%,transparent)] p-3 transition-colors active:opacity-80"
    >
      <div className="flex h-[3.25rem] w-[3.25rem] shrink-0 items-center justify-center overflow-hidden rounded-[var(--r-md)] border border-[var(--stroke)] bg-[var(--bg-inset)]">
        {game.organization?.logo_url ? (
          <Image
            src={game.organization.logo_url}
            alt=""
            width={44}
            height={44}
            className="h-full w-full object-cover"
          />
        ) : game.organizer?.avatar_url ? (
          <Image
            src={game.organizer.avatar_url}
            alt=""
            width={44}
            height={44}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="font-heading text-xs font-black text-[var(--ink-hi)]">
            {getOrganizerInitials(organizerName)}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate font-heading text-base font-black uppercase leading-tight text-[var(--ink-hi)]">
            {game.title}
          </h3>
          <span className="shrink-0 font-heading text-xs font-black text-[var(--gold)]">
            {game.price_per_player === 0 ? "Free" : formatPrice(game.price_per_player)}
          </span>
        </div>
        <p className="mt-0.5 truncate rondo-meta text-[var(--ink-low)]">{game.venue_name}</p>

        <GameBadges game={game} coords={coords} className="mt-1.5" />

        <div className="mt-1.5 flex items-center justify-between">
          <span className="rondo-meta text-[var(--ink-low)]">
            {formatShortDate(game.date_time)} / {formatGameTime(game.date_time)}
          </span>
          <span className={`rondo-meta ${full ? "text-[var(--ink-low)]" : "text-[var(--ink-mid)]"}`}>
            {full ? "Full" : `${spotsLeft} left`} / {playerCount}/{game.max_players}
          </span>
        </div>
        <PlayerProgress current={playerCount} max={game.max_players} />
      </div>

      <ArrowRight size={16} weight="bold" className="shrink-0 text-[var(--ink-low)] transition-colors group-hover:text-[var(--gold)]" />
    </Link>
  );
}

function RowSkeleton() {
  return (
    <div className="grid grid-cols-[3.25rem_minmax(0,1fr)] items-center gap-3 rounded-[var(--r-md)] border border-[var(--stroke)] p-3">
      <div className="h-[3.25rem] w-[3.25rem] shrink-0 rounded-[var(--r-md)] rondo-shimmer" />
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="h-3.5 w-2/5 rounded rondo-shimmer" />
          <div className="h-3 w-10 rounded rondo-shimmer" />
        </div>
        <div className="h-2.5 w-1/3 rounded rondo-shimmer" />
        <div className="flex gap-1.5">
          <div className="h-4 w-14 rounded-full rondo-shimmer" />
          <div className="h-4 w-16 rounded-full rondo-shimmer" />
        </div>
        <div className="h-1 w-full rounded-full rondo-shimmer" />
      </div>
    </div>
  );
}

function EmptyState({ tab }: { tab: "nearby" | "upcoming" }) {
  return (
    <div className="flex flex-col items-center px-4 py-12 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-[var(--r-md)] border border-[var(--stroke)] bg-[var(--bg-inset)]">
        <MapPin size={24} weight="duotone" className="text-[var(--gold)]" />
      </div>
      <p className="font-heading text-base font-black uppercase text-[var(--ink-hi)]">
        {tab === "nearby" ? "No nearby matches" : "No upcoming matches"}
      </p>
      <p className="mt-1 max-w-[260px] rondo-body text-[var(--ink-low)]">
        {tab === "nearby"
          ? "Nothing in the next 7 days yet. Check Upcoming or open the map."
          : "Nothing scheduled beyond this week yet. Check Nearby for sooner games."}
      </p>
      <Link href="/feed/map" className="rondo-btn rondo-btn-secondary mt-5 !w-auto !px-5">
        <MapTrifold size={16} weight="duotone" aria-hidden />
        Open street map
      </Link>
    </div>
  );
}

interface NearbyGamesSectionProps {
  games: Game[];
  tab: "nearby" | "upcoming";
  onTabChange: (tab: "nearby" | "upcoming") => void;
  loading?: boolean;
  hasMore?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
}

export function NearbyGamesSection({ games, tab, onTabChange, loading, hasMore, loadingMore, onLoadMore }: NearbyGamesSectionProps) {
  return (
    <section id="nearby-games" className="px-4 pb-4 pt-6">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-1 rounded-[var(--r-pill)] border border-[var(--stroke)] bg-[var(--bg-inset)] p-1">
          <button
            type="button"
            onClick={() => onTabChange("nearby")}
            className={`rounded-[var(--r-pill)] px-3 py-1.5 font-heading text-xs uppercase tracking-wide transition-all duration-200 ${
              tab === "nearby"
                ? "bg-[var(--gold)] text-[var(--gold-ink)] font-black"
                : "text-[var(--ink-low)] hover:text-[var(--ink-hi)]"
            }`}
          >
            Nearby
          </button>
          <button
            type="button"
            onClick={() => onTabChange("upcoming")}
            className={`rounded-[var(--r-pill)] px-3 py-1.5 font-heading text-xs uppercase tracking-wide transition-all duration-200 ${
              tab === "upcoming"
                ? "bg-[var(--gold)] text-[var(--gold-ink)] font-black"
                : "text-[var(--ink-low)] hover:text-[var(--ink-hi)]"
            }`}
          >
            Upcoming
          </button>
        </div>

        <Link
          href="/feed/map"
          className="flex items-center gap-1.5 rondo-meta text-[var(--ink-low)] transition-colors hover:text-[var(--gold)]"
        >
          <MapTrifold size={15} weight="duotone" />
          <span>Map</span>
        </Link>
      </div>

      <div className="mt-2 space-y-2">
        {loading ? (
          <div className="space-y-2 py-1">
            {[0, 1, 2, 3].map((i) => (
              <RowSkeleton key={i} />
            ))}
          </div>
        ) : games.length === 0 ? (
          <EmptyState tab={tab} />
        ) : (
          <>
            {games.map((game, i) => (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...bouncy, delay: Math.min(i, 4) * 0.04 }}
              >
                <NearbyGameRow game={game} />
              </motion.div>
            ))}
            {hasMore && onLoadMore && (
              <button
                onClick={onLoadMore}
                disabled={loadingMore}
                className="rondo-btn rondo-btn-secondary mt-4 cursor-pointer disabled:opacity-40"
              >
                {loadingMore ? "Loading" : "Load more"}
              </button>
            )}
          </>
        )}
      </div>
    </section>
  );
}
