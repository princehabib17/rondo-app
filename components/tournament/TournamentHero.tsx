"use client";

import { differenceInDays, differenceInHours, differenceInMinutes, format } from "date-fns";
import { CalendarBlank, Clock, MapPin, Shield, Trophy } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import type { Tournament, TournamentMatch } from "@/lib/supabase/types";
import { formatPrice } from "@/lib/utils/format";
import { FORMAT_LABEL, TOURNAMENT_STATUS_META, sceneVariant, statusToneClasses } from "@/components/tournament/TournamentCard";
import { computeLiveSummary } from "@/lib/tournament/bracket";

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
  const stats = [
    { label: "Teams", value: `${teamCount}/${tournament.max_teams}` },
    middleStat,
    { label: "Entry", value: tournament.entry_fee > 0 ? formatPrice(tournament.entry_fee) : "Free", gold: tournament.entry_fee > 0 },
  ];

  return (
    <div
      className={cn(
        "relative overflow-hidden border-b border-[var(--stroke)] rondo-floodlight-scene",
        tournament.status === "completed" && "rondo-floodlight-scene--gold"
      )}
      data-variant={sceneVariant(tournament.id)}
    >
      <Trophy
        size={180}
        weight="duotone"
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-6 text-[color-mix(in_oklch,var(--gold)_9%,transparent)]"
      />

      <div className="relative mx-auto max-w-lg px-4 pb-6 pt-8">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "inline-flex h-7 items-center gap-2 rounded-[var(--r-pill)] border px-3 rondo-label",
              statusToneClasses(meta.tone)
            )}
          >
            {meta.tone === "live" && <span className="rondo-live-dot" />}
            {meta.label}
          </span>
          {countdown && (
            <span className="inline-flex h-7 items-center gap-1 rounded-[var(--r-pill)] border border-[var(--stroke)] px-3 rondo-label text-[var(--ink-mid)]">
              <Clock size={13} aria-hidden />
              {countdown}
            </span>
          )}
        </div>

        <h2 className="mt-4 font-heading text-[2.5rem] font-bold uppercase leading-[0.95] tracking-[0.005em] text-[var(--ink-hi)] [text-wrap:balance]">
          {tournament.name}
        </h2>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 rondo-meta text-[var(--ink-mid)]">
          <span className="inline-flex items-center gap-1.5">
            <CalendarBlank size={15} className="text-[var(--ink-low)]" aria-hidden />
            {format(new Date(tournament.starts_at), "EEE, MMM d · h:mm a")}
          </span>
          {tournament.venue_name && (
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={15} className="text-[var(--ink-low)]" aria-hidden />
              {tournament.venue_name}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5">
            <Shield size={15} className="text-[var(--ink-low)]" aria-hidden />
            {FORMAT_LABEL[tournament.format]} · {tournament.team_size}-a-side
          </span>
        </div>

        <dl className="mt-6 grid grid-cols-3 divide-x divide-[var(--stroke)] overflow-hidden rounded-[var(--r-md)] border border-[var(--stroke)] bg-[color-mix(in_oklch,var(--bg-page)_55%,transparent)] backdrop-blur-sm">
          {stats.map((stat) => (
            <div key={stat.label} className="min-w-0 px-3 py-3">
              <dt className="rondo-label text-[var(--ink-low)]">{stat.label}</dt>
              <dd
                className={cn(
                  "mt-1 truncate font-heading text-xl font-bold leading-6 tabular-nums",
                  "gold" in stat && stat.gold ? "text-[var(--gold)]" : "text-[var(--ink-hi)]"
                )}
              >
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
