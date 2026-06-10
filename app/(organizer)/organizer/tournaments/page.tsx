"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trophy } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Tournament } from "@/lib/supabase/types";
import { TournamentCard } from "@/components/tournament/TournamentCard";

export default function OrganizerTournamentsPage() {
  const router = useRouter();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
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
      setTournaments((data as Tournament[]) ?? []);
      setLoading(false);
    }
    load();
  }, [router]);

  return (
    <div className="min-h-[100dvh] rondo-page pb-20">
      <header className="sticky top-0 rondo-glass-nav border-b border-white/5 z-40 px-4 py-3">
        <div className="flex items-center justify-between gap-2 max-w-lg mx-auto">
          <div className="flex items-center gap-2.5">
            <button type="button" onClick={() => router.push("/organizer/dashboard")} aria-label="Back">
              <ArrowLeft size={18} className="text-white/70" />
            </button>
            <Trophy size={18} className="text-rondo-accent" />
            <h1 className="text-white font-black text-lg">My Tournaments</h1>
          </div>
          <Link
            href="/organizer/tournaments/create"
            className="inline-flex items-center gap-1 rounded-full bg-rondo-accent text-black px-3 py-1.5 text-xs font-bold"
          >
            <Plus size={13} />
            New
          </Link>
        </div>
      </header>

      <div className="px-4 py-5 space-y-3 max-w-lg mx-auto">
        {loading ? (
          [0, 1].map((i) => (
            <div key={i} className="h-28 bg-card border border-border rounded-xl animate-pulse" />
          ))
        ) : tournaments.length === 0 ? (
          <div className="rondo-surface p-6 text-center space-y-3">
            <p className="text-white/70 text-sm font-semibold">No tournaments yet</p>
            <p className="text-muted-foreground text-xs">
              Launch a knockout cup or a league and let teams register.
            </p>
            <Link
              href="/organizer/tournaments/create"
              className="inline-flex items-center gap-1.5 rounded-full bg-rondo-accent text-black px-4 py-2 text-xs font-bold"
            >
              <Plus size={13} />
              Create tournament
            </Link>
          </div>
        ) : (
          tournaments.map((tournament) => (
            <TournamentCard
              key={tournament.id}
              tournament={tournament}
              href={`/organizer/tournaments/${tournament.id}/manage`}
            />
          ))
        )}
      </div>
    </div>
  );
}
