"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { createClient } from "@/lib/supabase/client";
import { withAuthTimeout } from "@/lib/auth/auth-timeout";
import type { Tournament, TournamentStatus } from "@/lib/supabase/types";
import { TournamentCard, TournamentCardSkeleton } from "@/components/tournament/TournamentCard";
import { fetchTournamentChampions, type ChampionSummary } from "@/lib/tournament/champions";
import { fetchTournamentLiveSummaries } from "@/lib/tournament/liveSummary";
import type { LiveSummary } from "@/lib/tournament/bracket";
import { gentle } from "@/components/motion/springs";
import { cn } from "@/lib/utils";
import { EmptyState, RondoButton } from "@/components/rondo/primitives";
import { PageHeader } from "@/components/layout/PageHeader";
import { MatchesSwitcher } from "@/components/layout/MatchesSwitcher";

const FILTERS: { value: TournamentStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "registration", label: "Open" },
  { value: "active", label: "Live" },
  { value: "completed", label: "Completed" },
];

/** Live and open brackets lead the list; finished cups sink to the bottom,
 * most recent first — a month-old result shouldn't outrank today's match. */
const STATUS_PRIORITY: Record<TournamentStatus, number> = {
  active: 0,
  registration: 1,
  completed: 2,
  cancelled: 3,
};

function sortForDisplay(tournaments: Tournament[]): Tournament[] {
  return [...tournaments].sort((a, b) => {
    const priorityDiff = STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status];
    if (priorityDiff !== 0) return priorityDiff;
    const aTime = new Date(a.starts_at).getTime();
    const bTime = new Date(b.starts_at).getTime();
    return a.status === "completed" ? bTime - aTime : aTime - bTime;
  });
}

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [champions, setChampions] = useState<Map<string, ChampionSummary>>(new Map());
  const [liveSummaries, setLiveSummaries] = useState<Map<string, LiveSummary>>(new Map());
  const [filter, setFilter] = useState<TournamentStatus | "all">("all");
  const [loading, setLoading] = useState(true);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      try {
        const { data } = await withAuthTimeout(
          supabase
            .from("tournaments")
            .select("*, tournament_teams(id, status)")
            .neq("status", "cancelled")
            .order("starts_at", { ascending: true })
            .limit(50)
        );
        const rows = sortForDisplay((data as Tournament[]) ?? []);
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
      } catch {
        setTournaments([]);
        setLoading(false);
      }
    }
    load();
  }, []);

  const visible = filter === "all" ? tournaments : tournaments.filter((t) => t.status === filter);
  const countFor = (value: TournamentStatus | "all") =>
    value === "all" ? tournaments.length : tournaments.filter((t) => t.status === value).length;
  const openCount = countFor("registration");
  const liveCount = countFor("active");

  return (
    <div className="min-h-[100dvh] rondo-page">
      <PageHeader title="Matches">
        <MatchesSwitcher />
      </PageHeader>

      <div className="mx-auto max-w-lg space-y-6 px-4 py-6">
        {!loading && liveCount + openCount > 0 && (
          <p className="flex items-center gap-2 rondo-meta text-[var(--ink-mid)]">
            {liveCount > 0 && (
              <span className="inline-flex items-center gap-2 font-bold text-[var(--ink-hi)]">
                <span className="rondo-live-dot" aria-hidden />
                {liveCount} live now
              </span>
            )}
            {liveCount > 0 && openCount > 0 && <span aria-hidden>·</span>}
            {openCount > 0 && <span>{openCount} taking teams</span>}
          </p>
        )}

        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
          {FILTERS.map(({ value, label }) => {
            const count = countFor(value);
            return (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                data-active={filter === value}
                className="rondo-chip shrink-0"
              >
                {label}
                <span className={cn("tabular-nums", filter === value ? "text-[var(--gold)]" : "text-[var(--ink-low)]")}>
                  · {count}
                </span>
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <TournamentCardSkeleton key={i} />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <EmptyState
            imageSrc="/scenes/center-spot.jpg"
            title={filter === "all" ? "No tournaments yet" : "Nothing in this lane"}
            body={
              filter === "all"
                ? "When organizers open a bracket near you, it shows up here. Pickup matches run every night."
                : "Try another filter, or play a pickup match while you wait."
            }
            action={<RondoButton href="/feed">Find a pickup match</RondoButton>}
            className="py-8"
          />
        ) : (
          <div className="space-y-3">
            {visible.map((tournament, index) => (
              <motion.div
                key={tournament.id}
                initial={reducedMotion ? undefined : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...gentle, delay: Math.min(index, 5) * 0.05 }}
              >
                <TournamentCard
                  tournament={tournament}
                  href={`/tournaments/${tournament.id}`}
                  champion={champions.get(tournament.id) ?? null}
                  liveSummary={liveSummaries.get(tournament.id) ?? null}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
