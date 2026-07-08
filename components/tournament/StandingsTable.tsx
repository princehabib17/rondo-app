"use client";

import { Fragment, useState } from "react";
import { Crown } from "@phosphor-icons/react";
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
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);
  const standings = computeStandings(
    teams.map((t) => t.id),
    matches
  );
  const teamName = (id: string) => teams.find((t) => t.id === id)?.name ?? "Team";

  if (standings.length === 0) {
    return (
      <div className="rondo-surface p-6 text-center rondo-meta text-[var(--ink-low)]">
        Standings appear once fixtures are set.
      </div>
    );
  }

  return (
    <div className="rondo-surface max-h-[420px] overflow-y-auto">
      <table className="w-full text-xs">
        <thead className="sticky top-0 z-10 bg-[var(--bg-surface)]">
          <tr className="border-b border-[var(--stroke)] rondo-label text-[var(--ink-low)]">
            <th className="px-3 py-3 text-left font-semibold">#</th>
            <th className="py-3 text-left font-semibold">Team</th>
            <th className="px-1 py-3 text-center font-semibold">P</th>
            <th className="px-1 py-3 text-center font-semibold">W</th>
            <th className="px-1 py-3 text-center font-semibold">D</th>
            <th className="px-1 py-3 text-center font-semibold">L</th>
            <th className="px-1 py-3 text-center font-semibold">GD</th>
            <th className="px-3 py-3 text-center font-semibold">Pts</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((row, index) => {
            const isLeader = index === 0 && row.played > 0;
            const isPodium = index < 3 && row.played > 0;
            const isYou = !!highlightTeamId && row.teamId === highlightTeamId;
            const showCutLine = qualifyCount > 0 && index === qualifyCount - 1 && index < standings.length - 1;
            const expanded = expandedTeamId === row.teamId;

            return (
              <Fragment key={row.teamId}>
                <tr
                  onClick={() => setExpandedTeamId((current) => (current === row.teamId ? null : row.teamId))}
                  className={cn(
                    "cursor-pointer border-b border-[var(--stroke)] transition-colors last:border-0 hover:bg-[var(--bg-inset)]",
                    isYou && "bg-[var(--gold-dim)]"
                  )}
                >
                  <td className={cn("px-3 py-3 font-heading text-xl font-bold tabular-nums", isPodium ? "text-[var(--gold)]" : "text-[var(--ink-low)]")}>
                    {isLeader ? <Crown size={16} weight="fill" aria-label="Leader" /> : index + 1}
                  </td>
                  <td className={cn("max-w-[104px] truncate py-3 rondo-body font-bold", isLeader ? "text-[var(--gold)]" : "text-[var(--ink-hi)]")}>
                    <span className="flex items-center gap-2">
                      <span className="truncate">{teamName(row.teamId)}</span>
                      {isYou && (
                        <span className="shrink-0 rounded-[var(--r-pill)] bg-[var(--gold)] px-2 py-0.5 rondo-label text-[var(--gold-ink)]">
                          You
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="px-1 py-3 text-center tabular-nums text-[var(--ink-mid)]">{row.played}</td>
                  <td className="px-1 py-3 text-center tabular-nums text-[var(--ink-mid)]">{row.won}</td>
                  <td className="px-1 py-3 text-center tabular-nums text-[var(--ink-mid)]">{row.drawn}</td>
                  <td className="px-1 py-3 text-center tabular-nums text-[var(--ink-mid)]">{row.lost}</td>
                  <td
                    className={cn(
                      "px-1 py-3 text-center tabular-nums",
                      row.goalDifference > 0 && "text-[var(--ok)]",
                      row.goalDifference < 0 && "text-[var(--live)]",
                      row.goalDifference === 0 && "text-[var(--ink-mid)]"
                    )}
                  >
                    {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                  </td>
                  <td className={cn("px-3 py-3 text-center font-heading text-xl font-bold tabular-nums", isLeader ? "text-[var(--gold)]" : "text-[var(--ink-hi)]")}>
                    {row.points}
                  </td>
                </tr>
                {expanded && (
                  <tr>
                    <td colSpan={8} className="border-b border-[var(--stroke)] bg-[var(--bg-inset)] px-4 py-3">
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div>
                          <p className="font-heading text-xl font-bold tabular-nums text-[var(--ink-hi)]">{row.goalsFor}</p>
                          <p className="rondo-label text-[var(--ink-low)]">GF</p>
                        </div>
                        <div>
                          <p className="font-heading text-xl font-bold tabular-nums text-[var(--ink-hi)]">{row.goalsAgainst}</p>
                          <p className="rondo-label text-[var(--ink-low)]">GA</p>
                        </div>
                        <div>
                          <p className="font-heading text-xl font-bold tabular-nums text-[var(--ink-hi)]">{row.goalDifference}</p>
                          <p className="rondo-label text-[var(--ink-low)]">GD</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
                {showCutLine && (
                  <tr aria-hidden>
                    <td colSpan={8} className="p-0">
                      <div className="flex items-center gap-2 border-b border-dashed border-[var(--stroke)] px-3 py-2">
                        <span className="rondo-label text-[var(--ink-low)]">
                          Qualifies
                        </span>
                        <span className="h-px flex-1 bg-[var(--stroke)]" />
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
