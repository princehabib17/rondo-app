"use client";

import { Fragment } from "react";
import { cn } from "@/lib/utils";
import type { TournamentMatch, TournamentTeam } from "@/lib/supabase/types";
import { computeStandings } from "@/lib/tournament/bracket";

interface StandingsTableProps {
  matches: TournamentMatch[];
  teams: TournamentTeam[];
  /** Marks the viewer's own team ("You") in the table. */
  highlightTeamId?: string | null;
  /** Rows in this top slice qualify/advance; draws a cut line after them. Default 1. */
  qualifyCount?: number;
}

export function StandingsTable({
  matches,
  teams,
  highlightTeamId = null,
  qualifyCount = 1,
}: StandingsTableProps) {
  const standings = computeStandings(
    teams.map((t) => t.id),
    matches
  );
  const teamName = (id: string) => teams.find((t) => t.id === id)?.name ?? "Team";

  if (standings.length === 0) {
    return (
      <div className="rondo-surface p-6 text-center text-sm text-white/50">
        Standings appear once fixtures are set.
      </div>
    );
  }

  return (
    <div className="rondo-surface max-h-[420px] overflow-y-auto">
      <table className="w-full text-xs">
        <thead className="sticky top-0 z-10 bg-rondo-elevated">
          <tr className="border-b border-white/10 text-[10px] uppercase tracking-wider text-muted-foreground">
            <th className="px-2 py-2.5 text-left font-semibold">#</th>
            <th className="py-2.5 text-left font-semibold">Team</th>
            <th className="px-1 py-2.5 text-center font-semibold">P</th>
            <th className="px-1 py-2.5 text-center font-semibold">W</th>
            <th className="px-1 py-2.5 text-center font-semibold">D</th>
            <th className="px-1 py-2.5 text-center font-semibold">L</th>
            <th className="px-1 py-2.5 text-center font-semibold">GD</th>
            <th className="px-2 py-2.5 text-center font-semibold">Pts</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((row, index) => {
            const isLeader = index === 0 && row.played > 0;
            const isYou = !!highlightTeamId && row.teamId === highlightTeamId;
            const showCutLine = qualifyCount > 0 && index === qualifyCount - 1 && index < standings.length - 1;

            return (
              <Fragment key={row.teamId}>
                <tr
                  className={cn(
                    "border-b border-white/5 last:border-0",
                    index % 2 === 1 && "bg-white/[0.02]",
                    isYou && "bg-rondo-blue/[0.07]"
                  )}
                >
                  <td className="px-2 py-2 tabular-nums text-white/40">{index + 1}</td>
                  <td className={cn("max-w-[96px] truncate py-2 font-semibold", isLeader ? "text-rondo-accent" : "text-white/85")}>
                    <span className="flex items-center gap-1.5">
                      <span className="truncate">{teamName(row.teamId)}</span>
                      {isYou && (
                        <span className="shrink-0 rounded-full bg-rondo-blue/20 px-1.5 py-[1px] text-[8px] font-black uppercase tracking-wide text-rondo-blue">
                          You
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="px-1 py-2 text-center tabular-nums text-white/60">{row.played}</td>
                  <td className="px-1 py-2 text-center tabular-nums text-white/60">{row.won}</td>
                  <td className="px-1 py-2 text-center tabular-nums text-white/60">{row.drawn}</td>
                  <td className="px-1 py-2 text-center tabular-nums text-white/60">{row.lost}</td>
                  <td className="px-1 py-2 text-center tabular-nums text-white/60">
                    {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                  </td>
                  <td className={cn("px-2 py-2 text-center tabular-nums font-black", isLeader ? "text-rondo-accent" : "text-white")}>
                    {row.points}
                  </td>
                </tr>
                {showCutLine && (
                  <tr aria-hidden>
                    <td colSpan={8} className="p-0">
                      <div className="flex items-center gap-2 border-b border-dashed border-white/15 px-2 py-1">
                        <span className="text-[8px] font-bold uppercase tracking-widest text-white/30">
                          Qualifies
                        </span>
                        <span className="h-px flex-1 bg-white/10" />
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
