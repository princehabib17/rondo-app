"use client";

import { cn } from "@/lib/utils";
import type { TournamentMatch, TournamentTeam } from "@/lib/supabase/types";
import { computeStandings } from "@/lib/tournament/bracket";

interface StandingsTableProps {
  matches: TournamentMatch[];
  teams: TournamentTeam[];
}

export function StandingsTable({ matches, teams }: StandingsTableProps) {
  const standings = computeStandings(
    teams.map((t) => t.id),
    matches
  );
  const teamName = (id: string) => teams.find((t) => t.id === id)?.name ?? "Team";

  return (
    <div className="rondo-surface overflow-hidden">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-muted-foreground text-[10px] uppercase tracking-wider border-b border-white/5">
            <th className="text-left font-semibold px-3 py-2">#</th>
            <th className="text-left font-semibold py-2">Team</th>
            <th className="text-center font-semibold px-1.5 py-2">P</th>
            <th className="text-center font-semibold px-1.5 py-2">W</th>
            <th className="text-center font-semibold px-1.5 py-2">D</th>
            <th className="text-center font-semibold px-1.5 py-2">L</th>
            <th className="text-center font-semibold px-1.5 py-2">GD</th>
            <th className="text-center font-semibold px-3 py-2">Pts</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((row, index) => (
            <tr
              key={row.teamId}
              className={cn(
                "border-b border-white/5 last:border-0",
                index === 0 && "text-rondo-accent"
              )}
            >
              <td className="px-3 py-2 text-white/40 tabular-nums">{index + 1}</td>
              <td className="py-2 text-white/85 font-semibold truncate max-w-[120px]">
                {teamName(row.teamId)}
              </td>
              <td className="text-center px-1.5 py-2 tabular-nums text-white/60">{row.played}</td>
              <td className="text-center px-1.5 py-2 tabular-nums text-white/60">{row.won}</td>
              <td className="text-center px-1.5 py-2 tabular-nums text-white/60">{row.drawn}</td>
              <td className="text-center px-1.5 py-2 tabular-nums text-white/60">{row.lost}</td>
              <td className="text-center px-1.5 py-2 tabular-nums text-white/60">
                {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
              </td>
              <td className="text-center px-3 py-2 tabular-nums font-bold text-white">
                {row.points}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
