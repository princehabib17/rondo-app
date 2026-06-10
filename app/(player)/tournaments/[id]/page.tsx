"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CalendarDays, MapPin, Shield, Trophy, Users } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { isGuestUser } from "@/lib/auth/is-guest";
import type { Tournament, TournamentMatch, TournamentTeam } from "@/lib/supabase/types";
import { BracketView } from "@/components/tournament/BracketView";
import { StandingsTable } from "@/components/tournament/StandingsTable";
import { formatGameDate, formatPrice } from "@/lib/utils/format";

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

  const load = useCallback(async () => {
    const supabase = createClient();
    const [{ data: userData }, { data: t }, { data: teamRows }, { data: matchRows }] =
      await Promise.all([
        supabase.auth.getUser(),
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

    setUserId(userData.user?.id ?? null);
    setIsGuest(isGuestUser(userData.user));
    if (!t) {
      setNotFound(true);
    } else {
      setTournament(t as Tournament);
      setTeams((teamRows as TournamentTeam[]) ?? []);
      setMatches((matchRows as TournamentMatch[]) ?? []);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

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

  if (loading) {
    return (
      <div className="min-h-[100dvh] rondo-page px-4 py-5 space-y-3 max-w-lg mx-auto">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 bg-card border border-border rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (notFound || !tournament) {
    return (
      <div className="min-h-[100dvh] rondo-page flex flex-col items-center justify-center gap-3 px-4">
        <p className="text-white/70 text-sm">Tournament not found.</p>
        <Link href="/tournaments" className="text-rondo-accent text-sm font-semibold">
          Back to tournaments
        </Link>
      </div>
    );
  }

  const alreadyRegistered = userId !== null && teams.some((t) => t.captain_id === userId);
  const canRegister =
    tournament.status === "registration" &&
    teams.length < tournament.max_teams &&
    !alreadyRegistered;
  const isKnockout = tournament.format === "single_elimination";

  return (
    <div className="min-h-[100dvh] rondo-page pb-20">
      <header className="sticky top-0 rondo-glass-nav border-b border-white/5 z-40 px-4 py-3">
        <div className="flex items-center gap-2.5 max-w-lg mx-auto">
          <button type="button" onClick={() => router.back()} aria-label="Back">
            <ArrowLeft size={18} className="text-white/70" />
          </button>
          <h1 className="text-white font-black text-lg truncate">{tournament.name}</h1>
        </div>
      </header>

      <div className="px-4 py-5 space-y-6 max-w-lg mx-auto">
        <section className="rondo-surface p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Trophy size={15} className="text-rondo-accent" />
            <p className="text-white text-sm font-bold">
              {isKnockout ? "Knockout cup" : "League (round robin)"} · {tournament.team_size}-a-side
            </p>
          </div>
          <p className="flex items-center gap-1.5 text-white/60 text-xs">
            <CalendarDays size={12} className="text-white/30" />
            {formatGameDate(tournament.starts_at)}
          </p>
          {tournament.venue_name && (
            <p className="flex items-center gap-1.5 text-white/60 text-xs">
              <MapPin size={12} className="text-white/30" />
              {tournament.venue_name}
              {tournament.venue_address ? ` — ${tournament.venue_address}` : ""}
            </p>
          )}
          <p className="flex items-center gap-1.5 text-white/60 text-xs">
            <Users size={12} className="text-white/30" />
            {teams.length}/{tournament.max_teams} teams
            {tournament.entry_fee > 0 && ` · ${formatPrice(tournament.entry_fee)} entry per team`}
          </p>
          {tournament.description && (
            <p className="text-white/70 text-xs whitespace-pre-wrap pt-1">{tournament.description}</p>
          )}
        </section>

        {tournament.status === "registration" && (
          <section className="rondo-surface p-4 space-y-3">
            <h2 className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
              Register your team
            </h2>
            {alreadyRegistered ? (
              <p className="text-rondo-accent text-sm font-semibold">
                Your team is in — see you on matchday.
              </p>
            ) : !userId ? (
              <Link href="/login" className="rondo-btn rondo-btn-primary w-full">
                Log in to register
              </Link>
            ) : isGuest ? (
              <Link href="/signup" className="rondo-btn rondo-btn-primary w-full">
                Create an account to register
              </Link>
            ) : !canRegister ? (
              <p className="text-white/60 text-sm">This tournament is full.</p>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value.slice(0, 60))}
                  placeholder="Team name"
                  className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm placeholder:text-white/30 outline-none focus:border-rondo-accent/40"
                />
                <button
                  type="button"
                  onClick={registerTeam}
                  disabled={teamName.trim().length < 2 || registering}
                  className="rounded-lg bg-rondo-accent text-black px-4 py-2.5 text-sm font-bold disabled:opacity-40"
                >
                  {registering ? "…" : "Register"}
                </button>
              </div>
            )}
          </section>
        )}

        <section className="space-y-3">
          <h2 className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
            Teams ({teams.length})
          </h2>
          {teams.length === 0 ? (
            <div className="rondo-surface p-4">
              <p className="text-muted-foreground text-sm">No teams registered yet.</p>
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
          <section className="space-y-3">
            <h2 className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
              {isKnockout ? "Bracket" : "Standings"}
            </h2>
            {isKnockout ? (
              <BracketView matches={matches} teams={teams} />
            ) : (
              <>
                <StandingsTable matches={matches} teams={teams} />
                <h2 className="text-muted-foreground text-xs font-semibold uppercase tracking-wider pt-2">
                  Fixtures
                </h2>
                <div className="space-y-2">
                  {matches.map((match) => {
                    const home = teams.find((t) => t.id === match.home_team_id)?.name ?? "TBD";
                    const away = teams.find((t) => t.id === match.away_team_id)?.name ?? "TBD";
                    return (
                      <div
                        key={match.id}
                        className="flex items-center justify-between bg-card border border-border rounded-xl px-3 py-2.5 text-xs"
                      >
                        <span className="text-white/40 w-14 shrink-0">MD {match.round}</span>
                        <span className="text-white/85 font-semibold flex-1 text-right truncate">{home}</span>
                        <span className="text-rondo-accent font-bold px-3 tabular-nums">
                          {match.status === "completed"
                            ? `${match.home_score} - ${match.away_score}`
                            : "vs"}
                        </span>
                        <span className="text-white/85 font-semibold flex-1 truncate">{away}</span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
