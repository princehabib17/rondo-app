"use client";

import Link from "next/link";
import { CalendarDays, MapPin, Trophy, Users } from "lucide-react";
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

  return (
    <Link
      href={href}
      className="block rondo-surface p-4 space-y-2.5 hover:border-rondo-accent/40 border border-transparent transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Trophy size={16} className="text-rondo-accent shrink-0" />
          <h3 className="text-white font-heading font-bold text-base uppercase truncate">
            {tournament.name}
          </h3>
        </div>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide shrink-0",
            status.className
          )}
        >
          {status.label}
        </span>
      </div>

      <div className="space-y-1 text-xs text-white/60">
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
          {teamCount}/{tournament.max_teams} teams · {formatLabels[tournament.format]} ·{" "}
          {tournament.team_size}-a-side
          {tournament.entry_fee > 0 && ` · ${formatPrice(tournament.entry_fee)} per team`}
        </p>
      </div>
    </Link>
  );
}
