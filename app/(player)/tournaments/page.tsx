"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Trophy } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { createClient } from "@/lib/supabase/client";
import type { Tournament, TournamentStatus } from "@/lib/supabase/types";
import { TournamentCard, TournamentCardSkeleton } from "@/components/tournament/TournamentCard";
import { gentle } from "@/components/motion/springs";
import { cn } from "@/lib/utils";

const FILTERS: { value: TournamentStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "registration", label: "Open" },
  { value: "active", label: "Live" },
  { value: "completed", label: "Done" },
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

  return (
    <div className="min-h-[100dvh] rondo-page pb-20">
      <header className="sticky top-0 z-40 border-b border-white/5 rondo-glass-nav px-4 py-3">
        <div className="mx-auto flex max-w-lg items-center gap-2.5">
          <Trophy size={18} className="text-rondo-accent" />
          <h1 className="text-lg font-black text-white">Tournaments</h1>
        </div>
      </header>

      <div className="mx-auto max-w-lg space-y-4 px-4 py-5">
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
                <span className={cn("tabular-nums", filter === value ? "text-rondo-accent/70" : "text-white/35")}>
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
          <div className="overflow-hidden rounded-2xl border border-white/10">
            <div className="relative flex flex-col items-center gap-3 rondo-floodlight-scene px-6 py-12 text-center">
              <Trophy size={40} strokeWidth={1.25} className="text-white/25" />
              <p className="font-heading text-base font-black uppercase italic text-white">
                {filter === "all" ? "No tournaments yet" : "Nothing here right now"}
              </p>
              <p className="max-w-[240px] text-xs text-white/50">
                {filter === "all"
                  ? "Organizers can launch knockout cups and leagues — check back soon."
                  : "Try another filter, or explore matches happening nearby."}
              </p>
              <Link href="/feed" className="rondo-btn rondo-btn-primary mt-1">
                Explore matches
              </Link>
            </div>
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
