import Link from "next/link";
import Image from "next/image";
import { ChevronRight, Clock, Map, MapPin, MapPinned, Users } from "lucide-react";
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
    <div className="h-[3px] w-full rounded-full bg-white/8 overflow-hidden">
      <div
        className={`h-full rounded-full transition-[width] duration-500 ${
          full ? "bg-white/25" : pct >= 80 ? "bg-amber-400" : "bg-rondo-accent"
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
  const pct = game.max_players > 0 ? Math.round((playerCount / game.max_players) * 100) : 0;

  return (
    <Link
      href={`/games/${game.id}`}
      className="flex gap-3 py-3.5 border-b border-white/[0.06] last:border-0 active:opacity-75 transition-opacity group"
    >
      {/* Thumbnail */}
      <div className="relative w-[76px] h-[76px] rounded-xl overflow-hidden bg-[#1c1c1c] shrink-0 border border-white/[0.07]">
        {game.banner_url ? (
          <img src={game.banner_url} alt="" className="w-full h-full object-cover" />
        ) : game.organization?.logo_url ? (
          <Image
            src={game.organization.logo_url}
            alt=""
            fill
            className="object-cover"
            sizes="76px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-white/[0.06] to-transparent">
            <span className="font-heading text-white/60 font-black text-lg italic">
              {getOrganizerInitials(organizerName)}
            </span>
          </div>
        )}
        {/* Spots left badge overlay */}
        {!full && spotsLeft <= 4 && (
          <div className="absolute bottom-1 left-1 right-1">
            <span className="block w-full text-center bg-black/70 backdrop-blur-sm rounded-md font-heading text-amber-400 text-[9px] font-black uppercase py-0.5 tracking-wide">
              {spotsLeft} left
            </span>
          </div>
        )}
        {full && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="font-heading text-white/60 text-[9px] font-black uppercase tracking-widest">Full</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
        <div>
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-heading text-white font-black italic text-[15px] uppercase leading-tight line-clamp-1 flex-1">
              {game.title}
            </h3>
            <span className={`font-heading text-sm font-black shrink-0 ${full ? "text-white/35" : "text-rondo-accent"}`}>
              {game.price_per_player === 0 ? "Free" : formatPrice(game.price_per_player)}
            </span>
          </div>

          <div className="flex items-center gap-2 text-white/45 mb-1.5">
            <MapPin size={10} className="shrink-0" />
            <span className="font-body text-[11px] truncate">{game.venue_name}</span>
          </div>

          <div className="flex items-center gap-3 text-white/35 mb-2">
            <span className="font-body text-[10px] flex items-center gap-1">
              <Clock size={9} />
              {formatShortDate(game.date_time)} · {formatGameTime(game.date_time)}
            </span>
            <span className="font-body text-[10px] flex items-center gap-1">
              <Users size={9} />
              {playerCount}/{game.max_players}
            </span>
          </div>
        </div>

        <PlayerProgress current={playerCount} max={game.max_players} />
      </div>

      <div className="flex items-center self-center">
        <ChevronRight size={15} className="text-white/20 group-hover:text-white/40 transition-colors shrink-0" />
      </div>
    </Link>
  );
}

function RowSkeleton() {
  return (
    <div className="flex gap-3 py-3.5 border-b border-white/[0.06]">
      <div className="w-[76px] h-[76px] rounded-xl rondo-shimmer shrink-0" />
      <div className="flex-1 min-w-0 flex flex-col gap-2 py-1">
        <div className="flex items-center justify-between gap-2">
          <div className="h-3.5 w-2/5 rounded rondo-shimmer" />
          <div className="h-3 w-10 rounded rondo-shimmer" />
        </div>
        <div className="h-2.5 w-1/2 rounded rondo-shimmer" />
        <div className="h-2 w-2/5 rounded rondo-shimmer" />
        <div className="h-[3px] w-full rounded-full rondo-shimmer mt-auto" />
      </div>
    </div>
  );
}

function EmptyState({ tab }: { tab: "nearby" | "upcoming" }) {
  return (
    <div className="flex flex-col items-center text-center py-14 px-4">
      <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/8 flex items-center justify-center mb-4">
        <MapPinned size={24} className="text-white/30" />
      </div>
      <p className="font-heading text-white font-black italic text-base uppercase mb-1">
        {tab === "nearby" ? "No nearby matches" : "No upcoming matches"}
      </p>
      <p className="font-body text-white/40 text-sm leading-relaxed max-w-[240px]">
        {tab === "nearby"
          ? "Nothing in the next 7 days. Check Upcoming or the Map."
          : "Nothing scheduled beyond this week yet."}
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
    <section id="nearby-games" className="px-4 pt-5 pb-4">
      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        {/* Pill tab switcher */}
        <div className="flex items-center gap-1 bg-white/[0.05] rounded-xl p-1 border border-white/[0.06]">
          <button
            type="button"
            onClick={() => onTabChange("nearby")}
            className={`font-heading text-[11px] font-black uppercase tracking-wide px-3.5 py-1.5 rounded-lg transition-all duration-200 ${
              tab === "nearby"
                ? "bg-rondo-accent text-black shadow-sm"
                : "text-white/40 hover:text-white/65"
            }`}
          >
            Nearby
          </button>
          <button
            type="button"
            onClick={() => onTabChange("upcoming")}
            className={`font-heading text-[11px] font-black uppercase tracking-wide px-3.5 py-1.5 rounded-lg transition-all duration-200 ${
              tab === "upcoming"
                ? "bg-rondo-accent text-black shadow-sm"
                : "text-white/40 hover:text-white/65"
            }`}
          >
            Upcoming
          </button>
        </div>

        <Link
          href="/feed/map"
          className="flex items-center gap-1.5 font-body text-white/40 text-[11px] hover:text-rondo-accent transition-colors"
        >
          <Map size={13} />
          <span>Map</span>
        </Link>
      </div>

      <div>
        {loading ? (
          <div>
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
                className="w-full mt-5 py-3 font-body text-white/40 hover:text-rondo-accent text-[11px] uppercase tracking-widest border border-white/[0.07] rounded-xl transition-colors disabled:opacity-40 cursor-pointer"
              >
                {loadingMore ? "Loading…" : "Load More"}
              </button>
            )}
          </>
        )}
      </div>
    </section>
  );
}
