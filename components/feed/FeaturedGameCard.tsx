import Link from "next/link";
import Image from "next/image";
import { Calendar, MapPin, Users, Zap } from "lucide-react";
import { formatGameDate, formatPrice } from "@/lib/utils/format";
import type { Game } from "@/lib/supabase/types";
import { getOrganizerInitials } from "@/lib/feed/organizers";
import { GameBadges } from "@/components/feed/GameBadges";

interface FeaturedGameCardProps {
  game: Game;
}

function PlayerProgress({ current, max }: { current: number; max: number }) {
  const pct = max > 0 ? Math.min(100, (current / max) * 100) : 0;
  const urgent = pct >= 80;
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="font-body text-[10px] text-white/40">{current} / {max} players</span>
        {urgent && (
          <span className="font-heading text-[10px] font-black uppercase text-amber-400 tracking-wide flex items-center gap-1">
            <Zap size={9} className="fill-amber-400" />
            Filling fast
          </span>
        )}
      </div>
      <div className="h-[3px] w-full rounded-full bg-white/[0.08] overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${urgent ? "bg-amber-400" : "bg-rondo-accent"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function FeaturedGameCard({ game }: FeaturedGameCardProps) {
  const playerCount = game.game_players?.length ?? 0;
  const organizerName = game.organization?.name ?? game.organizer?.full_name ?? "Organizer";
  const spotsLeft = Math.max(0, game.max_players - playerCount);

  return (
    <section className="px-4 pt-5">
      {/* Section label */}
      <div className="flex items-center gap-2 mb-3">
        <span className="rondo-kicker text-rondo-accent">Featured Match</span>
        <div className="flex-1 h-px bg-white/[0.06]" />
      </div>

      <article className="rounded-[1.25rem] overflow-hidden border border-white/[0.08] bg-[#111]"
        style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)" }}
      >
        {/* Banner image — full width, tall */}
        <div className="relative h-44 w-full bg-[#1a1a1a]">
          {game.banner_url ? (
            <img src={game.banner_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <Image src="/feed/hero-soccer.jpg" alt="" fill className="object-cover" sizes="430px" />
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.7) 100%)" }} />

          {/* Top row: organizer + spots badge */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
            <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md rounded-full px-2.5 py-1.5 border border-white/[0.1]">
              {game.organization?.logo_url ? (
                <Image src={game.organization.logo_url} alt="" width={16} height={16} className="h-4 w-4 rounded-full object-cover" />
              ) : (
                <span className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-[8px] font-heading text-white font-black">
                  {getOrganizerInitials(organizerName)}
                </span>
              )}
              <span className="font-body text-white/80 text-[11px] font-medium">{organizerName}</span>
            </div>

            <div className={`flex items-center gap-1 rounded-full px-3 py-1.5 border font-heading text-[10px] font-black uppercase tracking-wide ${
              spotsLeft === 0
                ? "bg-black/60 border-white/10 text-white/40"
                : spotsLeft <= 3
                  ? "bg-amber-400/15 border-amber-400/30 text-amber-400"
                  : "bg-rondo-accent/15 border-rondo-accent/30 text-rondo-accent"
            }`}
              style={{ backdropFilter: "blur(12px)" }}
            >
              {spotsLeft === 0 ? "Full" : `${spotsLeft} spots`}
            </div>
          </div>

          {/* Title over image bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <h3 className="rondo-hero-title text-white text-[1.75rem] leading-none truncate">
              {game.title}
            </h3>
          </div>
        </div>

        {/* Details below image */}
        <div className="p-4 space-y-3.5">
          <GameBadges game={game} />

          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-white/[0.05] flex items-center justify-center shrink-0">
                <Calendar size={13} className="text-white/50" />
              </div>
              <span className="font-body text-white/60 text-[11px] truncate">{formatGameDate(game.date_time)}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-white/[0.05] flex items-center justify-center shrink-0">
                <MapPin size={13} className="text-white/50" />
              </div>
              <span className="font-body text-white/60 text-[11px] truncate">{game.venue_name}</span>
            </div>
          </div>

          <div className="flex items-end justify-between">
            <div>
              <p className="font-body text-[10px] text-white/30 uppercase tracking-wide mb-0.5">per player</p>
              <p className="font-heading text-rondo-accent font-black text-[1.6rem] italic uppercase leading-none">
                {formatPrice(game.price_per_player)}
              </p>
            </div>
            <Link
              href={`/games/${game.id}`}
              className="rondo-btn rondo-btn-primary min-h-[2.75rem] text-[12px] px-5 w-auto"
            >
              View Match
            </Link>
          </div>

          <PlayerProgress current={playerCount} max={game.max_players} />
        </div>
      </article>
    </section>
  );
}

export function FeaturedGameSkeleton() {
  return (
    <section className="px-4 pt-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-2.5 w-28 rounded rondo-shimmer" />
        <div className="flex-1 h-px bg-white/[0.06]" />
      </div>
      <div className="rounded-[1.25rem] overflow-hidden border border-white/[0.06]">
        <div className="h-44 rondo-shimmer" />
        <div className="p-4 space-y-3 bg-[#111]">
          <div className="h-3 w-1/2 rounded rondo-shimmer" />
          <div className="grid grid-cols-2 gap-2">
            <div className="h-7 rounded-lg rondo-shimmer" />
            <div className="h-7 rounded-lg rondo-shimmer" />
          </div>
          <div className="flex justify-between items-end">
            <div className="h-8 w-20 rounded rondo-shimmer" />
            <div className="h-11 w-28 rounded-xl rondo-shimmer" />
          </div>
          <div className="h-[3px] w-full rounded-full rondo-shimmer" />
        </div>
      </div>
    </section>
  );
}
