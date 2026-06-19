import Link from "next/link";
import Image from "next/image";
import { Calendar, MapPin, Users, Trophy } from "lucide-react";
import { formatGameDate, formatPrice } from "@/lib/utils/format";
import type { Game } from "@/lib/supabase/types";
import { Badge } from "@/components/ui/badge";

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
      <article className="group bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/60 transition-all duration-200 active:scale-[0.98]">
        {/* Banner */}
        <div className="relative h-32 w-full overflow-hidden bg-muted">
          {game.banner_url ? (
            <Image
              src={game.banner_url}
              alt={game.title}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-300"
              sizes="(max-width: 512px) 100vw, 512px"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border-b border-border">
              <Trophy size={40} className="text-primary/40" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
          {/* Price Badge */}
          <div className="absolute top-3 right-3">
            <span className="bg-primary text-primary-foreground font-black text-xs px-3 py-1.5 rounded-lg shadow-lg">
              {formatPrice(game.price_per_player)}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          <h3 className="text-foreground font-black text-base leading-tight truncate">{game.title}</h3>

          {/* Game Details */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <Calendar size={14} className="shrink-0 text-primary" />
              <span className="font-medium">{formatGameDate(game.date_time)}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <MapPin size={14} className="shrink-0 text-primary" />
              <span className="truncate font-medium">{game.venue_name}</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Users size={14} className="text-primary shrink-0" />
              <span className="font-medium">{playerCount}/{game.max_players}</span>
              {!isFull && (
                <span className="text-primary font-bold text-xs ml-auto">{spotsLeft} left</span>
              )}
              {isFull && <span className="text-destructive font-bold text-xs ml-auto">Full</span>}
            </div>
          </div>

          {/* Tags */}
          <div className="flex items-center gap-2 flex-wrap pt-2">
            <Badge variant="secondary" className="text-xs font-semibold">{game.format}</Badge>
            <Badge variant="secondary" className="text-xs font-semibold">{game.round_duration_minutes}m</Badge>
            {game.payment_type === "online" && (
              <Badge className="text-xs font-semibold bg-primary/20 text-primary border-primary/30">Pay Online</Badge>
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
