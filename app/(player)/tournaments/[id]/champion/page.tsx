"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ShareNetwork, Trophy } from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import type { Tournament, TournamentMatch, TournamentTeam } from "@/lib/supabase/types";
import { computeStandings } from "@/lib/tournament/bracket";
import { StatTile } from "@/components/rondo/primitives";

export default function TournamentChampionPage() {
  const { id } = useParams<{ id: string }>();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [teams, setTeams] = useState<TournamentTeam[]>([]);
  const [matches, setMatches] = useState<TournamentMatch[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
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
    setTournament((t as Tournament) ?? null);
    setTeams((teamRows as TournamentTeam[]) ?? []);
    setMatches((matchRows as TournamentMatch[]) ?? []);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const champion = useMemo(() => {
    if (!tournament) return null;
    if (tournament.format === "single_elimination") {
      const finalRound = matches.length ? Math.max(...matches.map((match) => match.round)) : 0;
      const final = matches.find((match) => match.round === finalRound && match.status === "completed");
      if (!final || final.home_score == null || final.away_score == null) return null;
      const winnerId = final.home_score > final.away_score ? final.home_team_id : final.away_team_id;
      const winner = teams.find((team) => team.id === winnerId);
      if (!winner) return null;
      return {
        name: winner.name,
        line: `${final.home_score} - ${final.away_score} in the final`,
        wins: matches.filter((match) => {
          if (match.status !== "completed" || match.home_score == null || match.away_score == null) return false;
          return (
            (match.home_team_id === winner.id && match.home_score > match.away_score) ||
            (match.away_team_id === winner.id && match.away_score > match.home_score)
          );
        }).length,
      };
    }
    const standings = computeStandings(teams.map((team) => team.id), matches);
    const top = standings[0];
    const winner = top ? teams.find((team) => team.id === top.teamId) : null;
    if (!winner || !top) return null;
    return {
      name: winner.name,
      line: `${top.points} pts. ${top.goalsFor} goals for.`,
      wins: top.won,
    };
  }, [matches, teams, tournament]);

  async function shareChampion() {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: champion ? `${champion.name} are champions` : "Rondo champion", url }).catch(() => {});
      return;
    }
    await navigator.clipboard.writeText(url).catch(() => {});
  }

  return (
    <div className="min-h-[100dvh] rondo-page">
      <header className="sticky top-0 z-40 border-b border-[var(--stroke)] rondo-glass-nav px-4 py-3">
        <div className="mx-auto flex h-12 max-w-lg items-center gap-3">
          <Link href={`/tournaments/${id}`} aria-label="Back to tournament" className="grid min-h-11 min-w-11 place-items-center rounded-[var(--r-pill)] text-[var(--ink-mid)]">
            <ArrowLeft size={20} />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="rondo-label text-[var(--gold)]">Trophy lift</p>
            <h1 className="truncate rondo-title text-[var(--ink-hi)]">{tournament?.name ?? "Champion"}</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-6">
        <section className="overflow-hidden rounded-[var(--r-lg)] border border-[var(--gold)] rondo-floodlight-scene--gold">
          <div className="px-4 py-12 text-center">
            <div className="mx-auto grid size-20 place-items-center rounded-[var(--r-pill)] bg-[var(--gold)] text-[var(--gold-ink)]">
              <Trophy size={42} weight="duotone" />
            </div>
            <p className="mt-6 rondo-label text-[var(--gold)]">Champions</p>
            <h2 className="mt-2 font-heading text-[3.5rem] font-bold uppercase leading-none text-[var(--ink-hi)]">
              {loading ? "Loading" : champion?.name ?? "Pending"}
            </h2>
            <p className="mx-auto mt-3 max-w-xs rondo-body text-[var(--ink-mid)]">
              {champion?.line ?? "The champion card unlocks when the final result is recorded."}
            </p>
          </div>
        </section>

        <div className="mt-6 grid grid-cols-3 gap-3">
          <StatTile label="Wins" value={champion?.wins ?? 0} size="sm" />
          <StatTile label="Teams" value={teams.length} size="sm" />
          <StatTile label="Matches" value={matches.length} size="sm" />
        </div>

        <div className="mt-6 grid gap-3">
          <button type="button" onClick={shareChampion} className="rondo-btn rondo-btn-primary">
            <ShareNetwork size={18} weight="bold" />
            Share champion
          </button>
          <Link href={`/tournaments/${id}/bracket`} className="rondo-btn rondo-btn-secondary">
            View bracket
          </Link>
        </div>
      </main>
    </div>
  );
}
