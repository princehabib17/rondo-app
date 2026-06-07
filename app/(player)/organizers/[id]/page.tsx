"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Calendar, Megaphone, MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatGameDate, formatRelativeTime } from "@/lib/utils/format";
import type { Announcement, Game, Profile } from "@/lib/supabase/types";
import { getOrganizerInitials, PLACEHOLDER_ORGANIZERS } from "@/lib/feed/organizers";

type BroadcastCategory = "general" | "game_on" | "cancelled" | "rules" | "tournament_notice";

interface OrganizerBroadcast {
  id: string;
  organizer_id: string | null;
  organizer_key: string;
  body: string;
  category: BroadcastCategory;
  created_at: string;
}

const CATEGORY_LABEL: Record<BroadcastCategory, string> = {
  general: "General",
  game_on: "Game On",
  cancelled: "Cancelled",
  rules: "Rules",
  tournament_notice: "Tournament",
};

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export default function OrganizerHubPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [organizer, setOrganizer] = useState<Profile | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [broadcasts, setBroadcasts] = useState<OrganizerBroadcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [newBody, setNewBody] = useState("");
  const [newCategory, setNewCategory] = useState<BroadcastCategory>("general");
  const [sending, setSending] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);
  const [isPlaceholder, setIsPlaceholder] = useState(false);

  async function loadHub() {
    const supabase = createClient();
    const now = new Date().toISOString();
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id ?? null;
    setCurrentUserId(uid);

    const isRealOrganizerId = isUuid(id);
    let profile: Profile | null = null;

    if (isRealOrganizerId) {
      const { data } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
      profile = (data as Profile | null) ?? null;
    }

    if (!profile) {
      const placeholder = PLACEHOLDER_ORGANIZERS.find((entry) => entry.id === id);
      if (!placeholder) {
        router.replace("/feed");
        return;
      }
      setIsPlaceholder(true);
      profile = {
        id: id,
        email: null,
        full_name: placeholder.full_name,
        avatar_url: placeholder.avatar_url ?? null,
        role: "organizer",
        bio: null,
        nationality: null,
        position: null,
        preferred_foot: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    } else {
      setIsPlaceholder(false);
    }

    const [{ data: gamesData }, { data: organizerBroadcasts }, { data: legacyAnnouncements }] =
      await Promise.all([
        supabase
          .from("games")
          .select("*, game_players(id)")
          .eq("organizer_id", profile.id)
          .eq("status", "open")
          .gte("date_time", now)
          .order("date_time", { ascending: true })
          .limit(10),
        isRealOrganizerId
          ? supabase
              .from("organizer_broadcasts")
              .select("*")
              .or(`organizer_key.eq.${id},organizer_id.eq.${id}`)
              .order("created_at", { ascending: false })
              .limit(50)
          : supabase
              .from("organizer_broadcasts")
              .select("*")
              .eq("organizer_key", id)
              .order("created_at", { ascending: false })
              .limit(50),
        supabase
          .from("announcements")
          .select("*")
          .eq("organizer_id", profile.id)
          .order("created_at", { ascending: false })
          .limit(20),
      ]);

    const normalizedBroadcasts =
      ((organizerBroadcasts as OrganizerBroadcast[] | null) ?? []).length > 0
        ? ((organizerBroadcasts as OrganizerBroadcast[] | null) ?? [])
        : ((legacyAnnouncements as Announcement[] | null) ?? []).map((item) => ({
            id: item.id,
            organizer_id: item.organizer_id,
            organizer_key: id,
            body: item.body,
            category: "general" as const,
            created_at: item.created_at,
          }));

    setOrganizer(profile);
    setGames((gamesData as Game[]) ?? []);
    setBroadcasts(normalizedBroadcasts);
    setLoading(false);
  }

  useEffect(() => {
    loadHub();
  }, [id, router]);

  async function handleBroadcastSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!organizer || !currentUserId || currentUserId !== organizer.id) return;
    if (!newBody.trim()) return;

    setSending(true);
    setPostError(null);
    const supabase = createClient();
    const { error } = await supabase.from("organizer_broadcasts").insert({
      organizer_id: organizer.id,
      organizer_key: id,
      body: newBody.trim(),
      category: newCategory,
    });

    if (error) {
      setPostError(error.message);
      setSending(false);
      return;
    }

    setNewBody("");
    setNewCategory("general");
    setSending(false);
    await loadHub();
  }

  if (loading || !organizer) {
    return (
      <div className="min-h-[100dvh] bg-black flex items-center justify-center">
        <div className="w-2 h-2 rounded-full bg-rondo-accent animate-ping" />
      </div>
    );
  }

  const canBroadcast = !isPlaceholder && currentUserId === organizer.id;

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
        {canBroadcast && (
          <form onSubmit={handleBroadcastSubmit} className="mb-4 bg-[#141414] border border-white/10 rounded-xl p-4 space-y-3">
            <h3 className="font-heading text-white text-sm font-black uppercase">Post Broadcast</h3>
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value as BroadcastCategory)}
              className="w-full bg-black border border-white/10 text-white rounded-lg px-3 py-2 text-sm"
            >
              <option value="general">General</option>
              <option value="game_on">Game On</option>
              <option value="cancelled">Cancelled</option>
              <option value="rules">Rules</option>
              <option value="tournament_notice">Tournament Notice</option>
            </select>
            <textarea
              value={newBody}
              onChange={(e) => setNewBody(e.target.value)}
              maxLength={500}
              placeholder="Share updates with your players..."
              className="w-full h-24 bg-black border border-white/10 text-white rounded-lg p-3 text-sm resize-none"
            />
            {postError && <p className="text-red-400 text-xs">{postError}</p>}
            <button
              type="submit"
              disabled={sending || !newBody.trim()}
              className="w-full bg-rondo-accent text-black font-heading font-black uppercase tracking-widest text-xs py-3 rounded-lg disabled:opacity-50"
            >
              {sending ? "Posting..." : "Post Broadcast"}
            </button>
          </form>
        )}

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
                <p className="font-heading text-rondo-accent text-[10px] uppercase tracking-wider mb-1">
                  {CATEGORY_LABEL[item.category]}
                </p>
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

      <section className="px-4 pt-6 pb-8">
        <div className="flex items-center gap-2 mb-3">
          <Megaphone size={15} className="text-rondo-accent" />
          <h2 className="font-heading text-white font-black italic text-sm uppercase">Room</h2>
        </div>

        {broadcasts.length === 0 ? (
          <p className="font-body text-white/40 text-sm bg-[#141414] border border-white/10 rounded-xl p-4">
            No updates yet.
          </p>
        ) : (
          <div className="space-y-3">
            {broadcasts.slice(0, 10).map((item) => (
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
    </div>
  );
}
