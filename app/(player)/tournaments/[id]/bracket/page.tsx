"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ShareNetwork } from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import { subscribeToTournament } from "@/lib/realtime";
import type { Tournament, TournamentMatch, TournamentTeam } from "@/lib/supabase/types";
import { BracketView } from "@/components/tournament/BracketView";

export default function TournamentBracketPage() {
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

  useEffect(() => subscribeToTournament(id, load), [id, load]);

  async function shareBracket() {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: tournament?.name ?? "Rondo bracket", url }).catch(() => {});
      return;
    }
    await navigator.clipboard.writeText(url).catch(() => {});
  }

  return (
    <div className="min-h-[100dvh] rondo-page">
      <header className="sticky top-0 z-40 border-b border-[var(--stroke)] rondo-glass-nav px-4 py-3">
        <div className="mx-auto flex h-12 max-w-6xl items-center gap-3">
          <Link
            href={`/tournaments/${id}`}
            aria-label="Back to tournament"
            className="grid min-h-11 min-w-11 place-items-center rounded-[var(--r-pill)] text-[var(--ink-mid)]"
          >
            <ArrowLeft size={20} />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="rondo-label text-[var(--gold)]">Full bracket</p>
            <h1 className="truncate rondo-title text-[var(--ink-hi)]">
              {tournament?.name ?? "Tournament bracket"}
            </h1>
          </div>
          <button
            type="button"
            onClick={shareBracket}
            className="grid min-h-11 min-w-11 place-items-center rounded-[var(--r-pill)] bg-[var(--gold)] text-[var(--gold-ink)]"
            aria-label="Share bracket"
          >
            <ShareNetwork size={20} weight="bold" />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="rounded-[var(--r-lg)] border border-[var(--stroke)] bg-[var(--bg-surface)] p-4">
          {loading ? (
            <div className="h-72 rounded-[var(--r-md)] rondo-shimmer" />
          ) : matches.length === 0 ? (
            <div className="py-12 text-center">
              <p className="rondo-title text-[var(--ink-hi)]">Bracket opens after the draw</p>
              <p className="mt-2 rondo-meta text-[var(--ink-low)]">
                Start the tournament to lock teams into the bracket.
              </p>
            </div>
          ) : (
            <BracketView matches={matches} teams={teams} />
          )}
        </div>
      </main>
    </div>
  );
}
