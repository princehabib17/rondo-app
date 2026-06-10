"use client";

import { useEffect, useState } from "react";
import { Trophy } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Tournament, TournamentStatus } from "@/lib/supabase/types";
import { TournamentCard } from "@/components/tournament/TournamentCard";
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

  const visible =
    filter === "all" ? tournaments : tournaments.filter((t) => t.status === filter);

  return (
    <div className="min-h-[100dvh] rondo-page pb-20">
      <header className="sticky top-0 rondo-glass-nav border-b border-white/5 z-40 px-4 py-3">
        <div className="flex items-center gap-2.5 max-w-lg mx-auto">
          <Trophy size={18} className="text-rondo-accent" />
          <h1 className="text-white font-black text-lg">Tournaments</h1>
        </div>
      </header>

      <div className="px-4 py-5 space-y-4 max-w-lg mx-auto">
        <div className="flex gap-2">
          {FILTERS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors",
                filter === value
                  ? "border-rondo-accent/60 bg-rondo-accent/15 text-rondo-accent"
                  : "border-white/10 text-white/40"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-28 bg-card border border-border rounded-xl animate-pulse" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="rondo-surface p-6 text-center space-y-1">
            <p className="text-white/70 text-sm font-semibold">No tournaments yet</p>
            <p className="text-muted-foreground text-xs">
              Organizers can launch knockout cups and leagues — check back soon.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {visible.map((tournament) => (
              <TournamentCard
                key={tournament.id}
                tournament={tournament}
                href={`/tournaments/${tournament.id}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
