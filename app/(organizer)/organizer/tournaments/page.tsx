"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trophy } from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import type { Tournament } from "@/lib/supabase/types";
import { TournamentCard } from "@/components/tournament/TournamentCard";
import { fetchTournamentChampions, type ChampionSummary } from "@/lib/tournament/champions";
import { fetchTournamentLiveSummaries } from "@/lib/tournament/liveSummary";
import type { LiveSummary } from "@/lib/tournament/bracket";
import { EmptyState, StatTile } from "@/components/rondo/primitives";

export default function OrganizerTournamentsPage() {
  const router = useRouter();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [champions, setChampions] = useState<Map<string, ChampionSummary>>(new Map());
  const [liveSummaries, setLiveSummaries] = useState<Map<string, LiveSummary>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        router.push("/login");
        return;
      }
      const { data } = await supabase
        .from("tournaments")
        .select("*, tournament_teams(id, status)")
        .eq("organizer_id", userData.user.id)
        .order("created_at", { ascending: false });
      const rows = (data as Tournament[]) ?? [];
      setTournaments(rows);
      setLoading(false);
      const completed = rows.filter((t) => t.status === "completed");
      if (completed.length > 0) {
        setChampions(await fetchTournamentChampions(supabase, completed));
      }
      const active = rows.filter((t) => t.status === "active");
      if (active.length > 0) {
        const teamCounts = new Map(
          active.map((t) => [t.id, t.tournament_teams?.filter((tm) => tm.status === "registered").length ?? 0])
        );
        setLiveSummaries(await fetchTournamentLiveSummaries(supabase, active, teamCounts));
      }
    }
    load();
  }, [router]);

  const teamTotal = tournaments.reduce(
    (sum, tournament) =>
      sum + (tournament.tournament_teams?.filter((team) => team.status === "registered").length ?? 0),
    0
  );

  return (
    <div className="min-h-[100dvh] rondo-page pb-24">
      <header className="sticky top-0 rondo-glass-nav border-b border-[var(--stroke)] z-40 px-4 py-3">
        <div className="flex h-12 items-center gap-2 max-w-lg mx-auto">
          <button
            type="button"
            onClick={() => router.push("/organizer/dashboard")}
            aria-label="Back"
            className="flex min-h-11 min-w-11 items-center justify-center rounded-[var(--r-pill)] text-[var(--ink-mid)]"
          >
            <ArrowLeft size={18} />
          </button>
          <Trophy size={20} weight="duotone" className="text-[var(--gold)]" />
          <h1 className="rondo-title text-[var(--ink-hi)]">My tournaments</h1>
        </div>
      </header>

      <div className="px-4 py-6 space-y-6 max-w-lg mx-auto">
        {/* Single, prominent primary action for this screen. */}
        <Link
          href="/organizer/tournaments/create"
          className="rondo-btn rondo-btn-primary min-h-12"
        >
          <Plus size={18} weight="bold" />
          New tournament
        </Link>

        <section className="grid grid-cols-2 gap-3">
          <StatTile label="Tournaments" value={loading ? "..." : tournaments.length} size="sm" />
          <StatTile label="Teams" value={loading ? "..." : teamTotal} size="sm" />
        </section>

        {loading ? (
          <div className="space-y-3">
            {[0, 1].map((i) => (
              <div key={i} className="h-36 animate-pulse rounded-[var(--r-md)] border border-[var(--stroke)] bg-[var(--bg-surface)]" />
            ))}
          </div>
        ) : tournaments.length === 0 ? (
          <EmptyState
            title="No tournaments yet"
            body="Tap New tournament above to build a knockout cup or league with its own registration page."
          />
        ) : (
          <div className="space-y-3">
            {tournaments.map((tournament) => (
              <TournamentCard
                key={tournament.id}
                tournament={tournament}
                href={`/organizer/tournaments/${tournament.id}/manage`}
                champion={champions.get(tournament.id) ?? null}
                liveSummary={liveSummaries.get(tournament.id) ?? null}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
