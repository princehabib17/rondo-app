"use client";

import Link from "next/link";
import { CalendarDays, ChevronRight, MapPin, Trophy, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Tournament } from "@/lib/supabase/types";
import { formatGameDate, formatPrice } from "@/lib/utils/format";

const statusStyles: Record<Tournament["status"], { label: string; className: string }> = {
  registration: { label: "Open for teams", className: "bg-emerald-400/15 text-emerald-300" },
  active: { label: "In progress", className: "bg-rondo-accent/15 text-rondo-accent" },
  completed: { label: "Completed", className: "bg-white/10 text-white/50" },
  cancelled: { label: "Cancelled", className: "bg-red-400/15 text-red-300" },
};

const formatLabels: Record<Tournament["format"], string> = {
  single_elimination: "Knockout",
  round_robin: "League",
};

interface TournamentCardProps {
  tournament: Tournament;
  href: string;
}

export function TournamentCard({ tournament, href }: TournamentCardProps) {
  const status = statusStyles[tournament.status];
  const teamCount = tournament.tournament_teams?.filter((t) => t.status === "registered").length ?? 0;
  const capacity = Math.min(100, Math.round((teamCount / Math.max(tournament.max_teams, 1)) * 100));

  return (
    <Link
      href={href}
      className="block overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition hover:border-rondo-accent/40"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rondo-accent/15 text-rondo-accent">
            <Trophy size={16} />
          </div>
          <h3 className="truncate font-heading text-base font-bold uppercase text-white">
            {tournament.name}
          </h3>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
            status.className
          )}
        >
          {status.label}
        </span>
      </div>

      <div className="mt-3 space-y-1 text-xs text-white/60">
        <p className="flex items-center gap-1.5">
          <CalendarDays size={12} className="text-white/30" />
          {formatGameDate(tournament.starts_at)}
        </p>
        {tournament.venue_name && (
          <p className="flex items-center gap-1.5">
            <MapPin size={12} className="text-white/30" />
            <span className="truncate">{tournament.venue_name}</span>
          </p>
        )}
        <p className="flex items-center gap-1.5">
          <Users size={12} className="text-white/30" />
          {teamCount}/{tournament.max_teams} teams - {formatLabels[tournament.format]} -{" "}
          {tournament.team_size}-a-side
          {tournament.entry_fee > 0 && ` - ${formatPrice(tournament.entry_fee)} per team`}
        </p>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-rondo-accent" style={{ width: `${capacity}%` }} />
        </div>
        <ChevronRight size={16} className="text-white/35" />
      </div>
    </Link>
  );
}
