import { Lightning, Lock, Users } from "@phosphor-icons/react";
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
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-body text-[10px] font-semibold uppercase leading-none tracking-wide",
        tone === "neutral" && "border-[var(--stroke)] bg-[var(--bg-inset)] text-[var(--ink-mid)]",
        tone === "accent" && "border-[color-mix(in_oklch,var(--gold)_34%,transparent)] bg-[var(--gold-dim)] text-[var(--gold)]",
        tone === "warn" && "border-[color-mix(in_oklch,var(--gold)_34%,transparent)] bg-[var(--gold-dim)] text-[var(--gold)]",
        tone === "muted" && "border-[var(--stroke)] bg-[color-mix(in_oklch,var(--ink-hi)_4%,transparent)] text-[var(--ink-low)]",
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
          <Lock size={9} weight="bold" />
          Private
        </Pill>
      )}

      {showStatus && full && (
        <Pill tone="muted">
          <Users size={9} weight="bold" />
          Full
        </Pill>
      )}
      {showStatus && !full && almost && (
        <Pill tone="warn">
          <Lightning size={9} weight="fill" />
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
