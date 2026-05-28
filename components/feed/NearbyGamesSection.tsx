import Link from "next/link";
import Image from "next/image";
import { ChevronRight, Map } from "lucide-react";
import { formatGameTime, formatPrice } from "@/lib/utils/format";
import type { Game } from "@/lib/supabase/types";
import { getOrganizerInitials } from "@/lib/feed/organizers";
import { format } from "date-fns";

interface NearbyGameRowProps {
  game: Game;
}

function PlayerProgress({ current, max }: { current: number; max: number }) {
  const pct = max > 0 ? Math.min(100, (current / max) * 100) : 0;
  return (
    <div className="h-1 w-full rounded-full bg-white/10 overflow-hidden mt-2">
      <div className="h-full bg-rondo-accent rounded-full" style={{ width: `${pct}%` }} />
    </div>
  );
}

function formatShortDate(dateString: string): string {
  return format(new Date(dateString), "EEE, MMM d");
}

export function NearbyGameRow({ game }: NearbyGameRowProps) {
  const playerCount = game.game_players?.length ?? 0;
  const organizerName = game.organizer?.full_name ?? "Organizer";

  return (
    <Link
      href={`/games/${game.id}`}
      className="flex items-center gap-3 py-3 border-b border-white/5 last:border-0 active:opacity-80 transition-opacity"
    >
      <div className="w-11 h-11 rounded-full bg-secondary border border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
        {game.organizer?.avatar_url ? (
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
            {formatPrice(game.price_per_player)}
          </span>
        </div>
        <p className="font-body text-white/50 text-[11px] truncate mt-0.5">{game.venue_name}</p>
        <div className="flex items-center justify-between mt-1">
          <span className="font-body text-white/40 text-[10px]">
            {formatShortDate(game.date_time)} · {formatGameTime(game.date_time)}
          </span>
          <span className="font-body text-white/50 text-[10px]">
            {playerCount}/{game.max_players}
          </span>
        </div>
        <PlayerProgress current={playerCount} max={game.max_players} />
      </div>

      <ChevronRight size={16} className="text-white/30 shrink-0" />
    </Link>
  );
}

interface NearbyGamesSectionProps {
  games: Game[];
  tab: "nearby" | "upcoming";
  onTabChange: (tab: "nearby" | "upcoming") => void;
  loading?: boolean;
}

export function NearbyGamesSection({ games, tab, onTabChange, loading }: NearbyGamesSectionProps) {
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
          <div className="space-y-4 py-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : games.length === 0 ? (
          <p className="font-body text-white/40 text-sm text-center py-10">
            No games found. Check back soon.
          </p>
        ) : (
          games.map((game) => <NearbyGameRow key={game.id} game={game} />)
        )}
      </div>
    </section>
  );
}
