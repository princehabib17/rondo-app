"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Calendar, Megaphone, MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatGameDate, formatRelativeTime } from "@/lib/utils/format";
import type { Announcement, Game, Profile } from "@/lib/supabase/types";
import { getOrganizerInitials } from "@/lib/feed/organizers";

export default function OrganizerHubPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [organizer, setOrganizer] = useState<Profile | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [broadcasts, setBroadcasts] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const now = new Date().toISOString();

      const [{ data: profile }, { data: gamesData }, { data: announcementsData }] =
        await Promise.all([
          supabase.from("profiles").select("*").eq("id", id).single(),
          supabase
            .from("games")
            .select("*, game_players(id)")
            .eq("organizer_id", id)
            .eq("status", "open")
            .gte("date_time", now)
            .order("date_time", { ascending: true })
            .limit(10),
          supabase
            .from("announcements")
            .select("*")
            .eq("organizer_id", id)
            .order("created_at", { ascending: false })
            .limit(20),
        ]);

      if (!profile) {
        router.replace("/feed");
        return;
      }

      setOrganizer(profile as Profile);
      setGames((gamesData as Game[]) ?? []);
      setBroadcasts((announcementsData as Announcement[]) ?? []);
      setLoading(false);
    }

    load();
  }, [id, router]);

  if (loading || !organizer) {
    return (
      <div className="min-h-[100dvh] bg-black flex items-center justify-center">
        <div className="w-2 h-2 rounded-full bg-rondo-accent animate-ping" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-black pb-8">
      <header className="sticky top-0 z-10 bg-black/95 backdrop-blur-md border-b border-white/5 px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center text-white/80 hover:text-white"
            aria-label="Back"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-[#1c1c1c] border border-white/10 flex items-center justify-center shrink-0">
              <span className="font-heading text-white font-black text-sm">
                {getOrganizerInitials(organizer.full_name)}
              </span>
            </div>
            <div className="min-w-0">
              <h1 className="font-heading text-white font-black italic text-lg uppercase truncate">
                {organizer.full_name}
              </h1>
              <p className="font-body text-white/50 text-xs">Organizer group</p>
            </div>
          </div>
        </div>
      </header>

      <section className="px-4 pt-5">
        <div className="flex items-center gap-2 mb-3">
          <Megaphone size={15} className="text-rondo-accent" />
          <h2 className="font-heading text-white font-black italic text-sm uppercase">Broadcasts</h2>
        </div>

        {broadcasts.length === 0 ? (
          <p className="font-body text-white/40 text-sm bg-[#141414] border border-white/10 rounded-xl p-4">
            No broadcasts yet. Only the organizer can post updates here.
          </p>
        ) : (
          <div className="space-y-3">
            {broadcasts.map((item) => (
              <article
                key={item.id}
                className="bg-[#141414] border border-white/10 rounded-xl p-4"
              >
                <p className="font-body text-white/90 text-sm leading-relaxed">{item.body}</p>
                <p className="font-body text-white/40 text-xs mt-2">
                  {formatRelativeTime(item.created_at)}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="px-4 pt-6">
        <div className="flex items-center gap-2 mb-3">
          <Calendar size={15} className="text-rondo-accent" />
          <h2 className="font-heading text-white font-black italic text-sm uppercase">
            Upcoming Games
          </h2>
        </div>

        {games.length === 0 ? (
          <p className="font-body text-white/40 text-sm">No upcoming games from this organizer.</p>
        ) : (
          <div className="space-y-3">
            {games.map((game) => (
              <Link
                key={game.id}
                href={`/games/${game.id}`}
                className="block bg-[#141414] border border-white/10 rounded-xl p-4 hover:border-rondo-accent/30 transition-colors"
              >
                <h3 className="font-heading text-white font-black italic uppercase text-base mb-2">
                  {game.title}
                </h3>
                <div className="space-y-1 font-body text-white/50 text-xs">
                  <div className="flex items-center gap-2">
                    <Calendar size={12} />
                    <span>{formatGameDate(game.date_time)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={12} />
                    <span>{game.venue_name}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
