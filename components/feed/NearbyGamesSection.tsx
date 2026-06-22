import Link from "next/link";
import Image from "next/image";
import { ChevronRight, Map, MapPinned } from "lucide-react";
import { formatGameTime, formatPrice } from "@/lib/utils/format";
import type { Game } from "@/lib/supabase/types";
import { getOrganizerInitials } from "@/lib/feed/organizers";
import { GameBadges } from "@/components/feed/GameBadges";
import { getPlayerCount, isFull, type Coords } from "@/lib/feed/filters";
import { format } from "date-fns";

interface NearbyGameRowProps {
  game: Game;
  coords?: Coords | null;
}

function PlayerProgress({ current, max }: { current: number; max: number }) {
  const pct = max > 0 ? Math.min(100, (current / max) * 100) : 0;
  const full = current >= max;
  return (
    <div className="h-1 w-full rounded-full bg-white/10 overflow-hidden mt-2">
      <div
        className={`h-full rounded-full transition-[width] duration-300 ${
          full ? "bg-white/30" : pct >= 80 ? "bg-amber-400" : "bg-rondo-accent"
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
      className="flex items-center gap-3 py-3 border-b border-white/5 last:border-0 active:opacity-80 transition-opacity"
    >
      <div className="w-11 h-11 rounded-full bg-secondary border border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
        {game.organization?.logo_url ? (
          <Image
            src={game.organization.logo_url}
            alt=""
            width={44}
            height={44}
            className="w-full h-full object-cover"
          />
        ) : game.organizer?.avatar_url ? (
          <Image
            src={game.organizer.avatar_url}
            alt=""
            width={44}
            height={44}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="font-heading text-white text-xs font-black">
            {getOrganizerInitials(organizerName)}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-heading text-white font-black italic text-sm uppercase leading-tight truncate">
            {game.title}
          </h3>
          <span className="font-heading text-rondo-accent text-xs font-black shrink-0">
            {game.price_per_player === 0 ? "Free" : formatPrice(game.price_per_player)}
          </span>
        </div>
        <p className="font-body text-white/50 text-[11px] truncate mt-0.5">{game.venue_name}</p>

        <GameBadges game={game} coords={coords} className="mt-1.5" />

        <div className="flex items-center justify-between mt-1.5">
          <span className="font-body text-white/40 text-[10px]">
            {formatShortDate(game.date_time)} · {formatGameTime(game.date_time)}
          </span>
          <span className={`font-body text-[10px] ${full ? "text-white/40" : "text-white/50"}`}>
            {full ? "Full" : `${spotsLeft} left`} · {playerCount}/{game.max_players}
          </span>
        </div>
        <PlayerProgress current={playerCount} max={game.max_players} />
      </div>

      <ChevronRight size={16} className="text-white/30 shrink-0" />
    </Link>
  );
}

function RowSkeleton() {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-white/5 last:border-0">
      <div className="w-11 h-11 rounded-full rondo-shimmer shrink-0" />
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
    <div className="flex flex-col items-center text-center py-12 px-4">
      <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
        <MapPinned size={24} className="text-white/40" />
      </div>
      <p className="font-heading text-white font-black italic text-base uppercase">
        {tab === "nearby" ? "No nearby matches" : "No upcoming matches"}
      </p>
      <p className="font-body text-white/50 text-sm mt-1 max-w-[260px]">
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

export function NearbyGamesSection({ games, tab, onTabChange, loading, hasMore, loadingMore, onLoadMore }: NearbyGamesSectionProps) {
  return (
    <section id="nearby-games" className="px-4 pt-6 pb-4">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1 bg-white/[0.06] rounded-xl p-1">
          <button
            type="button"
            onClick={() => onTabChange("nearby")}
            className={`font-heading text-xs uppercase tracking-wide px-3 py-1.5 rounded-lg transition-all duration-200 ${
              tab === "nearby"
                ? "bg-rondo-accent text-black font-black"
                : "text-white/50 hover:text-white/80"
            }`}
          >
            Nearby
          </button>
          <button
            type="button"
            onClick={() => onTabChange("upcoming")}
            className={`font-heading text-xs uppercase tracking-wide px-3 py-1.5 rounded-lg transition-all duration-200 ${
              tab === "upcoming"
                ? "bg-rondo-accent text-black font-black"
                : "text-white/50 hover:text-white/80"
            }`}
          >
            Upcoming
          </button>
        </div>

        <Link
          href="/feed/map"
          className="flex items-center gap-1.5 font-body text-white/50 text-xs hover:text-rondo-accent transition-colors"
        >
          <Map size={13} />
          <span>Map</span>
        </Link>
      </div>

      <div className="mt-2">
        {loading ? (
          <div className="py-1">
            {[0, 1, 2, 3].map((i) => (
              <RowSkeleton key={i} />
            ))}
          </div>
        ) : games.length === 0 ? (
          <EmptyState tab={tab} />
        ) : (
          <>
            {games.map((game) => <NearbyGameRow key={game.id} game={game} />)}
            {hasMore && onLoadMore && (
              <button
                onClick={onLoadMore}
                disabled={loadingMore}
                className="w-full mt-4 py-3 font-body text-white/50 hover:text-rondo-accent text-xs uppercase tracking-wider border border-white/10 rounded-xl transition-colors disabled:opacity-40 cursor-pointer"
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
