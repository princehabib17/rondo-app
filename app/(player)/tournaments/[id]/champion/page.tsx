"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { ShareNetwork, SoccerBall, Trophy } from "@phosphor-icons/react";
import { toast } from "sonner";
import { gentle } from "@/components/motion/springs";
import { PageHeader } from "@/components/layout/PageHeader";
import { rankScorers } from "@/components/tournament/TopScorers";
import { createClient } from "@/lib/supabase/client";
import type { Tournament, TournamentGoal, TournamentMatch, TournamentTeam } from "@/lib/supabase/types";
import { computeStandings } from "@/lib/tournament/bracket";

export default function TournamentChampionPage() {
  const { id } = useParams<{ id: string }>();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [teams, setTeams] = useState<TournamentTeam[]>([]);
  const [matches, setMatches] = useState<TournamentMatch[]>([]);
  const [goals, setGoals] = useState<TournamentGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const reducedMotion = useReducedMotion();

  const load = useCallback(async () => {
    const supabase = createClient();
    const [{ data: t }, { data: teamRows }, { data: matchRows }, { data: goalRows }] = await Promise.all([
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
        .from("tournament_goals")
        .select("*, scorer:profiles(id, full_name, avatar_url)")
        .eq("tournament_id", id),
    ]);
    setTournament((t as Tournament) ?? null);
    setTeams((teamRows as TournamentTeam[]) ?? []);
    setMatches((matchRows as TournamentMatch[]) ?? []);
    setGoals((goalRows as TournamentGoal[]) ?? []);
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

  const goldenBoot = useMemo(() => rankScorers(goals, teams)[0] ?? null, [goals, teams]);
  const totalGoals = useMemo(
    () => matches.reduce((sum, match) => sum + (match.home_score ?? 0) + (match.away_score ?? 0), 0),
    [matches]
  );

  async function shareChampion() {
    const url = window.location.href;
    const title = champion ? `${champion.name} are champions of ${tournament?.name ?? "the cup"}` : "Rondo champion";
    if (navigator.share) {
      await navigator.share({ title, url }).catch(() => {});
      return;
    }
    try {
      await navigator.clipboard.writeText(`${title} ${url}`);
      toast.success("Link copied. Drop it in the group chat.");
    } catch {
      toast.error("Couldn't copy the link.");
    }
  }

  return (
    <div className="min-h-[100dvh] rondo-page">
      <PageHeader title={tournament?.name ?? "Champion"} back={`/tournaments/${id}`} />

      <main className="mx-auto max-w-lg">
        <section className="relative isolate overflow-hidden">
          <div className="relative aspect-[4/5] max-h-[72dvh] w-full">
            <Image
              src="/scenes/champion-trophy.jpg"
              alt=""
              fill
              priority
              sizes="(max-width: 512px) 100vw, 512px"
              className="object-cover object-[50%_35%]"
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-[linear-gradient(180deg,color-mix(in_oklch,var(--bg-night)_10%,transparent)_0%,transparent_35%,color-mix(in_oklch,var(--bg-page)_85%,transparent)_78%,var(--bg-page)_100%)]"
            />
          </div>
          <motion.div
            initial={reducedMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...gentle, delay: 0.15 }}
            className="relative -mt-40 px-4 text-center"
          >
            <p className="inline-flex items-center gap-2 rounded-[var(--r-pill)] bg-[var(--gold)] px-3 py-1 rondo-label text-[var(--gold-ink)]">
              <Trophy size={13} weight="fill" aria-hidden />
              Champions
            </p>
            <h2 className="mt-4 font-heading text-[3.5rem] font-bold uppercase leading-[0.9] tracking-[0.01em] text-[var(--ink-hi)] [overflow-wrap:anywhere] [text-wrap:balance]">
              {loading ? "\u00a0" : champion?.name ?? "To be decided"}
            </h2>
            <p className="mx-auto mt-3 max-w-xs rondo-body text-[var(--ink-mid)]">
              {loading ? "\u00a0" : champion?.line ?? "The trophy card unlocks when the final result is in."}
            </p>
            {tournament && (
              <p className="mt-1 rondo-meta text-[var(--ink-low)]">
                {tournament.name}
                {tournament.venue_name ? ` · ${tournament.venue_name}` : ""}
              </p>
            )}
          </motion.div>
        </section>

        <div className="space-y-6 px-4 pb-8 pt-8">
          <dl className="grid grid-cols-3 divide-x divide-[var(--stroke)] overflow-hidden rounded-[var(--r-md)] border border-[var(--stroke)] bg-[var(--bg-surface)]">
            {[
              { label: (champion?.wins ?? 0) === 1 ? "Win" : "Wins", value: champion?.wins ?? 0 },
              { label: "Goals", value: totalGoals },
              { label: "Teams", value: teams.length },
            ].map((stat) => (
              <div key={stat.label} className="px-4 py-3 text-center">
                <dd className="font-heading text-[2rem] font-bold leading-none tabular-nums text-[var(--ink-hi)]">{stat.value}</dd>
                <dt className="mt-1 rondo-label text-[var(--ink-low)]">{stat.label}</dt>
              </div>
            ))}
          </dl>

          {goldenBoot && (
            <div className="flex items-center gap-4 rounded-[var(--r-md)] border border-[color-mix(in_oklch,var(--gold)_35%,var(--stroke))] bg-[var(--gold-dim)] p-4">
              <span className="grid size-12 shrink-0 place-items-center rounded-[var(--r-pill)] bg-[var(--gold)] text-[var(--gold-ink)]">
                <SoccerBall size={24} weight="fill" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="rondo-label text-[var(--gold)]">Golden boot</p>
                <p className="truncate rondo-title text-[var(--ink-hi)]">{goldenBoot.name}</p>
                {goldenBoot.teamName && <p className="truncate rondo-meta text-[var(--ink-low)]">{goldenBoot.teamName}</p>}
              </div>
              <p className="shrink-0 text-right">
                <span className="block font-heading text-[2rem] font-bold leading-none tabular-nums text-[var(--ink-hi)]">
                  {goldenBoot.goals}
                </span>
                <span className="rondo-label text-[var(--ink-low)]">Goals</span>
              </p>
            </div>
          )}

          <div className="grid gap-3">
            <button type="button" onClick={shareChampion} className="rondo-btn rondo-btn-primary">
              <ShareNetwork size={18} weight="bold" aria-hidden />
              Share the trophy lift
            </button>
            <Link
              href={tournament?.format === "round_robin" ? `/tournaments/${id}#standings` : `/tournaments/${id}/bracket`}
              className="rondo-btn rondo-btn-secondary"
            >
              {tournament?.format === "round_robin" ? "Final table" : "Full bracket"}
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
