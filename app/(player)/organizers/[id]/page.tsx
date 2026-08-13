"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Calendar, Megaphone, MapPin, Radio } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { formatGameDate, formatRelativeTime } from "@/lib/utils/format";
import type { Announcement, Game, Profile } from "@/lib/supabase/types";
import { getOrganizerInitials } from "@/lib/feed/organizers";
import { resolveOrganizer } from "@/lib/organizers/resolve-organizer";

type BroadcastCategory = "general" | "game_on" | "cancelled" | "rules" | "tournament_notice";

interface OrganizerBroadcast {
  id: string;
  organizer_id: string | null;
  organizer_key: string;
  body: string;
  category: BroadcastCategory;
  created_at: string;
}

interface RoomBroadcast {
  id: string;
  organizer_id: string;
  body: string;
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
  const [roomBroadcasts, setRoomBroadcasts] = useState<RoomBroadcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [newBody, setNewBody] = useState("");
  const [newCategory, setNewCategory] = useState<BroadcastCategory>("general");
  const [sending, setSending] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);
  const [isPlaceholder, setIsPlaceholder] = useState(false);

  const loadHub = useCallback(async () => {
    const supabase = createClient();
    const now = new Date().toISOString();
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id ?? null;
    setCurrentUserId(uid);

    const resolved = await resolveOrganizer(supabase, id);

    if (!resolved) {
      toast.error("That organizer page doesn't exist anymore.");
      router.replace("/feed");
      return;
    }

    const profile = resolved.profile;
    const organizerId = resolved.organizerId;
    setIsPlaceholder(resolved.isPlaceholder);

    const gamesPromise = resolved.isPlaceholder
      ? Promise.resolve({ data: [] as Game[] })
      : supabase
          .from("games")
          .select("*, game_players(id)")
          .eq("organizer_id", organizerId)
          .eq("status", "open")
          .gte("date_time", now)
          .order("date_time", { ascending: true })
          .limit(10);

    const queries = [
      gamesPromise,
      isUuid(organizerId)
        ? supabase
            .from("organizer_broadcasts")
            .select("*")
            .or(`organizer_key.eq.${id},organizer_id.eq.${organizerId}`)
            .order("created_at", { ascending: false })
            .limit(50)
        : supabase
            .from("organizer_broadcasts")
            .select("*")
            .eq("organizer_key", id)
            .order("created_at", { ascending: false })
            .limit(50),
      isUuid(organizerId)
        ? supabase
            .from("announcements")
            .select("*")
            .eq("organizer_id", organizerId)
            .order("created_at", { ascending: false })
            .limit(20)
        : Promise.resolve({ data: [] as Announcement[] }),
    ] as const;

    const [{ data: gamesData }, { data: organizerBroadcasts }, { data: legacyAnnouncements }] =
      await Promise.all(queries);

    let room: RoomBroadcast[] = [];
    if (isUuid(organizerId)) {
      const { data: roomData } = await supabase
        .from("organizer_broadcasts")
        .select("id, organizer_id, body, created_at")
        .eq("organizer_id", organizerId)
        .order("created_at", { ascending: false })
        .limit(10);
      room = (roomData as RoomBroadcast[] | null) ?? [];
    }

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
    setRoomBroadcasts(room);
    setLoading(false);
  }, [id, router]);

  useEffect(() => {
    loadHub();
  }, [loadHub]);

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
      <div className="min-h-[100dvh] bg-[var(--bg-page)] flex items-center justify-center">
        <div className="w-2 h-2 rounded-full bg-[var(--gold)] animate-ping" />
      </div>
    );
  }

  const canBroadcast = !isPlaceholder && currentUserId === organizer.id;

  return (
    <div className="min-h-[100dvh] bg-[var(--bg-page)] pb-8">
      <header className="sticky top-0 z-10 bg-[var(--bg-page)]/95 backdrop-blur-md border-b border-[var(--stroke)] px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center text-[var(--ink-hi)] hover:text-[var(--ink-hi)]"
            aria-label="Back"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-[var(--bg-inset)] border border-[var(--stroke)] flex items-center justify-center shrink-0">
              <span className="font-heading text-[var(--ink-hi)] font-black text-sm">
                {getOrganizerInitials(organizer.full_name)}
              </span>
            </div>
            <div className="min-w-0">
              <h1 className="font-heading text-[var(--ink-hi)] font-black italic text-lg uppercase truncate">
                {organizer.full_name}
              </h1>
              <p className="font-body text-[var(--ink-low)] text-xs">Organizer group</p>
            </div>
          </div>
        </div>
      </header>

      <section className="px-4 pt-5">
        {canBroadcast && (
          <form onSubmit={handleBroadcastSubmit} className="mb-4 bg-[var(--bg-surface)] border border-[var(--stroke)] rounded-[var(--r-md)] p-4 space-y-3">
            <h3 className="font-heading text-[var(--ink-hi)] text-sm font-black uppercase">Post Broadcast</h3>
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value as BroadcastCategory)}
              className="w-full bg-[var(--bg-page)] border border-[var(--stroke)] text-[var(--ink-hi)] rounded-[var(--r-sm)] px-3 py-2 text-sm"
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
              className="w-full h-24 bg-[var(--bg-page)] border border-[var(--stroke)] text-[var(--ink-hi)] rounded-[var(--r-sm)] p-3 text-sm resize-none"
            />
            {postError && <p className="text-[var(--live)] text-xs">{postError}</p>}
            <button
              type="submit"
              disabled={sending || !newBody.trim()}
              className="w-full bg-[var(--gold)] text-[var(--gold-ink)] font-heading font-black uppercase tracking-widest text-xs py-3 rounded-[var(--r-sm)] disabled:opacity-50"
            >
              {sending ? "Posting..." : "Post Broadcast"}
            </button>
          </form>
        )}

        <div className="flex items-center gap-2 mb-3">
          <Megaphone size={15} className="text-[var(--gold)]" />
          <h2 className="font-heading text-[var(--ink-hi)] font-black italic text-sm uppercase">Broadcasts</h2>
        </div>

        {broadcasts.length === 0 ? (
          <p className="font-body text-[var(--ink-low)] text-sm bg-[var(--bg-surface)] border border-[var(--stroke)] rounded-[var(--r-md)] p-4">
            No broadcasts yet. Only the organizer can post updates here.
          </p>
        ) : (
          <div className="space-y-3">
            {broadcasts.map((item) => (
              <article
                key={item.id}
                className="bg-[var(--bg-surface)] border border-[var(--stroke)] rounded-[var(--r-md)] p-4"
              >
                <p className="font-heading text-[var(--gold)] text-[10px] uppercase tracking-wider mb-1">
                  {CATEGORY_LABEL[item.category]}
                </p>
                <p className="font-body text-[var(--ink-hi)] text-sm leading-relaxed">{item.body}</p>
                <p className="font-body text-[var(--ink-low)] text-xs mt-2">
                  {formatRelativeTime(item.created_at)}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="px-4 pt-6">
        <div className="flex items-center gap-2 mb-3">
          <Calendar size={15} className="text-[var(--gold)]" />
          <h2 className="font-heading text-[var(--ink-hi)] font-black italic text-sm uppercase">
            Upcoming Games
          </h2>
        </div>

        {games.length === 0 ? (
          <p className="font-body text-[var(--ink-low)] text-sm">No upcoming games from this organizer.</p>
        ) : (
          <div className="space-y-3">
            {games.map((game) => (
              <Link
                key={game.id}
                href={`/games/${game.id}`}
                className="block bg-[var(--bg-surface)] border border-[var(--stroke)] rounded-[var(--r-md)] p-4 hover:border-[var(--gold)]/30 transition-colors"
              >
                <h3 className="font-heading text-[var(--ink-hi)] font-black italic uppercase text-base mb-2">
                  {game.title}
                </h3>
                <div className="space-y-1 font-body text-[var(--ink-low)] text-xs">
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

      {/* Room section — organizer's broadcast room updates */}
      <section className="px-4 pt-6 pb-8">
        <div className="flex items-center gap-2 mb-3">
          <Radio size={15} className="text-[var(--gold)]" />
          <h2 className="font-heading text-[var(--ink-hi)] font-black italic text-sm uppercase">Room</h2>
        </div>

        {roomBroadcasts.length === 0 ? (
          <p className="font-body text-[var(--ink-low)] text-sm bg-[var(--bg-surface)] border border-[var(--stroke)] rounded-[var(--r-md)] p-4">
            No updates yet.
          </p>
        ) : (
          <div className="space-y-3">
            {roomBroadcasts.map((item) => (
              <article
                key={item.id}
                className="bg-[var(--bg-surface)] border border-[var(--stroke)] rounded-[var(--r-md)] p-4"
              >
                <p className="font-body text-[var(--ink-hi)] text-sm leading-relaxed">{item.body}</p>
                <p className="font-body text-[var(--ink-low)] text-xs mt-2">
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
