"use client";

import { differenceInDays, differenceInHours, differenceInMinutes } from "date-fns";
import { CalendarBlank, Clock, MapPin, Shield, Trophy, Users } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import type { Tournament, TournamentMatch } from "@/lib/supabase/types";
import { formatGameDate, formatPrice } from "@/lib/utils/format";
import { FORMAT_LABEL, TOURNAMENT_STATUS_META, sceneVariant, statusToneClasses } from "@/components/tournament/TournamentCard";
import { computeLiveSummary } from "@/lib/tournament/bracket";
import { Chip, StatTile } from "@/components/rondo/primitives";

/**
 * The hero's middle stat tile. "Spots left" only means something while
 * registration is open — once it closes, the field is fixed, so a live or
 * finished tournament shows real progress instead of a stale capacity count.
 */
function progressStat(
  tournament: Tournament,
  teamCount: number,
  matches: Pick<TournamentMatch, "round" | "status">[]
): { label: string; value: string | number } {
  if (tournament.status === "registration") {
    return { label: "Left", value: Math.max(0, tournament.max_teams - teamCount) };
  }

  const summary = computeLiveSummary(tournament.format, teamCount, matches);
  if (!summary) return { label: "Matches", value: 0 };

  if (tournament.status === "active" && tournament.format === "single_elimination") {
    return { label: "Round", value: summary.roundLabel };
  }
  if (tournament.status === "active") {
    return { label: "Played", value: `${summary.matchesPlayed}/${summary.matchesTotal}` };
  }
  return { label: "Matches", value: summary.matchesTotal };
}

/** Compact "Starts in 3d" chip copy; null once the start time has passed. */
function formatCountdown(startsAt: string): string | null {
  const target = new Date(startsAt);
  const now = new Date();
  if (target.getTime() <= now.getTime()) return null;

  const days = differenceInDays(target, now);
  if (days >= 1) return `Starts in ${days}d`;
  const hours = differenceInHours(target, now);
  if (hours >= 1) return `Starts in ${hours}h`;
  const minutes = Math.max(1, differenceInMinutes(target, now));
  return `Starts in ${minutes}m`;
}

interface TournamentHeroProps {
  tournament: Tournament;
  teamCount: number;
  matches?: Pick<TournamentMatch, "round" | "status">[];
}

export function TournamentHero({ tournament, teamCount, matches = [] }: TournamentHeroProps) {
  const meta = TOURNAMENT_STATUS_META[tournament.status];
  const countdown = tournament.status === "registration" ? formatCountdown(tournament.starts_at) : null;
  const middleStat = progressStat(tournament, teamCount, matches);

  return (
    <div
      className="relative overflow-hidden border-b border-[var(--stroke)] rondo-floodlight-scene"
      data-variant={sceneVariant(tournament.id)}
    >
      <Trophy
        size={150}
        weight="duotone"
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-8 text-[color-mix(in_oklch,var(--gold)_10%,transparent)]"
      />

      <div className="relative mx-auto max-w-lg space-y-6 px-4 pb-6 pt-6">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "inline-flex h-8 items-center gap-1 rounded-[var(--r-pill)] border px-3 rondo-label",
              statusToneClasses(meta.tone)
            )}
          >
            {meta.tone === "live" && <span className="rondo-live-dot" />}
            {meta.label}
          </span>
          {countdown && (
            <span className="inline-flex h-8 items-center gap-1 rounded-[var(--r-pill)] border border-[var(--gold)] bg-[var(--gold-dim)] px-3 rondo-label text-[var(--gold)]">
              <Clock size={14} aria-hidden />
              {countdown}
            </span>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <div className="min-w-0 space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--r-sm)] border border-[var(--gold)] bg-[var(--gold-dim)] rondo-trophy-mark">
                <Trophy size={24} weight="duotone" className="text-[var(--gold)]" aria-hidden />
              </div>
              <div className="min-w-0">
                <h1 className="rondo-display text-[var(--ink-hi)]">{tournament.name}</h1>
                <p className="mt-2 rondo-meta text-[var(--ink-low)]">
                  {FORMAT_LABEL[tournament.format]} at {tournament.venue_name || "venue TBD"}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 sm:w-64">
            <StatTile label="Teams" value={teamCount} size="sm" className="col-span-1 p-3" />
            <StatTile label={middleStat.label} value={middleStat.value} size="sm" className="col-span-1 p-3" />
            <StatTile label="Fee" value={tournament.entry_fee > 0 ? formatPrice(tournament.entry_fee) : "Free"} size="sm" className="col-span-1 p-3" />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Chip
            label={formatGameDate(tournament.starts_at)}
            variant="ghost"
            icon={<CalendarBlank size={16} className="text-[var(--gold)]" aria-hidden />}
          />
          {tournament.venue_name && (
            <Chip
              label={tournament.venue_name}
              variant="ghost"
              icon={<MapPin size={16} className="text-[var(--gold)]" aria-hidden />}
            />
          )}
          <Chip
            label={FORMAT_LABEL[tournament.format]}
            variant="ghost"
            icon={<Shield size={16} className="text-[var(--gold)]" aria-hidden />}
          />
          <Chip
            label={`${teamCount}/${tournament.max_teams} teams · ${tournament.team_size}-a-side`}
            variant="ghost"
            icon={<Users size={16} className="text-[var(--gold)]" aria-hidden />}
          />
          {tournament.entry_fee > 0 && <Chip label={`${formatPrice(tournament.entry_fee)} / team`} variant="gold" />}
        </div>
      </div>
    </div>
  );
}
