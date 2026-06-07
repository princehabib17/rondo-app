import Link from "next/link";
import Image from "next/image";
import { Calendar, ChevronRight, MapPin, Star, Users } from "lucide-react";
import { formatGameDate, formatPrice } from "@/lib/utils/format";
import type { Game } from "@/lib/supabase/types";
import { getOrganizerInitials } from "@/lib/feed/organizers";
import { GameBadges } from "@/components/feed/GameBadges";

interface FeaturedGameCardProps {
  game: Game;
}

function PlayerProgress({ current, max }: { current: number; max: number }) {
  const pct = max > 0 ? Math.min(100, (current / max) * 100) : 0;
  return (
    <div className="h-1 w-full rounded-full bg-white/10 overflow-hidden">
      <div className="h-full bg-rondo-accent rounded-full transition-all" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function FeaturedGameCard({ game }: FeaturedGameCardProps) {
  const playerCount = game.game_players?.length ?? 0;
  const organizerName = game.organizer?.full_name ?? "Organizer";

  return (
    <section className="px-4 pt-6">
      <div className="flex items-center gap-2 mb-3">
        <Star size={16} className="text-rondo-accent fill-rondo-accent" />
        <h2 className="font-heading text-white font-black italic text-sm uppercase tracking-wide">
          Featured Match
        </h2>
      </div>

      <article className="bg-card border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-colors">
        <div className="flex gap-0">
          <div className="relative w-[42%] min-h-[180px] shrink-0 bg-secondary">
            {game.banner_url ? (
              <img src={game.banner_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <Image src="/feed/hero-soccer.jpg" alt="" fill className="object-cover" sizes="160px" />
            )}
            <span className="absolute top-2 left-2 bg-rondo-accent text-black font-heading font-black text-[9px] uppercase px-2 py-0.5 rounded">
              Featured
            </span>
          </div>

          <div className="flex-1 p-3.5 flex flex-col min-w-0">
            <h3 className="font-heading text-white font-black italic text-lg uppercase leading-none mb-2 truncate">
              {game.title}
            </h3>

            <GameBadges game={game} className="mb-2" />

            <div className="space-y-1.5 font-body text-white/60 text-[11px] mb-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-4 h-4 rounded-full bg-secondary flex items-center justify-center shrink-0 text-[8px] font-heading text-white">
                  {getOrganizerInitials(organizerName)}
                </span>
                <span className="truncate">{organizerName}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar size={11} className="shrink-0" />
                <span className="truncate">{formatGameDate(game.date_time)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin size={11} className="shrink-0" />
                <span className="truncate">{game.venue_name}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users size={11} className="shrink-0" />
                <span>
                  {playerCount} / {game.max_players} players
                </span>
              </div>
            </div>

            <p className="font-heading text-rondo-accent font-black text-sm uppercase mb-2">
              {formatPrice(game.price_per_player)}{" "}
              <span className="text-[10px] text-white/50 font-body normal-case tracking-normal">
                per player
              </span>
            </p>

            <PlayerProgress current={playerCount} max={game.max_players} />

            <Link
              href={`/games/${game.id}`}
              className="mt-3 self-end inline-flex items-center gap-1 font-heading text-rondo-accent text-[11px] font-black uppercase tracking-wider hover:underline"
            >
              View Match
              <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </article>
    </section>
  );
}

export function FeaturedGameSkeleton() {
  return (
    <section className="px-4 pt-6">
      <div className="h-4 w-32 bg-white/10 rounded animate-pulse mb-3" />
      <div className="h-[180px] bg-card border border-white/10 rounded-2xl animate-pulse" />
    </section>
  );
}
