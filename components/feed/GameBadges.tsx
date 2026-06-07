import { Lock, Users2, Zap } from "lucide-react";
import type { Game } from "@/lib/supabase/types";
import {
  getMatchType,
  getSkillGroup,
  isAlmostFull,
  isFull,
  SKILL_GROUP_LABEL,
  gameDistanceKm,
  type Coords,
} from "@/lib/feed/filters";
import { cn } from "@/lib/utils";

function Pill({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: "neutral" | "accent" | "warn" | "muted";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-body font-semibold uppercase tracking-wide leading-none",
        tone === "neutral" && "bg-white/8 text-white/70 border border-white/10",
        tone === "accent" && "bg-rondo-accent/15 text-rondo-accent border border-rondo-accent/25",
        tone === "warn" && "bg-amber-400/15 text-amber-300 border border-amber-400/25",
        tone === "muted" && "bg-white/5 text-white/50 border border-white/8",
        className
      )}
    >
      {children}
    </span>
  );
}

interface GameBadgesProps {
  game: Game;
  coords?: Coords | null;
  /** Hide the status (almost full / full) badge, e.g. when shown elsewhere. */
  showStatus?: boolean;
  className?: string;
}

export function GameBadges({
  game,
  coords = null,
  showStatus = true,
  className,
}: GameBadgesProps) {
  const matchType = getMatchType(game);
  const skill = getSkillGroup(game);
  const full = isFull(game);
  const almost = isAlmostFull(game);
  const distance = gameDistanceKm(game, coords);

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      <Pill tone={matchType === "futsal" ? "accent" : "neutral"}>{matchType}</Pill>

      {skill && <Pill tone="muted">{SKILL_GROUP_LABEL[skill]}</Pill>}

      {game.is_private && (
        <Pill tone="muted">
          <Lock size={9} strokeWidth={2.5} />
          Private
        </Pill>
      )}

      {showStatus && full && (
        <Pill tone="muted">
          <Users2 size={9} strokeWidth={2.5} />
          Full
        </Pill>
      )}
      {showStatus && !full && almost && (
        <Pill tone="warn">
          <Zap size={9} strokeWidth={2.5} />
          Almost full
        </Pill>
      )}

      {distance != null && (
        <Pill tone="muted">
          {distance < 1 ? `${Math.round(distance * 1000)} m` : `${distance.toFixed(1)} km`}
        </Pill>
      )}
    </div>
  );
}
