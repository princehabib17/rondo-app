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
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
      <div className="h-full rounded-full bg-rondo-accent transition-all" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function FeaturedGameCard({ game }: FeaturedGameCardProps) {
  const playerCount = game.game_players?.length ?? 0;
  const organizerName = game.organization?.name ?? game.organizer?.full_name ?? "Organizer";

  return (
    <section className="px-4 pt-6">
      <div className="mb-3 flex items-center gap-2">
        <Star size={16} className="fill-rondo-accent text-rondo-accent" />
        <h2 className="font-heading text-sm font-black uppercase italic tracking-wide text-white">
          Featured Match
        </h2>
      </div>

      <article className="rondo-poster overflow-hidden">
        <div className="relative min-h-[25rem]">
          <div className="absolute inset-x-0 top-0 h-[58%] bg-[#141511]">
            {game.banner_url ? (
              <img src={game.banner_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <Image src="/feed/hero-soccer.jpg" alt="" fill className="object-cover" sizes="400px" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#080907] via-[#080907]/38 to-transparent" />
          </div>

          <div className="relative z-10 flex min-h-[25rem] flex-col justify-end p-5">
            <span className="mb-3 inline-flex self-start rounded-full border border-rondo-accent/35 bg-black/65 px-3 py-1 font-heading text-[10px] font-black uppercase tracking-wide text-rondo-accent">
              {Math.max(0, game.max_players - playerCount)} spots left
            </span>

            <h3 className="rondo-hero-title mb-3 text-[3rem] text-white">{game.title}</h3>

            <GameBadges game={game} className="mb-1" />

            <div className="my-4 grid grid-cols-2 gap-2 font-body text-[11px] text-white/66">
              <div className="flex min-w-0 items-center gap-1.5">
                {game.organization?.logo_url ? (
                  <Image
                    src={game.organization.logo_url}
                    alt=""
                    width={17}
                    height={17}
                    className="h-4 w-4 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-secondary font-heading text-[8px] text-white">
                    {getOrganizerInitials(organizerName)}
                  </span>
                )}
                <span className="truncate">{organizerName}</span>
              </div>
              <div className="flex items-center justify-end gap-1.5">
                <Calendar size={11} className="shrink-0" />
                <span className="truncate">{formatGameDate(game.date_time)}</span>
              </div>
              <div className="flex min-w-0 items-center gap-1.5">
                <MapPin size={11} className="shrink-0" />
                <span className="truncate">{game.venue_name}</span>
              </div>
              <div className="flex items-center justify-end gap-1.5">
                <Users size={11} className="shrink-0" />
                <span>
                  {playerCount} / {game.max_players} players
                </span>
              </div>
            </div>

            <p className="mb-3 font-heading text-3xl font-black uppercase italic text-rondo-accent">
              {formatPrice(game.price_per_player)}{" "}
              <span className="font-body text-[10px] normal-case tracking-normal text-white/50 not-italic">
                per player
              </span>
            </p>

            <PlayerProgress current={playerCount} max={game.max_players} />

            <Link href={`/games/${game.id}`} className="rondo-btn rondo-btn-primary mt-4 min-h-[3.15rem] text-[12px]">
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
      <div className="mb-3 h-4 w-32 animate-pulse rounded bg-white/10" />
      <div className="h-[25rem] animate-pulse rounded-2xl border border-white/10 bg-card" />
    </section>
  );
}
