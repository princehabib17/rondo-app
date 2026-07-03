"use client";

import { differenceInDays, differenceInHours, differenceInMinutes } from "date-fns";
import { CalendarDays, Clock3, MapPin, Shield, Trophy, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Tournament } from "@/lib/supabase/types";
import { formatGameDate, formatPrice } from "@/lib/utils/format";
import { FORMAT_LABEL, TOURNAMENT_STATUS_META, sceneVariant, statusToneClasses } from "@/components/tournament/TournamentCard";

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
}

export function TournamentHero({ tournament, teamCount }: TournamentHeroProps) {
  const meta = TOURNAMENT_STATUS_META[tournament.status];
  const countdown = tournament.status === "registration" ? formatCountdown(tournament.starts_at) : null;

  return (
    <div
      className="relative overflow-hidden rounded-b-3xl border-b border-white/10 rondo-floodlight-scene"
      data-variant={sceneVariant(tournament.id)}
    >
      <Trophy
        size={150}
        strokeWidth={1}
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-8 text-white/[0.05]"
      />

      <div className="relative space-y-4 px-4 pb-6 pt-8">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide backdrop-blur-sm",
              statusToneClasses(meta.tone)
            )}
          >
            {meta.tone === "live" && <span className="rondo-live-dot" />}
            {meta.label}
          </span>
          {countdown && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-300">
              <Clock3 size={10} />
              {countdown}
            </span>
          )}
        </div>

        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-rondo-accent/30 bg-rondo-accent/10 rondo-trophy-mark">
            <Trophy size={22} className="text-rondo-accent" />
          </div>
          <h1 className="rondo-hero-title pt-1 text-3xl text-white">{tournament.name}</h1>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="rondo-chip">
            <CalendarDays size={13} className="shrink-0 text-rondo-accent" />
            <span className="truncate">{formatGameDate(tournament.starts_at)}</span>
          </span>
          {tournament.venue_name && (
            <span className="rondo-chip">
              <MapPin size={13} className="shrink-0 text-rondo-accent" />
              <span className="max-w-[160px] truncate">{tournament.venue_name}</span>
            </span>
          )}
          <span className="rondo-chip">
            <Shield size={13} className="shrink-0 text-rondo-accent" />
            {FORMAT_LABEL[tournament.format]}
          </span>
          <span className="rondo-chip">
            <Users size={13} className="shrink-0 text-rondo-accent" />
            {teamCount}/{tournament.max_teams} · {tournament.team_size}-a-side
          </span>
          {tournament.entry_fee > 0 && (
            <span className="rondo-chip border-rondo-accent/30 bg-rondo-accent/10 text-rondo-accent">
              {formatPrice(tournament.entry_fee)} / team
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
