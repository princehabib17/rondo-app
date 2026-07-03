"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Lock, Shield, Trophy } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { isGuestUser } from "@/lib/auth/is-guest";
import { subscribeToTournament } from "@/lib/realtime";
import { computeStandings } from "@/lib/tournament/bracket";
import type { Tournament, TournamentMatch, TournamentTeam } from "@/lib/supabase/types";
import { BracketView } from "@/components/tournament/BracketView";
import { StandingsTable } from "@/components/tournament/StandingsTable";
import { TournamentHero } from "@/components/tournament/TournamentHero";

export default function TournamentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [teams, setTeams] = useState<TournamentTeam[]>([]);
  const [matches, setMatches] = useState<TournamentMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [registering, setRegistering] = useState(false);

  // Data refresh without re-hitting the auth server; also runs on realtime events.
  const refreshData = useCallback(async () => {
    const supabase = createClient();
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

    if (!t) {
      setNotFound(true);
    } else {
      setTournament(t as Tournament);
      setTeams((teamRows as TournamentTeam[]) ?? []);
      setMatches((matchRows as TournamentMatch[]) ?? []);
    }
  }, [id]);

  const load = useCallback(async () => {
    const supabase = createClient();
    const [{ data: userData }] = await Promise.all([supabase.auth.getUser(), refreshData()]);
    setUserId(userData.user?.id ?? null);
    setIsGuest(isGuestUser(userData.user));
    setLoading(false);
  }, [refreshData]);

  useEffect(() => {
    load();
  }, [load]);

  // Live bracket/standings: scores and advancement land without a refresh.
  useEffect(() => {
    return subscribeToTournament(id, refreshData);
  }, [id, refreshData]);

  async function registerTeam() {
    const name = teamName.trim();
    if (!name || registering) return;
    setRegistering(true);
    try {
      const res = await fetch(`/api/tournaments/${id}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamName: name }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Could not register");
        return;
      }
      toast.success("Team registered!");
      setTeamName("");
      await load();
    } finally {
      setRegistering(false);
    }
  }

  const isKnockout = tournament?.format === "single_elimination";
  const myTeamId = userId ? teams.find((t) => t.captain_id === userId)?.id ?? null : null;

  const champion = useMemo(() => {
    if (!tournament || tournament.status !== "completed") return null;
    if (isKnockout) {
      const totalRounds = matches.length > 0 ? Math.max(...matches.map((m) => m.round)) : 0;
      const final = matches.find((m) => m.round === totalRounds);
      if (!final || final.status !== "completed" || final.home_score == null || final.away_score == null) {
        return null;
      }
      const winnerId =
        final.home_score > final.away_score
          ? final.home_team_id
          : final.away_score > final.home_score
            ? final.away_team_id
            : null;
      if (!winnerId) return null;
      return {
        name: teams.find((t) => t.id === winnerId)?.name ?? "Champion",
        line: `Won the final ${final.home_score}–${final.away_score}`,
      };
    }
    const standings = computeStandings(teams.map((t) => t.id), matches);
    const top = standings[0];
    if (!top || top.played === 0) return null;
    return {
      name: teams.find((t) => t.id === top.teamId)?.name ?? "Champion",
      line: `Finished top with ${top.points} points`,
    };
  }, [tournament, isKnockout, matches, teams]);

  if (loading) {
    return (
      <div className="min-h-[100dvh] rondo-page px-4 py-5">
        <div className="mx-auto max-w-lg space-y-3">
          <div className="h-40 rounded-3xl rondo-shimmer" />
          <div className="h-24 rounded-2xl rondo-shimmer" />
          <div className="h-24 rounded-2xl rondo-shimmer" />
        </div>
      </div>
    );
  }

  if (notFound || !tournament) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-3 rondo-page px-4">
        <p className="text-sm text-white/70">Tournament not found.</p>
        <Link href="/tournaments" className="text-sm font-semibold text-rondo-accent">
          Back to tournaments
        </Link>
      </div>
    );
  }

  const alreadyRegistered = userId !== null && teams.some((t) => t.captain_id === userId);
  const full = teams.length >= tournament.max_teams;
  const canRegister = tournament.status === "registration" && !full && !alreadyRegistered;
  const nextParam = `/tournaments/${id}`;
  const showActionCard = tournament.status !== "cancelled";

  return (
    <div className="min-h-[100dvh] rondo-page pb-44">
      <header className="sticky top-0 z-40 border-b border-white/5 rondo-glass-nav px-4 py-3">
        <div className="mx-auto flex max-w-lg items-center gap-2.5">
          <button type="button" onClick={() => router.back()} aria-label="Back" className="p-0.5">
            <ArrowLeft size={18} className="text-white/70" />
          </button>
          <h1 className="truncate text-lg font-black text-white">{tournament.name}</h1>
        </div>
      </header>

      <TournamentHero tournament={tournament} teamCount={teams.length} />

      <div className="mx-auto max-w-lg space-y-6 px-4 py-6">
        {champion && (
          <section
            className="relative overflow-hidden rounded-2xl border border-rondo-accent/30 rondo-floodlight-scene--gold px-4 py-6 text-center"
            aria-label="Champion"
          >
            <Trophy size={26} className="mx-auto mb-2 text-rondo-accent" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-rondo-accent/80">Champion</p>
            <p className="mt-1 font-heading text-2xl font-black uppercase italic text-white">{champion.name}</p>
            <p className="mt-1 text-xs text-white/60">{champion.line}</p>
          </section>
        )}

        {tournament.description && (
          <p className="whitespace-pre-wrap text-sm text-white/70">{tournament.description}</p>
        )}

        {matches.length === 0 ? (
          <section className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Teams ({teams.length}/{tournament.max_teams})
            </h2>
            {teams.length === 0 ? (
              <div className="rondo-surface p-4">
                <p className="text-sm text-muted-foreground">No teams registered yet — be the first.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {teams.map((team) => (
                  <div
                    key={team.id}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 ${
                      team.id === myTeamId
                        ? "border-rondo-blue/40 bg-rondo-blue/10"
                        : "border-border bg-card"
                    }`}
                  >
                    <Shield size={13} className="shrink-0 text-rondo-accent" />
                    <span className="truncate text-xs font-semibold text-white">{team.name}</span>
                    {team.id === myTeamId && (
                      <span className="shrink-0 rounded-full bg-rondo-blue/20 px-1.5 py-[1px] text-[8px] font-black uppercase tracking-wide text-rondo-blue">
                        You
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        ) : (
          <section className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {isKnockout ? "Bracket" : "Standings"}
            </h2>
            {isKnockout ? (
              <BracketView matches={matches} teams={teams} highlightTeamId={myTeamId} />
            ) : (
              <>
                <StandingsTable matches={matches} teams={teams} highlightTeamId={myTeamId} />
                <h2 className="pt-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Fixtures
                </h2>
                <div className="space-y-2">
                  {matches.map((match) => {
                    const home = teams.find((t) => t.id === match.home_team_id)?.name ?? "TBD";
                    const away = teams.find((t) => t.id === match.away_team_id)?.name ?? "TBD";
                    return (
                      <div
                        key={match.id}
                        className="flex items-center justify-between rounded-xl border border-border bg-card px-3 py-2.5 text-xs"
                      >
                        <span className="w-14 shrink-0 text-white/40">MD {match.round}</span>
                        <span className="flex-1 truncate text-right font-semibold text-white/85">{home}</span>
                        <span className="px-3 tabular-nums font-bold text-rondo-accent">
                          {match.status === "completed" ? `${match.home_score} - ${match.away_score}` : "vs"}
                        </span>
                        <span className="flex-1 truncate font-semibold text-white/85">{away}</span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </section>
        )}
      </div>

      {showActionCard && (
        <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 rondo-sticky-action">
          <div className="mx-auto max-w-lg px-4 py-3">
            {tournament.status !== "registration" ? (
              <div className="flex min-h-[44px] items-center gap-2 text-sm text-white/50">
                <Lock size={14} className="shrink-0" />
                {tournament.status === "active" && "Registration closed — tournament underway."}
                {tournament.status === "completed" && "Tournament completed."}
              </div>
            ) : alreadyRegistered ? (
              <div className="flex min-h-[44px] items-center gap-2 text-sm font-semibold text-emerald-300">
                <Shield size={14} className="shrink-0" />
                Your team is in — see you on matchday.
              </div>
            ) : !userId ? (
              <Link
                href={`/login?next=${encodeURIComponent(nextParam)}`}
                className="rondo-btn rondo-btn-primary w-full"
              >
                Log in to register
              </Link>
            ) : isGuest ? (
              <Link
                href={`/signup?next=${encodeURIComponent(nextParam)}`}
                className="rondo-btn rondo-btn-primary w-full"
              >
                Create an account to register
              </Link>
            ) : !canRegister ? (
              <div className="flex min-h-[44px] items-center gap-2 text-sm text-white/50">
                <Lock size={14} className="shrink-0" />
                Tournament full — all {tournament.max_teams} team slots are taken.
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value.slice(0, 60))}
                  placeholder="Team name"
                  className="min-h-[44px] flex-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-rondo-accent/40"
                />
                <button
                  type="button"
                  onClick={registerTeam}
                  disabled={teamName.trim().length < 2 || registering}
                  className="min-h-[44px] shrink-0 rounded-lg bg-rondo-accent px-4 py-2.5 text-sm font-bold text-black transition active:scale-[0.98] disabled:opacity-40"
                >
                  {registering ? "…" : "Register"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
