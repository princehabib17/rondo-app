"use client";

import Link from "next/link";
import { CalendarBlank, Crown, MapPin, SoccerBall, Trophy, Users } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import type { Tournament, TournamentStatus } from "@/lib/supabase/types";
import type { LiveSummary } from "@/lib/tournament/bracket";
import { format } from "date-fns";
import { formatPrice } from "@/lib/utils/format";

/** Shared status → copy/tone map, reused by TournamentHero. */
export const TOURNAMENT_STATUS_META: Record<
  TournamentStatus,
  { label: string; tone: "open" | "live" | "done" | "off" }
> = {
  registration: { label: "Open", tone: "open" },
  active: { label: "Live", tone: "live" },
  completed: { label: "Completed", tone: "done" },
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
        "inline-flex h-7 items-center gap-2 rounded-[var(--r-pill)] border px-3 rondo-label",
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
  /** Winner line for a completed tournament, when known. */
  champion?: { name: string; detail?: string | null } | null;
  /** Real round/progress for a live tournament, when known. */
  liveSummary?: LiveSummary | null;
}

function variantFor(tournament: Tournament): NonNullable<TournamentCardProps["variant"]> {
  if (tournament.status === "active") return "live";
  if (tournament.status === "completed") return "completed";
  if (tournament.status === "registration") return "open";
  return "upcoming";
}

function kickoffShort(iso: string): string {
  return format(new Date(iso), "EEE, MMM d · h:mm a");
}

export function TournamentCard({
  tournament,
  href,
  variant = variantFor(tournament),
  champion,
  liveSummary,
}: TournamentCardProps) {
  const teamCount = tournament.tournament_teams?.filter((t) => t.status === "registered").length ?? 0;
  const capacity = Math.min(100, Math.round((teamCount / Math.max(tournament.max_teams, 1)) * 100));
  const full = teamCount >= tournament.max_teams;
  const spotsLeft = Math.max(0, tournament.max_teams - teamCount);
  const isLive = variant === "live";
  const isOpen = variant === "open";
  const isCompleted = variant === "completed";

  return (
    <Link
      href={href}
      className={cn(
        "group block overflow-hidden rounded-[var(--r-md)] border bg-[var(--bg-surface)] transition-[border-color,transform] duration-200 active:scale-[0.98]",
        isLive
          ? "border-[color-mix(in_oklch,var(--live)_40%,var(--stroke))]"
          : "border-[var(--stroke)] hover:border-[color-mix(in_oklch,var(--gold)_45%,var(--stroke))]"
      )}
    >
      <div
        className={cn(
          "relative flex flex-col justify-between overflow-hidden p-4 rondo-floodlight-scene",
          isLive ? "min-h-40" : "min-h-32",
          isCompleted && "rondo-floodlight-scene--gold"
        )}
        data-variant={sceneVariant(tournament.id)}
      >
        {isLive ? (
          <SoccerBall
            size={112}
            weight="duotone"
            aria-hidden
            className="pointer-events-none absolute -bottom-8 -right-6 text-[color-mix(in_oklch,var(--ink-hi)_7%,transparent)]"
          />
        ) : (
          <Trophy
            size={96}
            weight="duotone"
            aria-hidden
            className={cn(
              "pointer-events-none absolute -bottom-6 -right-5",
              isCompleted
                ? "text-[color-mix(in_oklch,var(--gold)_22%,transparent)]"
                : "text-[color-mix(in_oklch,var(--ink-hi)_7%,transparent)]"
            )}
          />
        )}

        <div className="relative flex items-start justify-between gap-2">
          <span className="inline-flex h-7 items-center rounded-[var(--r-pill)] border border-[var(--stroke)] bg-[color-mix(in_oklch,var(--bg-page)_65%,transparent)] px-3 rondo-label text-[var(--ink-mid)] backdrop-blur-sm">
            {FORMAT_LABEL[tournament.format]}
            <span className="mx-1.5 text-[var(--ink-low)]" aria-hidden>·</span>
            {tournament.team_size}-a-side
          </span>
          <StatusRibbon status={tournament.status} />
        </div>

        <div className="relative mt-6 pr-16">
          {isLive && liveSummary && (
            <p className="mb-1 rondo-label text-[var(--live)]">{liveSummary.roundLabel} · Now playing</p>
          )}
          {isCompleted && champion && (
            <p className="mb-1 flex items-center gap-1 rondo-label text-[var(--gold)]">
              <Crown size={12} weight="fill" aria-hidden />
              {champion.name}
            </p>
          )}
          <h3
            className={cn(
              "line-clamp-2 font-heading font-bold uppercase leading-[0.95] text-[var(--ink-hi)]",
              isLive ? "text-[2rem]" : "text-[1.625rem]"
            )}
          >
            {tournament.name}
          </h3>
        </div>
      </div>

      <div className="space-y-3 px-4 py-3">
        <div className="flex items-center justify-between gap-3 rondo-meta text-[var(--ink-low)]">
          <span className="flex min-w-0 items-center gap-1.5">
            <CalendarBlank size={15} className="shrink-0" aria-hidden />
            <span className="truncate">{kickoffShort(tournament.starts_at)}</span>
          </span>
          {tournament.venue_name && (
            <span className="flex min-w-0 shrink items-center gap-1.5">
              <MapPin size={15} className="shrink-0" aria-hidden />
              <span className="truncate">{tournament.venue_name}</span>
            </span>
          )}
        </div>

        {isOpen ? (
          <div className="space-y-2">
            <div className="flex items-baseline justify-between gap-3">
              <span className="rondo-meta font-bold text-[var(--ink-hi)]">
                {full ? "Bracket full" : `${spotsLeft} of ${tournament.max_teams} spots left`}
              </span>
              <span className="font-heading text-base font-bold tabular-nums text-[var(--gold)]">
                {tournament.entry_fee > 0 ? `${formatPrice(tournament.entry_fee)} / team` : "Free entry"}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-[var(--r-pill)] bg-[var(--bg-inset)]">
              <div
                className={cn("h-full rounded-[var(--r-pill)]", full ? "bg-[var(--ink-low)]" : "bg-[var(--gold)]")}
                style={{ width: `${capacity}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3 rondo-meta">
            <span className="flex items-center gap-1.5 text-[var(--ink-mid)]">
              <Users size={15} className="text-[var(--ink-low)]" aria-hidden />
              {teamCount} teams
            </span>
            {isCompleted ? (
              <span className="truncate text-[var(--ink-low)]">
                {champion?.detail ?? "Final result locked"}
              </span>
            ) : isLive ? (
              <span className="font-bold text-[var(--ink-hi)]">Follow live</span>
            ) : null}
          </div>
        )}
      </div>
    </Link>
  );
}

/** Skeleton matching the card's geometry: floodlight hero + meta rows. */
export function TournamentCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[var(--r-md)] border border-[var(--stroke)] bg-[var(--bg-surface)]">
      <div className="h-32 rondo-shimmer" />
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
