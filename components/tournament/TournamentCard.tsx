"use client";

import Link from "next/link";
import { CalendarBlank, Crown, MapPin, SoccerBall, Trophy, Users } from "@phosphor-icons/react";
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
      return "border-[var(--gold)] bg-[var(--gold-dim)] text-[var(--gold)]";
    case "live":
      return "border-[var(--live)] bg-[color-mix(in_oklch,var(--live)_16%,transparent)] text-[var(--live)]";
    case "done":
      return "border-[var(--stroke)] bg-[var(--bg-inset)] text-[var(--ink-low)]";
    case "off":
      return "border-[var(--live)] bg-[color-mix(in_oklch,var(--live)_12%,transparent)] text-[var(--live)]";
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
        "inline-flex h-8 items-center gap-1 rounded-[var(--r-pill)] border px-3 rondo-label",
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
  variant?: "live" | "open" | "upcoming" | "completed";
}

function variantFor(tournament: Tournament): NonNullable<TournamentCardProps["variant"]> {
  if (tournament.status === "active") return "live";
  if (tournament.status === "completed") return "completed";
  if (tournament.status === "registration") return "open";
  return "upcoming";
}

export function TournamentCard({ tournament, href, variant = variantFor(tournament) }: TournamentCardProps) {
  const teamCount = tournament.tournament_teams?.filter((t) => t.status === "registered").length ?? 0;
  const capacity = Math.min(100, Math.round((teamCount / Math.max(tournament.max_teams, 1)) * 100));
  const full = teamCount >= tournament.max_teams;
  const spotsLeft = Math.max(0, tournament.max_teams - teamCount);
  const isLive = variant === "live";
  const isCompleted = variant === "completed";

  return (
    <Link
      href={href}
      className={cn(
        "block overflow-hidden rounded-[var(--r-md)] border border-[var(--stroke)] bg-[var(--bg-surface)] transition-[border-color,transform,opacity] duration-200 active:scale-[0.98]",
        "hover:border-[color-mix(in_oklch,var(--gold)_45%,var(--stroke))]",
        isCompleted && "opacity-70"
      )}
    >
      <div
        className={cn("relative overflow-hidden rondo-floodlight-scene", isLive ? "h-36" : "h-28")}
        data-variant={sceneVariant(tournament.id)}
      >
        {isLive ? (
          <SoccerBall
            size={96}
            weight="duotone"
            aria-hidden
            className="pointer-events-none absolute -bottom-6 -right-5 text-[color-mix(in_oklch,var(--gold)_12%,transparent)]"
          />
        ) : (
          <Trophy
            size={76}
            weight="duotone"
            aria-hidden
            className="pointer-events-none absolute -bottom-4 -right-4 text-[color-mix(in_oklch,var(--ink-hi)_7%,transparent)]"
          />
        )}

        <div className="absolute left-3 top-3 flex items-center gap-2">
          <span className="inline-flex h-8 items-center rounded-[var(--r-pill)] border border-[var(--stroke)] bg-[color-mix(in_oklch,var(--bg-page)_65%,transparent)] px-3 rondo-label text-[var(--ink-mid)] backdrop-blur-sm">
            {FORMAT_LABEL[tournament.format]}
          </span>
          {isCompleted && <Crown size={16} weight="fill" className="text-[var(--gold)]" aria-hidden />}
        </div>

        <div className="absolute right-3 top-3">
          <StatusRibbon status={tournament.status} />
        </div>

        {isLive && (
          <div className="absolute inset-x-3 bottom-12">
            <p className="rondo-label text-[var(--live)]">Now playing</p>
            <p className="mt-1 font-heading text-[2.5rem] font-bold leading-none tabular-nums text-[var(--ink-hi)]">
              Live
            </p>
          </div>
        )}

        {tournament.entry_fee > 0 && (
          <span className="absolute bottom-3 right-3 rounded-[var(--r-pill)] bg-[var(--gold)] px-3 py-1 font-heading text-sm font-bold text-[var(--gold-ink)]">
            {formatPrice(tournament.entry_fee)}
          </span>
        )}

        <h3
          className={cn(
            "absolute left-3 truncate font-heading font-bold uppercase leading-none text-[var(--ink-hi)]",
            isLive ? "bottom-3 right-24 text-2xl" : "bottom-3 right-20 text-xl"
          )}
        >
          {tournament.name}
        </h3>
      </div>

      <div className="space-y-3 p-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rondo-meta text-[var(--ink-low)]">
          <span className="flex min-w-0 items-center gap-1">
            <CalendarBlank size={16} className="shrink-0 text-[var(--gold)]" aria-hidden />
            <span className="truncate">{formatGameDate(tournament.starts_at)}</span>
          </span>
          {tournament.venue_name && (
            <span className="flex min-w-0 items-center gap-1">
              <MapPin size={16} className="shrink-0 text-[var(--gold)]" aria-hidden />
              <span className="truncate">{tournament.venue_name}</span>
            </span>
          )}
        </div>

        <div className="grid grid-cols-[1fr_auto] items-center gap-3">
          <div className="h-1.5 overflow-hidden rounded-[var(--r-pill)] bg-[var(--bg-inset)]">
            <div
              className={cn("h-full rounded-[var(--r-pill)] transition-[width]", full ? "bg-[var(--ink-low)]" : "bg-[var(--gold)]")}
              style={{ width: `${capacity}%` }}
            />
          </div>
          <span className="flex shrink-0 items-center gap-1 rondo-meta font-bold text-[var(--ink-mid)]">
            <Users size={16} className="text-[var(--ink-low)]" aria-hidden />
            {variant === "open" ? `${spotsLeft} spots left` : `${teamCount}/${tournament.max_teams}`}
          </span>
        </div>

        {isCompleted && (
          <p className="rondo-meta text-[var(--ink-low)]">
            Champions show here once the final score is locked.
          </p>
        )}
      </div>
    </Link>
  );
}

/** Skeleton matching the card's geometry: floodlight hero + meta rows. */
export function TournamentCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[var(--r-md)] border border-[var(--stroke)] bg-[var(--bg-surface)]">
      <div className="h-28 rondo-shimmer" />
      <div className="space-y-3 p-4">
        <div className="flex gap-3">
          <div className="h-3 w-24 rounded-[var(--r-pill)] rondo-shimmer" />
          <div className="h-3 w-20 rounded-[var(--r-pill)] rondo-shimmer" />
        </div>
        <div className="h-1.5 w-full rounded-[var(--r-pill)] rondo-shimmer" />
      </div>
    </div>
  );
}
