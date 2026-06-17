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

      <div className="px-4 py-5 space-y-4 max-w-lg mx-auto">
        <section className="overflow-hidden rounded-2xl border border-rondo-accent/20 bg-rondo-accent/10 p-5">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-rondo-accent">
            Tournament studio
          </p>
          <h2 className="mt-2 font-heading text-3xl font-black uppercase italic leading-none text-white">
            Build brackets teams can see.
          </h2>
          <p className="mt-2 text-sm leading-5 text-white/55">
            Separate from one-off games: set the cover, registration window, team size, fee, venue, and bracket format.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-black/25 p-3">
              <Trophy size={15} className="mb-1 text-rondo-accent" />
              <p className="font-heading text-xl font-black uppercase italic text-white">
                {loading ? "--" : tournaments.length}
              </p>
              <p className="text-[10px] uppercase tracking-wider text-white/40">Tournaments</p>
            </div>
            <div className="rounded-xl bg-black/25 p-3">
              <Users size={15} className="mb-1 text-rondo-accent" />
              <p className="font-heading text-xl font-black uppercase italic text-white">
                {loading
                  ? "--"
                  : tournaments.reduce(
                      (sum, tournament) =>
                        sum + (tournament.tournament_teams?.filter((team) => team.status === "registered").length ?? 0),
                      0
                    )}
              </p>
              <p className="text-[10px] uppercase tracking-wider text-white/40">Teams</p>
            </div>
          </div>
        </section>

        {loading ? (
          [0, 1].map((i) => (
            <div key={i} className="h-36 animate-pulse rounded-2xl border border-white/10 bg-white/[0.04]" />
          ))
        ) : tournaments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/14 bg-white/[0.025] p-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/8">
              <Trophy size={24} className="text-white/45" />
            </div>
            <p className="font-heading text-lg font-black uppercase italic text-white">No tournaments yet</p>
            <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">
              Launch a knockout cup or a league with a dedicated registration page.
            </p>
            <Link
              href="/organizer/tournaments/create"
              className="mt-5 inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-rondo-accent px-4 text-xs font-black uppercase tracking-wider text-black"
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
