"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Plus, Play, Shield, Trophy } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { subscribeToTournament } from "@/lib/realtime";
import type { Tournament, TournamentMatch, TournamentTeam } from "@/lib/supabase/types";
import { BracketView } from "@/components/tournament/BracketView";
import { StandingsTable } from "@/components/tournament/StandingsTable";
import { computeStandings } from "@/lib/tournament/bracket";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">{children}</h2>
  );
}

/**
 * A team name on the left, +/- stepper on the right — stacked one team per
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
      <span className="min-w-0 flex-1 truncate text-sm font-bold text-white">{label}</span>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          aria-label={`Decrease ${label} score`}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/12 bg-white/[0.05] text-white active:scale-95"
        >
          <span aria-hidden="true" className="text-lg font-black leading-none">
            −
          </span>
        </button>
        <span className="w-7 text-center font-heading text-2xl font-black text-white tabular-nums">
          {value}
        </span>
        <button
          type="button"
          onClick={() => onChange(Math.min(99, value + 1))}
          aria-label={`Increase ${label} score`}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-rondo-accent/40 bg-rondo-accent/10 text-rondo-accent active:scale-95"
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
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
      />
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg overflow-y-auto rounded-t-3xl border-t border-white/10 bg-rondo-elevated pb-[calc(env(safe-area-inset-bottom)+1rem)] shadow-2xl"
        style={{ animation: "rondoSheetUp 280ms cubic-bezier(0.32,0.72,0,1)" }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rondo-accent">
              {isKnockout ? "Knockout result" : "Match result"}
            </p>
            <h2 className="font-heading text-lg font-black uppercase italic text-white truncate">
              {home} vs {away}
            </h2>
          </div>
        </div>

        <div className="px-5 py-6 space-y-5">
          <div className="space-y-3 divide-y divide-white/[0.06]">
            <Stepper label={home} value={homeScore} onChange={setHomeScore} />
            <div className="pt-3">
              <Stepper label={away} value={awayScore} onChange={setAwayScore} />
            </div>
          </div>

          {knockoutDrawBlocked && (
            <p className="text-red-300 text-xs text-center bg-red-500/10 border border-red-500/25 rounded-xl px-3 py-2.5">
              Knockout matches can&rsquo;t end in a draw — adjust one score to save.
            </p>
          )}

          {confirming && !knockoutDrawBlocked && (
            <p className="text-rondo-accent text-xs text-center bg-rondo-accent/10 border border-rondo-accent/25 rounded-xl px-3 py-2.5">
              {home} {homeScore} - {awayScore} {away}. Knockout results can&rsquo;t be changed once saved — confirm to
              lock it in.
            </p>
          )}

          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={confirming ? () => setConfirming(false) : onClose}
              className="flex-1 min-h-[48px] rounded-2xl border border-white/12 text-white/60 text-sm font-bold"
            >
              {confirming ? "Back" : "Cancel"}
            </button>
            <button
              type="button"
              onClick={handlePrimaryTap}
              disabled={saving || knockoutDrawBlocked}
              className="flex-1 min-h-[48px] rounded-2xl bg-rondo-accent text-rondo-black text-sm font-black uppercase tracking-wide disabled:opacity-40"
            >
              {saving ? "Saving…" : confirming ? "Confirm final score" : "Save score"}
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
      toast.success("Fixtures generated — game on!");
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
    <div className="min-h-[100dvh] rondo-page pb-20">
      <header className="sticky top-0 rondo-glass-nav border-b border-white/5 z-40 px-4 py-3">
        <div className="flex items-center gap-2.5 max-w-lg mx-auto">
          <button
            type="button"
            onClick={() => router.push("/organizer/tournaments")}
            aria-label="Back"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center -ml-2.5 rounded-full text-white/70"
          >
            <ArrowLeft size={18} />
          </button>
          <Trophy size={18} className="text-white/50" />
          <h1 className="text-white font-black text-lg truncate">{tournament.name}</h1>
        </div>
      </header>

      <div className="px-4 py-5 space-y-6 max-w-lg mx-auto">
        {/* ── COMPLETED: champion celebration ── */}
        {tournament.status === "completed" && (
          <section className="rondo-surface p-6 text-center space-y-2">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-rondo-accent/15">
              <Trophy size={30} className="text-rondo-accent" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/45">
              Tournament completed
            </p>
            {champion ? (
              <>
                <h2 className="rondo-hero-title text-4xl text-rondo-accent">{champion.name}</h2>
                <p className="text-sm text-white/55">{champion.detail}</p>
              </>
            ) : (
              <h2 className="rondo-hero-title text-2xl text-white">Champion pending</h2>
            )}
          </section>
        )}

        {/* ── REGISTRATION: roster + start ── */}
        {tournament.status === "registration" && (
          <>
            <section className="rondo-surface p-4 space-y-3">
              <p className="text-white/70 text-sm">
                <span className="text-white font-bold">{teams.length}</span> of {tournament.max_teams}{" "}
                teams registered.
              </p>

              {confirmStart ? (
                <div className="space-y-3 rounded-2xl border border-rondo-accent/30 bg-rondo-accent/10 p-4">
                  <p className="text-white text-sm font-bold">Start this tournament?</p>
                  <p className="text-white/60 text-xs leading-5">
                    The {isKnockout ? "bracket" : "full schedule"} is drawn from {teams.length} teams and
                    registration closes — no more teams can join after this.
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmStart(false)}
                      className="flex-1 min-h-[44px] rounded-xl border border-white/12 text-white/60 text-xs font-bold"
                    >
                      Go back
                    </button>
                    <button
                      type="button"
                      onClick={startTournament}
                      disabled={starting}
                      className="flex-1 min-h-[44px] rounded-xl bg-rondo-accent text-rondo-black text-xs font-black uppercase tracking-wide disabled:opacity-50"
                    >
                      {starting ? "Generating…" : "Confirm, start"}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setConfirmStart(true)}
                    disabled={teams.length < 2}
                    className="rondo-btn rondo-btn-primary min-h-[56px] text-sm disabled:opacity-40"
                  >
                    <Play size={16} />
                    Start tournament
                  </button>
                  {teams.length < 2 && (
                    <p className="text-muted-foreground text-xs">Need at least 2 teams to start.</p>
                  )}
                </>
              )}
            </section>

            <section className="space-y-3">
              <SectionLabel>Teams ({teams.length})</SectionLabel>
              {teams.length === 0 ? (
                <div className="rondo-surface p-4">
                  <p className="text-muted-foreground text-sm">
                    No teams yet. Share the tournament page so captains can register.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {teams.map((team) => (
                    <div
                      key={team.id}
                      className="flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-2.5"
                    >
                      <Shield size={13} className="text-rondo-accent shrink-0" />
                      <span className="text-white text-xs font-semibold truncate">{team.name}</span>
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
                <SectionLabel>Bracket — tap a match to enter the result</SectionLabel>
                <BracketView matches={matches} teams={teams} onMatchTap={handleMatchTap} />
              </section>
            ) : (
              <>
                <section className="space-y-3">
                  <SectionLabel>Fixtures — tap a match to enter the result</SectionLabel>
                  {roundRobinDays.map((round) => (
                    <div key={round} className="space-y-2">
                      <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider">
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
                              className="flex w-full items-center justify-between gap-2 bg-card border border-border rounded-xl px-3 py-2.5 min-h-[44px] disabled:active:scale-100 active:scale-[0.98] transition-transform"
                            >
                              <span className="text-white/85 text-xs font-semibold flex-1 text-left truncate">
                                {home}
                              </span>
                              {done ? (
                                <span className="text-rondo-accent text-sm font-bold px-2 tabular-nums">
                                  {match.home_score} - {match.away_score}
                                </span>
                              ) : (
                                <span className="text-white/30 text-xs px-2">Tap to score</span>
                              )}
                              <span className="text-white/85 text-xs font-semibold flex-1 text-right truncate">
                                {away}
                              </span>
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
