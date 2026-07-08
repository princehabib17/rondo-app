"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Lock, Shield, Trophy } from "@phosphor-icons/react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { isGuestUser } from "@/lib/auth/is-guest";
import { subscribeToTournament } from "@/lib/realtime";
import { computeStandings } from "@/lib/tournament/bracket";
import type { Tournament, TournamentMatch, TournamentTeam } from "@/lib/supabase/types";
import { BracketView } from "@/components/tournament/BracketView";
import { StandingsTable } from "@/components/tournament/StandingsTable";
import { TournamentHero } from "@/components/tournament/TournamentHero";
import { EmptyState, MatchCell, StatTile } from "@/components/rondo/primitives";

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
        line: `Won the final ${final.home_score} - ${final.away_score}`,
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
      <header className="sticky top-0 z-40 border-b border-[var(--stroke)] rondo-glass-nav px-4 py-3">
        <div className="mx-auto flex h-12 max-w-lg items-center gap-3">
          <button type="button" onClick={() => router.back()} aria-label="Back" className="grid min-h-11 min-w-11 place-items-center rounded-[var(--r-pill)] text-[var(--ink-mid)]">
            <ArrowLeft size={20} />
          </button>
          <h1 className="truncate rondo-title text-[var(--ink-hi)]">{tournament.name}</h1>
        </div>
      </header>

      <TournamentHero tournament={tournament} teamCount={teams.length} />

      <nav className="sticky top-[73px] z-20 border-b border-[var(--stroke)] bg-[color-mix(in_oklch,var(--bg-page)_92%,transparent)] px-4 py-2 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg gap-2 overflow-x-auto [scrollbar-width:none]">
          {["Overview", isKnockout ? "Bracket" : "Standings", "Schedule", "Squad"].map((item, index) => (
            <a key={item} href={`#${item.toLowerCase()}`} className="rondo-chip shrink-0" data-active={index === 0}>
              {item}
            </a>
          ))}
          <Link href={`/tournaments/${id}/room`} className="rondo-chip shrink-0">
            Room
          </Link>
          {tournament.status === "completed" && (
            <Link href={`/tournaments/${id}/champion`} className="rondo-chip shrink-0">
              Champion
            </Link>
          )}
        </div>
      </nav>

      <div className="mx-auto max-w-lg space-y-8 px-4 py-6">
        {champion && (
          <section
            className="relative overflow-hidden rounded-[var(--r-lg)] border border-[var(--gold)] rondo-floodlight-scene--gold px-4 py-6 text-center"
            aria-label="Champion"
          >
            <Trophy size={32} weight="duotone" className="mx-auto mb-2 text-[var(--gold)]" />
            <p className="rondo-label text-[var(--gold)]">Champion</p>
            <p className="mt-1 font-heading text-4xl font-bold uppercase text-[var(--ink-hi)]">{champion.name}</p>
            <p className="mt-2 rondo-meta text-[var(--ink-mid)]">{champion.line}</p>
          </section>
        )}

        <section id="overview" className="space-y-3 scroll-mt-28">
          <h2 className="rondo-label text-[var(--ink-low)]">Overview</h2>
          <div className="grid gap-3">
            <StatTile label="Teams" value={teams.length} unit={`/ ${tournament.max_teams}`} size="lg" />
            <div className="grid grid-cols-2 gap-3">
              <StatTile label="Matches" value={matches.length || "Draw soon"} size="sm" />
              <StatTile
                label="Goals"
                value={matches.reduce((sum, match) => sum + (match.home_score ?? 0) + (match.away_score ?? 0), 0)}
                size="sm"
              />
            </div>
          </div>
          {tournament.description && (
            <p className="whitespace-pre-wrap rondo-body text-[var(--ink-mid)]">{tournament.description}</p>
          )}
        </section>

        {matches.length === 0 ? (
          <section id="squad" className="space-y-3 scroll-mt-28">
            <h2 className="rondo-label text-[var(--ink-low)]">
              Teams ({teams.length}/{tournament.max_teams})
            </h2>
            {teams.length === 0 ? (
              <EmptyState title="No teams yet" body="Register first and make everyone chase your seed." />
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {teams.map((team) => (
                  <div
                    key={team.id}
                    className={`flex min-h-14 items-center gap-2 rounded-[var(--r-md)] border px-3 py-3 ${
                      team.id === myTeamId
                        ? "border-[var(--gold)] bg-[var(--gold-dim)]"
                        : "border-[var(--stroke)] bg-[var(--bg-surface)]"
                    }`}
                  >
                    <Shield size={16} weight="duotone" className="shrink-0 text-[var(--gold)]" />
                    <span className="truncate rondo-meta font-bold text-[var(--ink-hi)]">{team.name}</span>
                    {team.id === myTeamId && (
                      <span className="shrink-0 rounded-[var(--r-pill)] bg-[var(--gold)] px-2 py-0.5 rondo-label text-[var(--gold-ink)]">
                        You
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        ) : (
          <section id={isKnockout ? "bracket" : "standings"} className="space-y-3 scroll-mt-28">
            <h2 className="rondo-label text-[var(--ink-low)]">
              {isKnockout ? "Bracket" : "Standings"}
            </h2>
            {isKnockout ? (
              <>
                <BracketView matches={matches} teams={teams} highlightTeamId={myTeamId} />
                <Link href={`/tournaments/${id}/bracket`} className="rondo-btn rondo-btn-secondary">
                  Open full bracket
                </Link>
              </>
            ) : (
              <>
                <StandingsTable matches={matches} teams={teams} highlightTeamId={myTeamId} />
                <h2 id="schedule" className="pt-5 rondo-label text-[var(--ink-low)] scroll-mt-28">
                  Fixtures
                </h2>
                <div className="rondo-surface overflow-hidden">
                  {matches.map((match) => {
                    const home = teams.find((t) => t.id === match.home_team_id)?.name ?? "TBD";
                    const away = teams.find((t) => t.id === match.away_team_id)?.name ?? "TBD";
                    return (
                      <MatchCell
                        key={match.id}
                        home={home}
                        away={away}
                        homeScore={match.home_score}
                        awayScore={match.away_score}
                        state={match.status === "completed" ? "final" : match.status === "scheduled" ? "scheduled" : "live"}
                        kickoff={`MD ${match.round}`}
                      />
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
                {tournament.status === "active" && "Registration closed. Tournament underway."}
                {tournament.status === "completed" && "Tournament completed."}
              </div>
            ) : alreadyRegistered ? (
              <div className="flex min-h-[44px] items-center gap-2 text-sm font-semibold text-emerald-300">
                <Shield size={14} className="shrink-0" />
                Your team is in. See you on matchday.
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
                Tournament full. All {tournament.max_teams} team slots are taken.
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value.slice(0, 60))}
                  placeholder="Team name"
                className="h-12 flex-1 rounded-[var(--r-sm)] border border-transparent bg-[var(--bg-inset)] px-4 rondo-body text-[var(--ink-hi)] outline-none placeholder:text-[var(--ink-low)] focus:border-[var(--gold)]"
                />
                <button
                  type="button"
                  onClick={registerTeam}
                  disabled={teamName.trim().length < 2 || registering}
                  className="h-12 shrink-0 rounded-[var(--r-pill)] bg-[var(--gold)] px-6 font-heading text-base font-bold uppercase text-[var(--gold-ink)] transition active:scale-[0.98] disabled:opacity-40"
                >
                  {registering ? "..." : "Register"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
