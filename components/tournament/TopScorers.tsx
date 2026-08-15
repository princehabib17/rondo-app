"use client";

import Link from "next/link";
import { SoccerBall } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import type { TournamentGoal, TournamentTeam } from "@/lib/supabase/types";

interface ScorerRank {
  key: string;
  name: string;
  profileId: string | null;
  avatarUrl: string | null;
  teamName: string | null;
  goals: number;
}

/**
 * Golden-boot table computed from the tournament's goal log. Tagged players
 * link to their profile; written-in names rank all the same.
 */
export function rankScorers(goals: TournamentGoal[], teams: TournamentTeam[]): ScorerRank[] {
  const teamName = (teamId: string) => teams.find((t) => t.id === teamId)?.name ?? null;
  const rows = new Map<string, ScorerRank>();
  for (const goal of goals) {
    const key = goal.scorer_id ?? `name:${(goal.scorer_name ?? "").trim().toLowerCase()}:${goal.team_id}`;
    const existing = rows.get(key);
    if (existing) {
      existing.goals += goal.goals;
    } else {
      rows.set(key, {
        key,
        name: goal.scorer?.full_name ?? goal.scorer_name ?? "Unknown",
        profileId: goal.scorer_id,
        avatarUrl: goal.scorer?.avatar_url ?? null,
        teamName: teamName(goal.team_id),
        goals: goal.goals,
      });
    }
  }
  return [...rows.values()].sort((a, b) => b.goals - a.goals || a.name.localeCompare(b.name));
}

export function TopScorers({
  goals,
  teams,
  limit = 5,
  className,
}: {
  goals: TournamentGoal[];
  teams: TournamentTeam[];
  limit?: number;
  className?: string;
}) {
  const ranked = rankScorers(goals, teams).slice(0, limit);
  if (ranked.length === 0) return null;

  return (
    <div className={cn("rondo-surface overflow-hidden", className)}>
      {ranked.map((scorer, index) => {
        const leader = index === 0;
        const row = (
          <div className="flex min-h-14 items-center gap-3 border-b border-[var(--stroke)] px-4 py-3 last:border-b-0">
            <span
              className={cn(
                "w-5 shrink-0 text-center font-heading text-lg font-bold tabular-nums",
                leader ? "text-[var(--gold)]" : "text-[var(--ink-low)]"
              )}
            >
              {index + 1}
            </span>
            {scorer.avatarUrl ? (
              <img
                src={scorer.avatarUrl}
                alt=""
                className="h-8 w-8 shrink-0 rounded-[var(--r-pill)] object-cover"
              />
            ) : (
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[var(--r-pill)] bg-[var(--bg-inset)] text-[var(--ink-low)]">
                <SoccerBall size={16} weight="duotone" aria-hidden />
              </span>
            )}
            <span className="min-w-0 flex-1">
              <span className={cn("block truncate rondo-body font-bold", leader ? "text-[var(--ink-hi)]" : "text-[var(--ink-mid)]")}>
                {scorer.name}
              </span>
              {scorer.teamName && (
                <span className="block truncate rondo-meta text-[var(--ink-low)]">{scorer.teamName}</span>
              )}
            </span>
            <span
              className={cn(
                "shrink-0 font-heading text-2xl font-bold tabular-nums",
                leader ? "text-[var(--gold)]" : "text-[var(--ink-hi)]"
              )}
            >
              {scorer.goals}
            </span>
          </div>
        );
        return scorer.profileId ? (
          <Link key={scorer.key} href={`/profile/${scorer.profileId}`} className="block">
            {row}
          </Link>
        ) : (
          <div key={scorer.key}>{row}</div>
        );
      })}
    </div>
  );
}
