"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trophy, Users } from "lucide-react";
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

  const teamTotal = tournaments.reduce(
    (sum, tournament) =>
      sum + (tournament.tournament_teams?.filter((team) => team.status === "registered").length ?? 0),
    0
  );

  return (
    <div className="min-h-[100dvh] rondo-page pb-20">
      <header className="sticky top-0 rondo-glass-nav border-b border-white/5 z-40 px-4 py-3">
        <div className="flex items-center gap-2.5 max-w-lg mx-auto">
          <button
            type="button"
            onClick={() => router.push("/organizer/dashboard")}
            aria-label="Back"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center -ml-2.5 rounded-full text-white/70"
          >
            <ArrowLeft size={18} />
          </button>
          <Trophy size={18} className="text-white/50" />
          <h1 className="rondo-hero-title text-xl text-white">My Tournaments</h1>
        </div>
      </header>

      <div className="px-4 py-5 space-y-5 max-w-lg mx-auto">
        {/* Single, prominent primary action for this screen. */}
        <Link
          href="/organizer/tournaments/create"
          className="rondo-btn rondo-btn-primary min-h-[56px] text-sm"
        >
          <Plus size={17} strokeWidth={2.75} />
          New tournament
        </Link>

        <section className="grid grid-cols-2 gap-2.5">
          <div className="rondo-surface p-3.5">
            <Trophy size={14} className="mb-1.5 text-white/35" />
            <p className="font-heading text-xl font-black uppercase italic text-white tabular-nums">
              {loading ? "—" : tournaments.length}
            </p>
            <p className="text-[10px] uppercase tracking-wider text-white/40">Tournaments</p>
          </div>
          <div className="rondo-surface p-3.5">
            <Users size={14} className="mb-1.5 text-white/35" />
            <p className="font-heading text-xl font-black uppercase italic text-white tabular-nums">
              {loading ? "—" : teamTotal}
            </p>
            <p className="text-[10px] uppercase tracking-wider text-white/40">Teams</p>
          </div>
        </section>

        {loading ? (
          <div className="space-y-3">
            {[0, 1].map((i) => (
              <div key={i} className="h-36 animate-pulse rounded-2xl border border-white/10 bg-white/[0.04]" />
            ))}
          </div>
        ) : tournaments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/14 bg-white/[0.025] p-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/8">
              <Trophy size={24} className="text-white/45" />
            </div>
            <p className="font-heading text-lg font-black uppercase italic text-white">No tournaments yet</p>
            <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">
              Tap &ldquo;New tournament&rdquo; above to build a knockout cup or a league with its own
              registration page.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {tournaments.map((tournament) => (
              <TournamentCard
                key={tournament.id}
                tournament={tournament}
                href={`/organizer/tournaments/${tournament.id}/manage`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
