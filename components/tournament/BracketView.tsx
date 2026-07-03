"use client";

import { Lock, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TournamentMatch, TournamentTeam } from "@/lib/supabase/types";
import { roundLabel } from "@/lib/tournament/bracket";

interface BracketViewProps {
  matches: TournamentMatch[];
  teams: TournamentTeam[];
  /** Marks the viewer's own team ("You") in the bracket. */
  highlightTeamId?: string | null;
  /** Fires only for matches with both teams decided (score entry). */
  onMatchTap?: (match: TournamentMatch) => void;
}

function winnerOf(match: TournamentMatch): string | null {
  if (match.status !== "completed" || match.home_score == null || match.away_score == null) return null;
  if (match.home_score > match.away_score) return match.home_team_id;
  if (match.away_score > match.home_score) return match.away_team_id;
  return null;
}

function chunkPairs<T>(items: T[]): T[][] {
  const pairs: T[][] = [];
  for (let i = 0; i < items.length; i += 2) pairs.push(items.slice(i, i + 2));
  return pairs;
}

function TeamRow({
  teamName,
  score,
  isWinner,
  isTbd,
  isYou,
}: {
  teamName: string | null;
  score: number | null;
  isWinner: boolean;
  isTbd: boolean;
  isYou: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2 px-2.5 py-1.5",
        isWinner ? "font-bold text-rondo-accent" : isTbd ? "text-white/25" : "text-white/80"
      )}
    >
      <span className="flex min-w-0 items-center gap-1.5">
        <span className="truncate text-xs">{teamName ?? "TBD"}</span>
        {isYou && (
          <span className="shrink-0 rounded-full bg-rondo-blue/20 px-1.5 py-[1px] text-[8px] font-black uppercase tracking-wide text-rondo-blue">
            You
          </span>
        )}
      </span>
      {score !== null && <span className="shrink-0 text-xs tabular-nums">{score}</span>}
    </div>
  );
}

export function BracketView({ matches, teams, highlightTeamId = null, onMatchTap }: BracketViewProps) {
  const teamName = (id: string | null) => (id ? teams.find((t) => t.id === id)?.name ?? "TBD" : null);

  const rounds = [...new Set(matches.map((m) => m.round))].sort((a, b) => a - b);
  const totalRounds = rounds.length > 0 ? Math.max(...rounds) : 0;
  const finalMatch = matches.find((m) => m.round === totalRounds) ?? null;
  const championTeamId = finalMatch ? winnerOf(finalMatch) : null;
  const finalIsLive =
    !!finalMatch && finalMatch.status === "scheduled" && !!finalMatch.home_team_id && !!finalMatch.away_team_id;

  if (rounds.length === 0 || !finalMatch) {
    return (
      <div className="rondo-surface p-6 text-center text-sm text-white/50">
        Bracket opens once the draw is made.
      </div>
    );
  }

  return (
    <div className="rondo-snap-x -mx-4 overflow-x-auto px-4 pb-2">
      <div className="flex min-w-max gap-3">
        {rounds.map((round) => {
          const roundMatches = matches.filter((m) => m.round === round).sort((a, b) => a.position - b.position);
          const isFinalRound = round === totalRounds;
          const pairs = chunkPairs(roundMatches);

          return (
            <div key={round} className="rondo-snap-col flex w-40 shrink-0 flex-col">
              <p className="mb-2 text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {roundLabel(round, totalRounds)}
              </p>
              <div className="flex flex-1 flex-col justify-around gap-4">
                {pairs.map((pair, pairIndex) => {
                  const championPassedThrough = pair.some((m) => {
                    const w = winnerOf(m);
                    return !!w && !!championTeamId && w === championTeamId;
                  });

                  return (
                    <div key={pairIndex} className="relative flex flex-1 flex-col justify-around gap-3">
                      {pair.map((match) => {
                        const decidedWinner = winnerOf(match);
                        const homeWinner = decidedWinner !== null && decidedWinner === match.home_team_id;
                        const awayWinner = decidedWinner !== null && decidedWinner === match.away_team_id;
                        const isTbdMatch = !match.home_team_id || !match.away_team_id;
                        const tappable =
                          !!onMatchTap && match.status !== "bye" && !!match.home_team_id && !!match.away_team_id;
                        const isLiveFinal = isFinalRound && finalIsLive && match.id === finalMatch.id;

                        const cardClasses = cn(
                          "w-full divide-y divide-white/5 rounded-xl border bg-card text-left transition",
                          match.status === "bye"
                            ? "border-dashed border-white/10 opacity-50"
                            : isTbdMatch
                              ? "border-dashed border-white/10"
                              : "border-border",
                          isLiveFinal && "border-red-400/40"
                        );

                        const body = (
                          <>
                            <TeamRow
                              teamName={teamName(match.home_team_id)}
                              score={match.home_score}
                              isWinner={homeWinner}
                              isTbd={!match.home_team_id}
                              isYou={!!highlightTeamId && match.home_team_id === highlightTeamId}
                            />
                            {match.status === "bye" ? (
                              <div className="px-2.5 py-1.5 text-[10px] uppercase tracking-wide text-white/25">
                                Bye
                              </div>
                            ) : (
                              <TeamRow
                                teamName={teamName(match.away_team_id)}
                                score={match.away_score}
                                isWinner={awayWinner}
                                isTbd={!match.away_team_id}
                                isYou={!!highlightTeamId && match.away_team_id === highlightTeamId}
                              />
                            )}
                            {isLiveFinal && (
                              <div className="flex items-center gap-1.5 bg-red-400/10 px-2.5 py-1">
                                <span className="rondo-live-dot" />
                                <span className="text-[9px] font-bold uppercase tracking-wide text-red-300">
                                  Decider
                                </span>
                              </div>
                            )}
                          </>
                        );

                        return tappable ? (
                          <button
                            key={match.id}
                            type="button"
                            onClick={() => onMatchTap?.(match)}
                            className={cn(cardClasses, "active:scale-[0.98] hover:border-rondo-accent/40")}
                          >
                            {body}
                          </button>
                        ) : (
                          <div key={match.id} className={cardClasses}>
                            {body}
                          </div>
                        );
                      })}

                      {/* Connector into the next round (or the champion slot). */}
                      <span
                        aria-hidden
                        className={cn(
                          "absolute -right-3 bottom-1/4 top-1/4 w-3 rounded-r border-y border-r",
                          championPassedThrough ? "border-rondo-accent/70" : "border-white/15"
                        )}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Champion slot — crowned once the final is decided. */}
        <div className="rondo-snap-col flex w-32 shrink-0 flex-col">
          <p className="mb-2 text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Champion
          </p>
          <div className="flex flex-1 items-center justify-center">
            {championTeamId ? (
              <div className="flex flex-col items-center gap-1.5 rounded-xl border border-rondo-accent/40 bg-rondo-accent/10 px-3 py-4 text-center">
                <Trophy size={20} className="text-rondo-accent" />
                <span className="text-xs font-black uppercase text-rondo-accent">
                  {teamName(championTeamId)}
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1.5 rounded-xl border border-dashed border-white/10 px-3 py-4 text-center text-white/25">
                <Lock size={16} />
                <span className="text-[10px] uppercase tracking-wide">TBD</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
