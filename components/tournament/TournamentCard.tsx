"use client";

import Link from "next/link";
import { CalendarDays, MapPin, Trophy, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Tournament, TournamentStatus } from "@/lib/supabase/types";
import { formatGameDate, formatPrice } from "@/lib/utils/format";

/** Shared status → copy/tone map, reused by TournamentHero. */
export const TOURNAMENT_STATUS_META: Record<
  TournamentStatus,
  { label: string; tone: "open" | "live" | "done" | "off" }
> = {
  registration: { label: "Open for teams", tone: "open" },
  active: { label: "Live", tone: "live" },
  completed: { label: "Final", tone: "done" },
  cancelled: { label: "Cancelled", tone: "off" },
};

/** Shared tone → class map so the status ribbon looks identical everywhere. */
export function statusToneClasses(tone: "open" | "live" | "done" | "off"): string {
  switch (tone) {
    case "open":
      return "border-emerald-400/30 bg-emerald-400/15 text-emerald-300";
    case "live":
      return "border-red-400/30 bg-black/50 text-red-300";
    case "done":
      return "border-white/15 bg-black/50 text-white/60";
    case "off":
      return "border-red-400/25 bg-black/50 text-red-300/80";
  }
}

export const FORMAT_LABEL: Record<Tournament["format"], string> = {
  single_elimination: "Knockout",
  round_robin: "League",
};

/** Deterministic floodlight-scene variant so list cards don't look identical. */
export function sceneVariant(id: string): 0 | 1 | 2 {
  const n = (id.charCodeAt(0) ?? 0) + (id.charCodeAt(id.length - 1) ?? 0);
  return (n % 3) as 0 | 1 | 2;
}

function StatusRibbon({ status }: { status: TournamentStatus }) {
  const meta = TOURNAMENT_STATUS_META[status];
  return (
    <span
      className={cn(
        "absolute right-2.5 top-2.5 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide backdrop-blur-sm",
        statusToneClasses(meta.tone)
      )}
    >
      {meta.tone === "live" && <span className="rondo-live-dot" />}
      {meta.label}
    </span>
  );
}

interface TournamentCardProps {
  tournament: Tournament;
  href: string;
}

export function TournamentCard({ tournament, href }: TournamentCardProps) {
  const teamCount = tournament.tournament_teams?.filter((t) => t.status === "registered").length ?? 0;
  const capacity = Math.min(100, Math.round((teamCount / Math.max(tournament.max_teams, 1)) * 100));
  const full = teamCount >= tournament.max_teams;

  return (
    <Link
      href={href}
      className="block overflow-hidden rounded-2xl border border-white/10 bg-black/40 transition active:scale-[0.98] hover:border-rondo-accent/30"
    >
      <div
        className="relative h-28 overflow-hidden rondo-floodlight-scene"
        data-variant={sceneVariant(tournament.id)}
      >
        <Trophy
          size={76}
          strokeWidth={1.25}
          aria-hidden
          className="pointer-events-none absolute -bottom-4 -right-4 text-white/[0.07]"
        />

        <span className="absolute left-2.5 top-2.5 rounded-full border border-white/15 bg-black/45 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white/70 backdrop-blur-sm">
          {FORMAT_LABEL[tournament.format]}
        </span>

        <StatusRibbon status={tournament.status} />

        {tournament.entry_fee > 0 && (
          <span className="absolute bottom-2.5 right-2.5 rounded-full bg-rondo-accent px-2.5 py-1 font-heading text-[11px] font-black text-black">
            {formatPrice(tournament.entry_fee)}
          </span>
        )}

        <h3 className="absolute bottom-2.5 left-2.5 right-16 truncate font-heading text-lg font-black uppercase italic leading-none text-white">
          {tournament.name}
        </h3>
      </div>

      <div className="space-y-2.5 p-3.5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-white/50">
          <span className="flex min-w-0 items-center gap-1.5">
            <CalendarDays size={11} className="shrink-0 text-white/30" />
            <span className="truncate">{formatGameDate(tournament.starts_at)}</span>
          </span>
          {tournament.venue_name && (
            <span className="flex min-w-0 items-center gap-1.5">
              <MapPin size={11} className="shrink-0 text-white/30" />
              <span className="truncate">{tournament.venue_name}</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
            <div
              className={cn("h-full rounded-full transition-[width]", full ? "bg-white/25" : "bg-white/45")}
              style={{ width: `${capacity}%` }}
            />
          </div>
          <span className="flex shrink-0 items-center gap-1 text-[11px] font-semibold text-white/60">
            <Users size={11} className="text-white/30" />
            {teamCount}/{tournament.max_teams}
          </span>
        </div>
      </div>
    </Link>
  );
}

/** Skeleton matching the card's geometry: floodlight hero + meta rows. */
export function TournamentCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/40">
      <div className="h-28 rondo-shimmer" />
      <div className="space-y-3 p-3.5">
        <div className="flex gap-3">
          <div className="h-2.5 w-24 rounded rondo-shimmer" />
          <div className="h-2.5 w-20 rounded rondo-shimmer" />
        </div>
        <div className="h-1.5 w-full rounded-full rondo-shimmer" />
      </div>
    </div>
  );
}
