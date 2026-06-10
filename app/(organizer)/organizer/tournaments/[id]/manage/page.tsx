"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Play, Shield, Trophy } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { Tournament, TournamentMatch, TournamentTeam } from "@/lib/supabase/types";
import { BracketView } from "@/components/tournament/BracketView";
import { StandingsTable } from "@/components/tournament/StandingsTable";
import { roundLabel, totalEliminationRounds } from "@/lib/tournament/bracket";

function ResultForm({
  match,
  teams,
  tournamentId,
  onRecorded,
}: {
  match: TournamentMatch;
  teams: TournamentTeam[];
  tournamentId: string;
  onRecorded: () => void;
}) {
  const [homeScore, setHomeScore] = useState("");
  const [awayScore, setAwayScore] = useState("");
  const [saving, setSaving] = useState(false);

  const home = teams.find((t) => t.id === match.home_team_id)?.name ?? "TBD";
  const away = teams.find((t) => t.id === match.away_team_id)?.name ?? "TBD";
  const ready = match.home_team_id && match.away_team_id;

  async function save() {
    if (homeScore === "" || awayScore === "" || saving) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/result`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId: match.id,
          homeScore: Number(homeScore),
          awayScore: Number(awayScore),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Could not record result");
        return;
      }
      toast.success(json.tournamentCompleted ? "Tournament completed!" : "Result recorded");
      onRecorded();
    } finally {
      setSaving(false);
    }
  }

  const scoreInput = (value: string, set: (v: string) => void) => (
    <input
      type="number"
      min={0}
      max={99}
      value={value}
      onChange={(e) => set(e.target.value)}
      className="w-12 bg-black/30 border border-white/10 rounded-lg px-2 py-1.5 text-white text-sm text-center outline-none focus:border-rondo-accent/40"
    />
  );

  return (
    <div className="flex items-center justify-between gap-2 bg-card border border-border rounded-xl px-3 py-2.5">
      <span className="text-white/85 text-xs font-semibold flex-1 text-right truncate">{home}</span>
      {match.status === "completed" ? (
        <span className="text-rondo-accent text-sm font-bold px-2 tabular-nums">
          {match.home_score} - {match.away_score}
        </span>
      ) : ready ? (
        <div className="flex items-center gap-1.5">
          {scoreInput(homeScore, setHomeScore)}
          <span className="text-white/30 text-xs">:</span>
          {scoreInput(awayScore, setAwayScore)}
          <button
            type="button"
            onClick={save}
            disabled={homeScore === "" || awayScore === "" || saving}
            className="rounded-lg bg-rondo-accent text-black px-2.5 py-1.5 text-xs font-bold disabled:opacity-40"
          >
            {saving ? "…" : "Save"}
          </button>
        </div>
      ) : (
        <span className="text-white/30 text-xs px-2">awaiting teams</span>
      )}
      <span className="text-white/85 text-xs font-semibold flex-1 truncate">{away}</span>
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
      await load();
    } finally {
      setStarting(false);
    }
  }

  if (loading || !tournament) {
    return (
      <div className="min-h-[100dvh] rondo-page px-4 py-5 space-y-3 max-w-lg mx-auto">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 bg-card border border-border rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  const isKnockout = tournament.format === "single_elimination";
  const playable = matches.filter((m) => m.status !== "bye");
  const finalRounds = totalEliminationRounds(teams.length || 2);

  return (
    <div className="min-h-[100dvh] rondo-page pb-20">
      <header className="sticky top-0 rondo-glass-nav border-b border-white/5 z-40 px-4 py-3">
        <div className="flex items-center gap-2.5 max-w-lg mx-auto">
          <button type="button" onClick={() => router.push("/organizer/tournaments")} aria-label="Back">
            <ArrowLeft size={18} className="text-white/70" />
          </button>
          <Trophy size={18} className="text-rondo-accent" />
          <h1 className="text-white font-black text-lg truncate">{tournament.name}</h1>
        </div>
      </header>

      <div className="px-4 py-5 space-y-6 max-w-lg mx-auto">
        {tournament.status === "registration" && (
          <section className="rondo-surface p-4 space-y-3">
            <p className="text-white/70 text-sm">
              <span className="text-white font-bold">{teams.length}</span> of {tournament.max_teams}{" "}
              teams registered. Starting closes registration and generates{" "}
              {isKnockout ? "the bracket" : "all matchdays"}.
            </p>
            <button
              type="button"
              onClick={startTournament}
              disabled={teams.length < 2 || starting}
              className="inline-flex items-center justify-center gap-1.5 w-full rounded-xl bg-rondo-accent text-black px-4 py-3 text-sm font-bold disabled:opacity-40"
            >
              <Play size={15} />
              {starting ? "Generating fixtures…" : "Start tournament"}
            </button>
            {teams.length < 2 && (
              <p className="text-muted-foreground text-xs">Need at least 2 teams to start.</p>
            )}
          </section>
        )}

        {tournament.status === "completed" && (
          <div className="rondo-surface p-4 text-center">
            <p className="text-rondo-accent font-heading font-bold uppercase">Tournament completed</p>
          </div>
        )}

        <section className="space-y-3">
          <h2 className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
            Teams ({teams.length})
          </h2>
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

        {matches.length > 0 && (
          <>
            <section className="space-y-3">
              <h2 className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                Record results
              </h2>
              {isKnockout
                ? [...new Set(playable.map((m) => m.round))].sort((a, b) => a - b).map((round) => (
                    <div key={round} className="space-y-2">
                      <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider">
                        {roundLabel(round, finalRounds)}
                      </p>
                      {playable
                        .filter((m) => m.round === round)
                        .map((match) => (
                          <ResultForm
                            key={match.id}
                            match={match}
                            teams={teams}
                            tournamentId={id}
                            onRecorded={load}
                          />
                        ))}
                    </div>
                  ))
                : [...new Set(playable.map((m) => m.round))].sort((a, b) => a - b).map((round) => (
                    <div key={round} className="space-y-2">
                      <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider">
                        Matchday {round}
                      </p>
                      {playable
                        .filter((m) => m.round === round)
                        .map((match) => (
                          <ResultForm
                            key={match.id}
                            match={match}
                            teams={teams}
                            tournamentId={id}
                            onRecorded={load}
                          />
                        ))}
                    </div>
                  ))}
            </section>

            <section className="space-y-3">
              <h2 className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                {isKnockout ? "Bracket" : "Standings"}
              </h2>
              {isKnockout ? (
                <BracketView matches={matches} teams={teams} />
              ) : (
                <StandingsTable matches={matches} teams={teams} />
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
