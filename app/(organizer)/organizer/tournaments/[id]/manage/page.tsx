"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Plus, Play, Shield, Trophy } from "@phosphor-icons/react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { subscribeToTournament } from "@/lib/realtime";
import type { Tournament, TournamentMatch, TournamentTeam } from "@/lib/supabase/types";
import { BracketView } from "@/components/tournament/BracketView";
import { StandingsTable } from "@/components/tournament/StandingsTable";
import { computeStandings } from "@/lib/tournament/bracket";
import { EmptyState, MatchCell, StatTile } from "@/components/rondo/primitives";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="rondo-label text-[var(--ink-low)]">{children}</h2>
  );
}

/**
 * A team name on the left, +/- stepper on the right. Stacked one team per
 * row so the 44px targets never fight for width at 320px, unlike a
 * side-by-side layout would.
 */
function Stepper({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (next: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="min-w-0 flex-1 truncate rondo-body font-bold text-[var(--ink-hi)]">{label}</span>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          aria-label={`Decrease ${label} score`}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--r-pill)] border border-[var(--stroke)] bg-[var(--bg-inset)] text-[var(--ink-hi)] active:scale-95"
        >
          <span aria-hidden="true" className="text-lg font-black leading-none">
            −
          </span>
        </button>
        <span className="w-9 text-center font-heading text-4xl font-bold text-[var(--ink-hi)] tabular-nums">
          {value}
        </span>
        <button
          type="button"
          onClick={() => onChange(Math.min(99, value + 1))}
          aria-label={`Increase ${label} score`}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--r-pill)] border border-[var(--gold)] bg-[var(--gold-dim)] text-[var(--gold)] active:scale-95"
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}

function ScoreSheet({
  match,
  teams,
  tournamentId,
  isKnockout,
  onClose,
  onRecorded,
}: {
  match: TournamentMatch;
  teams: TournamentTeam[];
  tournamentId: string;
  isKnockout: boolean;
  onClose: () => void;
  onRecorded: () => void;
}) {
  const [homeScore, setHomeScore] = useState(match.home_score ?? 0);
  const [awayScore, setAwayScore] = useState(match.away_score ?? 0);
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const home = teams.find((t) => t.id === match.home_team_id)?.name ?? "TBD";
  const away = teams.find((t) => t.id === match.away_team_id)?.name ?? "TBD";
  const isDraw = homeScore === awayScore;
  const knockoutDrawBlocked = isKnockout && isDraw;

  async function save() {
    if (saving || knockoutDrawBlocked) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/result`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId: match.id, homeScore, awayScore }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Could not record result");
        setConfirming(false);
        return;
      }
      toast.success(json.tournamentCompleted ? "Tournament completed!" : "Result recorded");
      onRecorded();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  function handlePrimaryTap() {
    if (knockoutDrawBlocked) return;
    if (isKnockout && !confirming) {
      setConfirming(true);
      return;
    }
    save();
  }

  return (
    <div className="fixed inset-0 z-[70]">
      <button
        type="button"
        aria-label="Close score entry"
        onClick={onClose}
        className="absolute inset-0 bg-[oklch(0%_0_0_/_0.6)] backdrop-blur-sm animate-in fade-in duration-200"
      />
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg overflow-y-auto rounded-t-[var(--r-lg)] border-t border-[var(--stroke)] bg-[var(--bg-inset)] pb-[calc(env(safe-area-inset-bottom)+1rem)]"
        style={{ animation: "rondoSheetUp 240ms var(--ease-out)" }}
      >
        <div className="mx-auto mt-2 h-1 w-8 rounded-[var(--r-pill)] bg-[var(--gold)]" />
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--stroke)]">
          <div>
            <p className="rondo-label text-[var(--gold)]">
              {isKnockout ? "Knockout result" : "Match result"}
            </p>
            <h2 className="rondo-title text-[var(--ink-hi)] truncate">
              {home} vs {away}
            </h2>
          </div>
        </div>

        <div className="px-5 py-6 space-y-5">
          <div className="space-y-3 divide-y divide-[var(--stroke)]">
            <Stepper label={home} value={homeScore} onChange={setHomeScore} />
            <div className="pt-3">
              <Stepper label={away} value={awayScore} onChange={setAwayScore} />
            </div>
          </div>

          {knockoutDrawBlocked && (
            <p className="rondo-meta text-center text-[var(--live)] bg-[color-mix(in_oklch,var(--live)_10%,transparent)] border border-[var(--live)] rounded-[var(--r-sm)] px-3 py-2">
              Knockout matches cannot end in a draw. Adjust one score to save.
            </p>
          )}

          {confirming && !knockoutDrawBlocked && (
            <p className="rondo-meta text-center text-[var(--gold)] bg-[var(--gold-dim)] border border-[var(--gold)] rounded-[var(--r-sm)] px-3 py-2">
              {home} {homeScore} - {awayScore} {away}. Knockout results cannot be changed once saved. Confirm to
              lock it in.
            </p>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={confirming ? () => setConfirming(false) : onClose}
              className="rondo-btn rondo-btn-secondary flex-1"
            >
              {confirming ? "Back" : "Cancel"}
            </button>
            <button
              type="button"
              onClick={handlePrimaryTap}
              disabled={saving || knockoutDrawBlocked}
              className="rondo-btn rondo-btn-primary flex-1 disabled:opacity-40"
            >
              {saving ? "Saving..." : confirming ? "Confirm final score" : "Save score"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ManageTournamentPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [teams, setTeams] = useState<TournamentTeam[]>([]);
  const [matches, setMatches] = useState<TournamentMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [confirmStart, setConfirmStart] = useState(false);
  const [activeMatch, setActiveMatch] = useState<TournamentMatch | null>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      router.push("/login");
      return;
    }
    const [{ data: t }, { data: teamRows }, { data: matchRows }] = await Promise.all([
      supabase.from("tournaments").select("*").eq("id", id).single(),
      supabase
        .from("tournament_teams")
        .select("*")
        .eq("tournament_id", id)
        .eq("status", "registered")
        .order("created_at", { ascending: true }),
      supabase
        .from("tournament_matches")
        .select("*")
        .eq("tournament_id", id)
        .order("round", { ascending: true })
        .order("position", { ascending: true }),
    ]);

    if (!t || (t as Tournament).organizer_id !== userData.user.id) {
      router.push("/organizer/tournaments");
      return;
    }
    setTournament(t as Tournament);
    setTeams((teamRows as TournamentTeam[]) ?? []);
    setMatches((matchRows as TournamentMatch[]) ?? []);
    setLoading(false);
  }, [id, router]);

  useEffect(() => {
    load();
  }, [load]);

  // Keep the bracket and result list current while captains watch from
  // their own screens.
  useEffect(() => {
    return subscribeToTournament(id, () => {
      load();
    });
  }, [id, load]);

  async function startTournament() {
    if (starting) return;
    setStarting(true);
    try {
      const res = await fetch(`/api/tournaments/${id}/start`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Could not start tournament");
        return;
      }
      toast.success("Fixtures generated. Game on!");
      setConfirmStart(false);
      await load();
    } finally {
      setStarting(false);
    }
  }

  // Fires for any match a player could plausibly tap. Byes, undecided legs,
  // and already-completed knockout matches are locked out here too, in case
  // the caller (bracket or our own fixture list) doesn't already guard it.
  function handleMatchTap(match: TournamentMatch) {
    if (match.status === "bye" || match.status === "completed") return;
    if (!match.home_team_id || !match.away_team_id) return;
    setActiveMatch(match);
  }

  const isKnockout = tournament?.format === "single_elimination";
  const playable = useMemo(() => matches.filter((m) => m.status !== "bye"), [matches]);
  const roundRobinDays = useMemo(
    () => [...new Set(playable.map((m) => m.round))].sort((a, b) => a - b),
    [playable]
  );

  const champion = useMemo(() => {
    if (!tournament || tournament.status !== "completed") return null;
    if (isKnockout) {
      const finalRound = matches.length ? Math.max(...matches.map((m) => m.round)) : 0;
      const finalMatch = matches.find((m) => m.round === finalRound && m.status === "completed");
      if (!finalMatch || finalMatch.home_score == null || finalMatch.away_score == null) return null;
      const winnerId = finalMatch.home_score > finalMatch.away_score ? finalMatch.home_team_id : finalMatch.away_team_id;
      const winner = teams.find((t) => t.id === winnerId);
      if (!winner) return null;
      return { name: winner.name, detail: `${finalMatch.home_score} - ${finalMatch.away_score} in the final` };
    }
    const standings = computeStandings(
      teams.map((t) => t.id),
      matches
    );
    const top = standings[0];
    const winner = top ? teams.find((t) => t.id === top.teamId) : null;
    if (!winner || !top) return null;
    return { name: winner.name, detail: `${top.won}W ${top.drawn}D ${top.lost}L · ${top.points} pts` };
  }, [tournament, isKnockout, matches, teams]);

  if (loading || !tournament) {
    return (
      <div className="min-h-[100dvh] rondo-page px-4 py-5 space-y-3 max-w-lg mx-auto">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 bg-card border border-border rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] rondo-page pb-24">
      <header className="sticky top-0 rondo-glass-nav border-b border-[var(--stroke)] z-40 px-4 py-3">
        <div className="flex h-12 items-center gap-2 max-w-lg mx-auto">
          <button
            type="button"
            onClick={() => router.push("/organizer/tournaments")}
            aria-label="Back"
            className="flex min-h-11 min-w-11 items-center justify-center rounded-[var(--r-pill)] text-[var(--ink-mid)]"
          >
            <ArrowLeft size={18} />
          </button>
          <Trophy size={20} weight="duotone" className="text-[var(--gold)]" />
          <h1 className="rondo-title text-[var(--ink-hi)] truncate">{tournament.name}</h1>
        </div>
      </header>

      <div className="px-4 py-6 space-y-8 max-w-lg mx-auto">
        {/* ── COMPLETED: champion celebration ── */}
        {tournament.status === "completed" && (
          <section className="rondo-surface p-6 text-center space-y-3 rondo-floodlight-scene--gold">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[var(--r-lg)] bg-[var(--gold-dim)]">
              <Trophy size={32} weight="duotone" className="text-[var(--gold)]" />
            </div>
            <p className="rondo-label text-[var(--gold)]">
              Tournament completed
            </p>
            {champion ? (
              <>
                <h2 className="font-heading text-5xl font-bold uppercase text-[var(--ink-hi)]">{champion.name}</h2>
                <p className="rondo-meta text-[var(--ink-mid)]">{champion.detail}</p>
              </>
            ) : (
              <h2 className="rondo-title text-[var(--ink-hi)]">Champion pending</h2>
            )}
          </section>
        )}

        {/* ── REGISTRATION: roster + start ── */}
        {tournament.status === "registration" && (
          <>
            <section className="space-y-3">
              <StatTile label="Teams registered" value={teams.length} unit={`/ ${tournament.max_teams}`} size="lg" />

              {confirmStart ? (
                <div className="space-y-3 rounded-[var(--r-md)] border border-[var(--gold)] bg-[var(--gold-dim)] p-4">
                  <p className="rondo-body font-bold text-[var(--ink-hi)]">Start this tournament?</p>
                  <p className="rondo-meta text-[var(--ink-mid)]">
                    The {isKnockout ? "bracket" : "full schedule"} is drawn from {teams.length} teams and
                    registration closes. No more teams can join after this.
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmStart(false)}
                      className="rondo-btn rondo-btn-secondary flex-1"
                    >
                      Go back
                    </button>
                    <button
                      type="button"
                      onClick={startTournament}
                      disabled={starting}
                      className="rondo-btn rondo-btn-primary flex-1 disabled:opacity-50"
                    >
                      {starting ? "Generating..." : "Confirm, start"}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setConfirmStart(true)}
                    disabled={teams.length < 2}
                    className="rondo-btn rondo-btn-primary min-h-12 disabled:opacity-40"
                  >
                    <Play size={16} />
                    Start tournament
                  </button>
                  {teams.length < 2 && (
                    <p className="rondo-meta text-[var(--ink-low)]">Need at least 2 teams to start.</p>
                  )}
                </>
              )}
            </section>

            <section className="space-y-3">
              <SectionLabel>Teams ({teams.length})</SectionLabel>
              {teams.length === 0 ? (
                <EmptyState title="No teams yet" body="Share the tournament page so captains can register." />
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {teams.map((team) => (
                    <div
                      key={team.id}
                      className="flex min-h-14 items-center gap-2 rounded-[var(--r-md)] border border-[var(--stroke)] bg-card px-3 py-3"
                    >
                      <Shield size={16} weight="duotone" className="text-[var(--gold)] shrink-0" />
                      <span className="rondo-meta font-bold text-[var(--ink-hi)] truncate">{team.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {/* ── ACTIVE: bracket / fixtures + standings, tap a match to score it ── */}
        {tournament.status === "active" && (
          <>
            {isKnockout ? (
              <section className="space-y-3">
                <SectionLabel>Bracket. Tap a match to enter the result</SectionLabel>
                <BracketView matches={matches} teams={teams} onMatchTap={handleMatchTap} />
              </section>
            ) : (
              <>
                <section className="space-y-3">
                  <SectionLabel>Fixtures. Tap a match to enter the result</SectionLabel>
                  {roundRobinDays.map((round) => (
                    <div key={round} className="space-y-2">
                      <p className="rondo-label text-[var(--ink-low)]">
                        Matchday {round}
                      </p>
                      {playable
                        .filter((m) => m.round === round)
                        .map((match) => {
                          const home = teams.find((t) => t.id === match.home_team_id)?.name ?? "TBD";
                          const away = teams.find((t) => t.id === match.away_team_id)?.name ?? "TBD";
                          const done = match.status === "completed";
                          return (
                            <button
                              key={match.id}
                              type="button"
                              onClick={() => handleMatchTap(match)}
                              disabled={done}
                              className="block w-full disabled:active:scale-100 active:scale-[0.98] transition-transform"
                            >
                              <MatchCell
                                home={home}
                                away={away}
                                homeScore={match.home_score}
                                awayScore={match.away_score}
                                state={done ? "final" : "scheduled"}
                                kickoff={done ? null : "Tap"}
                                className="rounded-[var(--r-md)] border border-[var(--stroke)] bg-card"
                              />
                            </button>
                          );
                        })}
                    </div>
                  ))}
                </section>
                <section className="space-y-3">
                  <SectionLabel>Standings</SectionLabel>
                  <StandingsTable matches={matches} teams={teams} />
                </section>
              </>
            )}
          </>
        )}

        {/* ── COMPLETED: keep the bracket / standings visible for reference ── */}
        {tournament.status === "completed" && matches.length > 0 && (
          <section className="space-y-3">
            <SectionLabel>{isKnockout ? "Final bracket" : "Final standings"}</SectionLabel>
            {isKnockout ? (
              <BracketView matches={matches} teams={teams} />
            ) : (
              <StandingsTable matches={matches} teams={teams} />
            )}
          </section>
        )}
      </div>

      {activeMatch && tournament && (
        <ScoreSheet
          match={activeMatch}
          teams={teams}
          tournamentId={id}
          isKnockout={!!isKnockout}
          onClose={() => setActiveMatch(null)}
          onRecorded={load}
        />
      )}
    </div>
  );
}
