"use client";

import { cn } from "@/lib/utils";
import type { TournamentMatch, TournamentTeam } from "@/lib/supabase/types";
import { roundLabel } from "@/lib/tournament/bracket";

interface BracketViewProps {
  matches: TournamentMatch[];
  teams: TournamentTeam[];
}

function TeamRow({
  teamName,
  score,
  isWinner,
}: {
  teamName: string | null;
  score: number | null;
  isWinner: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2 px-3 py-1.5",
        isWinner ? "text-rondo-accent font-bold" : teamName ? "text-white/80" : "text-white/25"
      )}
    >
      <span className="text-xs truncate">{teamName ?? "TBD"}</span>
      {score !== null && <span className="text-xs tabular-nums">{score}</span>}
    </div>
  );
}

export function BracketView({ matches, teams }: BracketViewProps) {
  const teamName = (id: string | null) =>
    id ? teams.find((t) => t.id === id)?.name ?? "TBD" : null;

  const rounds = [...new Set(matches.map((m) => m.round))].sort((a, b) => a - b);
  const totalRounds = rounds.length > 0 ? Math.max(...rounds) : 0;

  return (
    <div className="overflow-x-auto -mx-4 px-4">
      <div className="flex gap-3 min-w-max">
        {rounds.map((round) => {
          const roundMatches = matches
            .filter((m) => m.round === round)
            .sort((a, b) => a.position - b.position);
          return (
            <div key={round} className="flex flex-col w-44 shrink-0">
              <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider mb-2 text-center">
                {roundLabel(round, totalRounds)}
              </p>
              <div className="flex flex-col justify-around gap-3 flex-1">
                {roundMatches.map((match) => {
                  const decided = match.status === "completed" && match.home_score !== null && match.away_score !== null;
                  const homeWon = decided && match.home_score! > match.away_score!;
                  const awayWon = decided && match.away_score! > match.home_score!;
                  return (
                    <div
                      key={match.id}
                      className={cn(
                        "rounded-xl border divide-y divide-white/5 bg-card",
                        match.status === "bye" ? "border-white/5 opacity-50" : "border-border"
                      )}
                    >
                      <TeamRow
                        teamName={teamName(match.home_team_id)}
                        score={match.home_score}
                        isWinner={homeWon}
                      />
                      {match.status === "bye" ? (
                        <div className="px-3 py-1.5 text-white/25 text-[10px] uppercase tracking-wide">
                          Bye
                        </div>
                      ) : (
                        <TeamRow
                          teamName={teamName(match.away_team_id)}
                          score={match.away_score}
                          isWinner={awayWon}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
