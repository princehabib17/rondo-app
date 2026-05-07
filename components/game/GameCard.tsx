import Link from "next/link";
import { Calendar, MapPin, Users, Trophy } from "lucide-react";
import { formatGameDate, formatPrice } from "@/lib/utils/format";
import type { Game } from "@/lib/supabase/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface GameCardProps {
  game: Game;
  index?: number;
}

export function GameCard({ game, index = 0 }: GameCardProps) {
  const playerCount = game.game_players?.length ?? 0;
  const spotsLeft = game.max_players - playerCount;
  const isFull = spotsLeft <= 0;

  return (
    <Link
      href={`/games/${game.id}`}
      className="block cursor-pointer"
      style={{ animationDelay: `${index * 80}ms`, animationFillMode: "both" }}
    >
      <article className="group bg-card border border-border rounded-xl overflow-hidden hover:border-rondo-yellow/40 transition-all duration-200 active:scale-[0.98]">
        {/* Banner */}
        <div className="relative h-28 w-full overflow-hidden">
          {game.banner_url ? (
            <img
              src={game.banner_url}
              alt={game.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-green-950 via-green-900 to-rondo-black flex items-center justify-center">
              <Trophy size={32} className="text-green-700" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
          <div className="absolute top-3 right-3">
            <span className="bg-rondo-yellow text-rondo-black font-black text-sm px-2.5 py-1 rounded-lg">
              {formatPrice(game.price_per_player)}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          <h3 className="text-white font-bold text-base leading-tight">{game.title}</h3>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <Calendar size={12} className="shrink-0" />
              <span>{formatGameDate(game.date_time)}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <MapPin size={12} className="shrink-0" />
              <span className="truncate">{game.venue_name}</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Users size={12} className="text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">{playerCount}/{game.max_players}</span>
              {!isFull && (
                <span className="text-green-400 font-medium">{spotsLeft} spots left</span>
              )}
              {isFull && <span className="text-destructive font-medium">Full</span>}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="text-xs h-5">{game.format}</Badge>
            <Badge variant="secondary" className="text-xs h-5">{game.round_duration_minutes}min rounds</Badge>
            {game.payment_type === "online" && (
              <Badge className="text-xs h-5 bg-rondo-yellow/20 text-rondo-yellow border-rondo-yellow/30">Online Pay</Badge>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}

export function GameCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="h-28 bg-muted animate-pulse" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
        <div className="space-y-2">
          <div className="h-3 bg-muted rounded animate-pulse w-full" />
          <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
          <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
        </div>
        <div className="flex gap-2">
          <div className="h-5 w-12 bg-muted rounded animate-pulse" />
          <div className="h-5 w-20 bg-muted rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}
