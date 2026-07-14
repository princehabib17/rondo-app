"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Crown, Lock, Shield, SoccerBall, Trophy, UserPlus, X } from "@phosphor-icons/react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { isGuestUser } from "@/lib/auth/is-guest";
import { subscribeToTournament } from "@/lib/realtime";
import { computeChampion } from "@/lib/tournament/bracket";
import type {
  Tournament,
  TournamentGoal,
  TournamentMatch,
  TournamentTeam,
  TournamentTeamMember,
} from "@/lib/supabase/types";
import { BracketView } from "@/components/tournament/BracketView";
import { StandingsTable } from "@/components/tournament/StandingsTable";
import { TournamentHero } from "@/components/tournament/TournamentHero";
import { TopScorers } from "@/components/tournament/TopScorers";
import { EmptyState, MatchCell, StatTile } from "@/components/rondo/primitives";

/**
 * Tap a team, see its people. Registered players join the roster from here —
 * that's how goals get tagged to real profiles and honors land after the final.
 */
function RosterSheet({
  tournament,
  team,
  members,
  userId,
  isGuest,
  onMembership,
  onClose,
}: {
  tournament: Tournament;
  team: TournamentTeam;
  members: TournamentTeamMember[];
  userId: string | null;
  isGuest: boolean;
  onMembership: () => Promise<void>;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const roster = members
    .filter((m) => m.team_id === team.id)
    .sort((a, b) => (a.role === "captain" ? -1 : b.role === "captain" ? 1 : 0));
  const myMembership = userId ? members.find((m) => m.user_id === userId) ?? null : null;
  const onThisTeam = myMembership?.team_id === team.id;
  const rosterOpen = ["registration", "active"].includes(tournament.status);
  const canJoin = rosterOpen && !!userId && !isGuest && !myMembership;
  const nextParam = `/tournaments/${tournament.id}`;

  async function join() {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/tournaments/${tournament.id}/teams/${team.id}/join`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Could not join team");
        return;
      }
      toast.success(`You're on ${team.name}`);
      await onMembership();
      onClose();
    } finally {
      setBusy(false);
    }
  }

  async function leave() {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/tournaments/${tournament.id}/teams/${team.id}/join`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Could not leave team");
        return;
      }
      toast.success(`You left ${team.name}`);
      await onMembership();
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[70]">
      <button
        type="button"
        aria-label="Close roster"
        onClick={onClose}
        className="absolute inset-0 bg-[oklch(0%_0_0_/_0.6)] backdrop-blur-sm animate-in fade-in duration-200"
      />
      <div
        className="absolute bottom-0 left-1/2 max-h-[85dvh] w-full max-w-lg -translate-x-1/2 overflow-y-auto rounded-t-[var(--r-lg)] border-t border-[var(--stroke)] bg-[var(--bg-inset)] pb-[calc(env(safe-area-inset-bottom)+1rem)]"
        style={{ animation: "rondoSheetUp 240ms var(--ease-out)" }}
      >
        <div className="mx-auto mt-2 h-1 w-8 rounded-[var(--r-pill)] bg-[var(--gold)]" />
        <div className="flex items-center justify-between gap-3 border-b border-[var(--stroke)] px-5 py-4">
          <div className="min-w-0">
            <p className="rondo-label text-[var(--gold)]">Team {team.team_number ?? "—"}</p>
            <h2 className="truncate rondo-title text-[var(--ink-hi)]">{team.name}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-[var(--r-pill)] text-[var(--ink-low)]"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-4">
          {roster.length === 0 ? (
            <div className="py-8 text-center">
              <SoccerBall size={40} weight="duotone" className="mx-auto mb-3 text-[var(--ink-low)]" aria-hidden />
              <p className="rondo-title text-[var(--ink-hi)]">No roster yet</p>
              <p className="mt-1 rondo-meta text-[var(--ink-low)]">
                Players who join show up here with their profiles.
              </p>
            </div>
          ) : (
            <div>
              {roster.map((member) => {
                const name = member.profile?.full_name ?? "Player";
                const row = (
                  <div className="flex min-h-14 items-center gap-3 border-b border-[var(--stroke)] py-3 last:border-b-0">
                    {member.profile?.avatar_url ? (
                      <img
                        src={member.profile.avatar_url}
                        alt=""
                        className="h-9 w-9 shrink-0 rounded-[var(--r-pill)] object-cover"
                      />
                    ) : (
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[var(--r-pill)] bg-[var(--bg-surface)] text-[var(--ink-low)]">
                        <Shield size={16} weight="duotone" aria-hidden />
                      </span>
                    )}
                    <span className="min-w-0 flex-1 truncate rondo-body font-bold text-[var(--ink-hi)]">
                      {name}
                      {member.user_id === userId && (
                        <span className="ml-2 rounded-[var(--r-pill)] bg-[var(--gold)] px-2 py-0.5 rondo-label text-[var(--gold-ink)]">
                          You
                        </span>
                      )}
                    </span>
                    {member.role === "captain" && (
                      <span className="flex shrink-0 items-center gap-1 rondo-label text-[var(--gold)]">
                        <Crown size={14} weight="fill" aria-hidden />
                        Captain
                      </span>
                    )}
                  </div>
                );
                return (
                  <Link key={member.id} href={`/profile/${member.user_id}`} className="block">
                    {row}
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div className="px-5 pb-2">
          {canJoin ? (
            <button
              type="button"
              onClick={join}
              disabled={busy}
              className="rondo-btn rondo-btn-primary w-full disabled:opacity-40"
            >
              <UserPlus size={16} />
              {busy ? "Joining..." : "Join this team"}
            </button>
          ) : onThisTeam && myMembership?.role !== "captain" && rosterOpen ? (
            <button
              type="button"
              onClick={leave}
              disabled={busy}
              className="rondo-btn rondo-btn-secondary w-full disabled:opacity-40"
            >
              {busy ? "Leaving..." : "Leave this team"}
            </button>
          ) : !userId && rosterOpen ? (
            <Link href={`/login?next=${encodeURIComponent(nextParam)}`} className="rondo-btn rondo-btn-primary w-full">
              Log in to join this team
            </Link>
          ) : isGuest && rosterOpen ? (
            <Link href={`/signup?next=${encodeURIComponent(nextParam)}`} className="rondo-btn rondo-btn-primary w-full">
              Create an account to join
            </Link>
          ) : myMembership && !onThisTeam ? (
            <p className="rondo-meta py-2 text-center text-[var(--ink-low)]">
              You&apos;re already on a team in this tournament.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function TournamentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [teams, setTeams] = useState<TournamentTeam[]>([]);
  const [members, setMembers] = useState<TournamentTeamMember[]>([]);
  const [goals, setGoals] = useState<TournamentGoal[]>([]);
  const [matches, setMatches] = useState<TournamentMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [registering, setRegistering] = useState(false);
  const [openTeam, setOpenTeam] = useState<TournamentTeam | null>(null);
  const [activeSection, setActiveSection] = useState("overview");

  // Data refresh without re-hitting the auth server; also runs on realtime events.
  const refreshData = useCallback(async () => {
    const supabase = createClient();
    const [{ data: t }, { data: teamRows }, { data: matchRows }, { data: memberRows }, { data: goalRows }] =
      await Promise.all([
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
        supabase
          .from("tournament_team_members")
          .select("*, profile:profiles(id, full_name, avatar_url)")
          .eq("tournament_id", id),
        supabase
          .from("tournament_goals")
          .select("*, scorer:profiles(id, full_name, avatar_url)")
          .eq("tournament_id", id),
      ]);

    if (!t) {
      setNotFound(true);
    } else {
      setTournament(t as Tournament);
      setTeams((teamRows as TournamentTeam[]) ?? []);
      setMatches((matchRows as TournamentMatch[]) ?? []);
      setMembers((memberRows as TournamentTeamMember[]) ?? []);
      setGoals((goalRows as TournamentGoal[]) ?? []);
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
  // "Your team" = the one you captain or whose roster you joined.
  const myTeamId = userId
    ? (teams.find((t) => t.captain_id === userId && !t.is_managed)?.id ??
      members.find((m) => m.user_id === userId)?.team_id ??
      null)
    : null;

  const champion = useMemo(() => {
    if (!tournament || tournament.status !== "completed") return null;
    return computeChampion(tournament.format, teams, matches);
  }, [tournament, matches, teams]);

  // Only list a section chip when the section actually renders below —
  // "Schedule" only exists for round-robin, "Bracket"/"Standings" only once
  // the draw is made, so a knockout tournament during registration just
  // shows "Overview" and "Squad".
  const navItems = useMemo(() => {
    const items: { id: string; label: string }[] = [{ id: "overview", label: "Overview" }];
    if (matches.length > 0) {
      items.push({ id: isKnockout ? "bracket" : "standings", label: isKnockout ? "Bracket" : "Standings" });
      if (!isKnockout) items.push({ id: "schedule", label: "Schedule" });
    }
    if (goals.length > 0) items.push({ id: "topscorers", label: "Scorers" });
    items.push({ id: "squad", label: "Squad" });
    return items;
  }, [matches.length, isKnockout, goals.length]);

  // Scroll-spy: highlight whichever section chip actually matches what's on
  // screen, instead of always pointing at "Overview".
  useEffect(() => {
    const elements = navItems
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => el !== null);
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveSection(visible[0].target.id);
      },
      { rootMargin: "-130px 0px -60% 0px", threshold: 0 }
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [navItems]);

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

  const alreadyRegistered = userId !== null && teams.some((t) => t.captain_id === userId && !t.is_managed);
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

      <TournamentHero tournament={tournament} teamCount={teams.length} matches={matches} />

      <nav className="sticky top-[73px] z-20 border-b border-[var(--stroke)] bg-[color-mix(in_oklch,var(--bg-page)_92%,transparent)] px-4 py-2 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg gap-2 overflow-x-auto [scrollbar-width:none]">
          {navItems.map((item) => (
            <a key={item.id} href={`#${item.id}`} className="rondo-chip shrink-0" data-active={activeSection === item.id}>
              {item.label}
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
            <p className="mt-2 rondo-meta text-[var(--ink-mid)]">{champion.detail}</p>
          </section>
        )}

        <section id="overview" className="space-y-3 scroll-mt-28">
          <h2 className="rondo-label text-[var(--ink-low)]">Overview</h2>
          <div className="grid gap-3">
            <StatTile label="Teams" value={teams.length} unit={`/ ${tournament.max_teams}`} size="lg" />
            <div className="grid grid-cols-2 gap-3">
              <StatTile label="Matches" value={matches.length} size="sm" />
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

        {matches.length > 0 && (
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

        {goals.length > 0 && (
          <section id="topscorers" className="space-y-3 scroll-mt-28">
            <h2 className="rondo-label text-[var(--ink-low)]">Top scorers</h2>
            <TopScorers goals={goals} teams={teams} />
          </section>
        )}

        <section id="squad" className="space-y-3 scroll-mt-28">
          <h2 className="rondo-label text-[var(--ink-low)]">
            Teams ({teams.length}/{tournament.max_teams})
          </h2>
          {teams.length === 0 ? (
            <EmptyState title="No teams yet" body="Register first and make everyone chase your seed." />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                {teams.map((team) => {
                  const rosterCount = members.filter((m) => m.team_id === team.id).length;
                  return (
                    <button
                      key={team.id}
                      type="button"
                      onClick={() => setOpenTeam(team)}
                      className={`flex min-h-14 items-center gap-2 rounded-[var(--r-md)] border px-3 py-3 text-left transition-transform active:scale-[0.98] ${
                        team.id === myTeamId
                          ? "border-[var(--gold)] bg-[var(--gold-dim)]"
                          : "border-[var(--stroke)] bg-[var(--bg-surface)]"
                      }`}
                    >
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[var(--r-pill)] bg-[var(--bg-inset)] font-heading text-sm font-bold tabular-nums text-[var(--gold)]">
                        {team.team_number ?? "—"}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate rondo-meta font-bold text-[var(--ink-hi)]">{team.name}</span>
                        <span className="block rondo-meta text-[var(--ink-low)]">
                          {rosterCount > 0 ? `${rosterCount} on roster` : "Tap to join"}
                        </span>
                      </span>
                      {team.id === myTeamId && (
                        <span className="shrink-0 rounded-[var(--r-pill)] bg-[var(--gold)] px-2 py-0.5 rondo-label text-[var(--gold-ink)]">
                          You
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="rondo-meta text-[var(--ink-low)]">
                Tap a team to see the roster or add yourself to it.
              </p>
            </>
          )}
        </section>
      </div>

      {openTeam && tournament && (
        <RosterSheet
          tournament={tournament}
          team={openTeam}
          members={members}
          userId={userId}
          isGuest={isGuest}
          onMembership={refreshData}
          onClose={() => setOpenTeam(null)}
        />
      )}

      {/* bottom-6rem (not 4rem): clears the floating BottomNav pill, which
          occupies 24-84px from the viewport edge, not just its top 64px. */}
      {showActionCard && (
        <div className="fixed inset-x-0 bottom-[calc(6rem+env(safe-area-inset-bottom))] z-30 rondo-sticky-action">
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
