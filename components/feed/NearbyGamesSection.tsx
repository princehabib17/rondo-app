import Link from "next/link";
import Image from "next/image";
import { ChevronRight, Map, MapPinned } from "lucide-react";
import { format } from "date-fns";
import { formatGameTime, formatPrice } from "@/lib/utils/format";
import type { Game } from "@/lib/supabase/types";
import { GameBadges } from "@/components/feed/GameBadges";
import { getPlayerCount, isFull, type Coords } from "@/lib/feed/filters";

interface NearbyGameRowProps {
  game: Game;
  coords?: Coords | null;
}

function PlayerProgress({ current, max }: { current: number; max: number }) {
  const pct = max > 0 ? Math.min(100, (current / max) * 100) : 0;
  const full = current >= max;
  return (
    <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/10">
      <div
        className={`h-full rounded-full transition-[width] duration-300 ${
          full ? "bg-white/30" : pct >= 80 ? "bg-amber-300" : "bg-rondo-accent"
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
  const full = isFull(game);
  const spotsLeft = game.max_players - playerCount;

  return (
    <Link
      href={`/games/${game.id}`}
      className="group grid grid-cols-[5.5rem_1fr] gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-2.5 transition hover:border-rondo-accent/35 active:scale-[0.99]"
    >
      <div className="relative h-[6.7rem] overflow-hidden rounded-xl bg-secondary">
        {game.banner_url ? (
          <img src={game.banner_url} alt="" className="h-full w-full object-cover" />
        ) : (
          <Image src="/feed/hero-night-court.png" alt="" fill className="object-cover" sizes="120px" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/78 to-transparent" />
        <span className="absolute bottom-2 left-2 font-heading text-[11px] font-black uppercase text-rondo-accent">
          {game.price_per_player === 0 ? "Free" : formatPrice(game.price_per_player)}
        </span>
      </div>

      <div className="min-w-0 py-1 pr-1">
        <div className="mb-1 flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 font-heading text-lg font-black uppercase italic leading-none text-white">
            {game.title}
          </h3>
          <ChevronRight size={16} className="mt-0.5 shrink-0 text-white/30 transition group-hover:text-rondo-accent" />
        </div>
        <p className="truncate font-body text-[11px] text-white/50">{game.venue_name}</p>

        <GameBadges game={game} coords={coords} className="mt-2" />

        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="font-body text-[10px] text-white/43">
            {formatShortDate(game.date_time)} / {formatGameTime(game.date_time)}
          </span>
          <span className={`font-body text-[10px] ${full ? "text-white/40" : "text-rondo-accent"}`}>
            {full ? "Full" : `${spotsLeft} left`}
          </span>
        </div>
        <PlayerProgress current={playerCount} max={game.max_players} />
      </div>
    </Link>
  );
}

function RowSkeleton() {
  return (
    <div className="grid grid-cols-[5.5rem_1fr] gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-2.5">
      <div className="h-[6.7rem] shrink-0 rounded-xl rondo-shimmer" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="h-4 w-2/5 rounded rondo-shimmer" />
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
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
        <MapPinned size={24} className="text-white/40" />
      </div>
      <p className="font-heading text-base font-black uppercase italic text-white">
        {tab === "nearby" ? "No nearby matches" : "No upcoming matches"}
      </p>
      <p className="mt-1 max-w-[260px] font-body text-sm text-white/50">
        {tab === "nearby"
          ? "Nothing in the next 7 days yet. Check Upcoming or the Map tab to explore more."
          : "Nothing scheduled beyond this week yet. Check Nearby for sooner games."}
      </p>
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

export function NearbyGamesSection({
  games,
  tab,
  onTabChange,
  loading,
  hasMore,
  loadingMore,
  onLoadMore,
}: NearbyGamesSectionProps) {
  return (
    <section id="nearby-games" className="px-4 pb-8 pt-6">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/35">Match board</p>
          <h2 className="font-heading text-2xl font-black uppercase italic leading-none text-white">
            Find your next five
          </h2>
        </div>
        <Link
          href="/feed/map"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.055] text-white/58 transition-colors hover:text-rondo-accent"
          aria-label="Open map"
        >
          <Map size={16} />
        </Link>
      </div>

      <div className="mb-3 flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.045] p-1">
        <button
          type="button"
          onClick={() => onTabChange("nearby")}
          className={`min-h-9 flex-1 rounded-lg px-3 py-1.5 font-heading text-xs uppercase tracking-wide transition-all duration-200 ${
            tab === "nearby" ? "bg-rondo-accent font-black text-black" : "text-white/50 hover:text-white/80"
          }`}
        >
          Nearby
        </button>
        <button
          type="button"
          onClick={() => onTabChange("upcoming")}
          className={`min-h-9 flex-1 rounded-lg px-3 py-1.5 font-heading text-xs uppercase tracking-wide transition-all duration-200 ${
            tab === "upcoming" ? "bg-rondo-accent font-black text-black" : "text-white/50 hover:text-white/80"
          }`}
        >
          Upcoming
        </button>
      </div>

      <div className="mt-2 space-y-3">
        {loading ? (
          <div className="space-y-3 py-1">
            {[0, 1, 2, 3].map((i) => (
              <RowSkeleton key={i} />
            ))}
          </div>
        ) : games.length === 0 ? (
          <EmptyState tab={tab} />
        ) : (
          <>
            {games.map((game) => (
              <NearbyGameRow key={game.id} game={game} />
            ))}
            {hasMore && onLoadMore && (
              <button
                onClick={onLoadMore}
                disabled={loadingMore}
                className="rondo-btn mt-4 w-full cursor-pointer border border-white/10 bg-white/[0.045] text-white/62 hover:text-rondo-accent disabled:opacity-40"
              >
                {loadingMore ? "Loading..." : "Load More"}
              </button>
            )}
          </>
        )}
      </div>
    </section>
  );
}
