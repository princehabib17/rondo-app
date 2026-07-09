"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Fire, Shield, Trophy, Users } from "@phosphor-icons/react";
import { motion, useReducedMotion } from "motion/react";
import { createClient } from "@/lib/supabase/client";
import type { Tournament, TournamentStatus } from "@/lib/supabase/types";
import { TournamentCard, TournamentCardSkeleton } from "@/components/tournament/TournamentCard";
import { gentle } from "@/components/motion/springs";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/rondo/primitives";

const FILTERS: { value: TournamentStatus | "all"; label: string }[] = [
  { value: "all", label: "Nearby" },
  { value: "registration", label: "Open" },
  { value: "active", label: "Live" },
  { value: "completed", label: "Completed" },
];

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [filter, setFilter] = useState<TournamentStatus | "all">("all");
  const [loading, setLoading] = useState(true);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("tournaments")
        .select("*, tournament_teams(id, status)")
        .neq("status", "cancelled")
        .order("starts_at", { ascending: true })
        .limit(50);
      setTournaments((data as Tournament[]) ?? []);
      setLoading(false);
    }
    load();
  }, []);

  const visible = filter === "all" ? tournaments : tournaments.filter((t) => t.status === filter);
  const countFor = (value: TournamentStatus | "all") =>
    value === "all" ? tournaments.length : tournaments.filter((t) => t.status === value).length;
  const openCount = countFor("registration");
  const liveCount = countFor("active");

  return (
    <div className="min-h-[100dvh] rondo-page pb-24">
      <header className="sticky top-0 z-40 border-b border-[var(--stroke)] rondo-glass-nav px-4 py-3">
        <div className="mx-auto flex h-12 max-w-lg items-center gap-2">
          <Trophy size={20} weight="duotone" className="text-[var(--gold)]" aria-hidden />
          <div>
            <p className="rondo-label text-[var(--ink-low)]">Matchday shelf</p>
            <h1 className="rondo-title text-[var(--ink-hi)]">Tournaments</h1>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-lg space-y-6 px-4 py-6">
        <section className="relative overflow-hidden rounded-[var(--r-lg)] border border-[var(--stroke)] rondo-floodlight-scene rondo-floodlight-scene--gold p-5">
          <div className="absolute inset-0 rondo-map-shell opacity-20 mix-blend-screen" />
          <div className="relative space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="rondo-label text-[var(--gold)]">City bracket board</p>
                <h2 className="mt-2 max-w-[15rem] font-heading text-[3.25rem] font-black uppercase leading-[0.82] tracking-[-0.035em] text-[var(--ink-hi)]">
                  Run the table
                </h2>
              </div>
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full border border-[color-mix(in_oklch,var(--gold)_32%,var(--stroke))] bg-[var(--gold-dim)]">
                <Trophy size={28} weight="duotone" className="text-[var(--gold)]" aria-hidden />
              </div>
            </div>
            <p className="max-w-[20rem] rondo-body text-[var(--ink-mid)]">
              Join open brackets, follow live scores, and carry the win into the room.
            </p>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-[var(--r-md)] border border-[var(--stroke)] bg-[color-mix(in_oklch,var(--bg-page)_64%,transparent)] p-3">
                <Fire size={18} weight="duotone" className="mb-3 text-[var(--gold)]" aria-hidden />
                <p className="rondo-title text-[var(--ink-hi)]">{liveCount}</p>
                <p className="rondo-meta text-[var(--ink-low)]">Live</p>
              </div>
              <div className="rounded-[var(--r-md)] border border-[var(--stroke)] bg-[color-mix(in_oklch,var(--bg-page)_64%,transparent)] p-3">
                <Users size={18} weight="duotone" className="mb-3 text-[var(--gold)]" aria-hidden />
                <p className="rondo-title text-[var(--ink-hi)]">{openCount}</p>
                <p className="rondo-meta text-[var(--ink-low)]">Open</p>
              </div>
              <div className="rounded-[var(--r-md)] border border-[var(--stroke)] bg-[color-mix(in_oklch,var(--bg-page)_64%,transparent)] p-3">
                <Shield size={18} weight="duotone" className="mb-3 text-[var(--gold)]" aria-hidden />
                <p className="rondo-title text-[var(--ink-hi)]">{tournaments.length}</p>
                <p className="rondo-meta text-[var(--ink-low)]">Total</p>
              </div>
            </div>
          </div>
        </section>

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
          <div className="overflow-hidden rounded-[var(--r-md)] border border-[var(--stroke)] rondo-floodlight-scene">
            <EmptyState
              title={filter === "all" ? "No tournaments here yet" : "Nothing in this lane"}
              body={
                filter === "all"
                  ? "Start one, fill the bracket, and give the city something to chase."
                  : "Switch filters or find games happening nearby."
              }
              action={
                <Link href="/feed" className="rondo-btn rondo-btn-primary">
                Explore matches
              </Link>
              }
            />
          </div>
        ) : (
          <div className="space-y-3">
            {visible.map((tournament, index) => (
              <motion.div
                key={tournament.id}
                initial={reducedMotion ? undefined : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...gentle, delay: Math.min(index, 5) * 0.05 }}
              >
                <TournamentCard tournament={tournament} href={`/tournaments/${tournament.id}`} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
