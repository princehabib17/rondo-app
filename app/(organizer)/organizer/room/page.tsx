"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Radio, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatRelativeTime } from "@/lib/utils/format";

interface Broadcast {
  id: string;
  organizer_id: string;
  body: string;
  created_at: string;
}

export default function OrganizerRoomPage() {
  const router = useRouter();
  const [organizerId, setOrganizerId] = useState<string | null>(null);
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function loadBroadcasts(userId: string) {
    const supabase = createClient();
    const { data } = await supabase
      .from("organizer_broadcasts")
      .select("id, organizer_id, body, created_at")
      .eq("organizer_id", userId)
      .order("created_at", { ascending: false });
    setBroadcasts((data as Broadcast[]) ?? []);
  }

  useEffect(() => {
    async function init() {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        router.push("/login");
        return;
      }
      setOrganizerId(userData.user.id);
      await loadBroadcasts(userData.user.id);
      setLoading(false);
    }
    init();
  }, [router]);

  async function handlePost(e: React.FormEvent) {
    e.preventDefault();
    if (!organizerId || !body.trim()) return;

    setPosting(true);
    setPostError(null);
    const supabase = createClient();
    const { error } = await supabase.from("organizer_broadcasts").insert({
      organizer_id: organizerId,
      body: body.trim(),
    });

    if (error) {
      setPostError(error.message);
      setPosting(false);
      return;
    }

    setBody("");
    setPosting(false);

    // Notify followers
    const { data: followers } = await supabase
      .from("follows")
      .select("follower_id")
      .eq("following_id", organizerId);
    if (followers && followers.length > 0) {
      await supabase.from("notifications").insert(
        followers.map((f) => ({
          user_id: f.follower_id,
          type: "organizer_broadcast",
          title: "New update from organizer",
          body: body.trim().slice(0, 100) + (body.trim().length > 100 ? "..." : ""),
          link: `/organizers/${organizerId}`,
        }))
      );
    }

    await loadBroadcasts(organizerId);
  }

  async function handleDelete(broadcastId: string) {
    if (!organizerId) return;
    setDeletingId(broadcastId);
    const supabase = createClient();
    await supabase
      .from("organizer_broadcasts")
      .delete()
      .eq("id", broadcastId)
      .eq("organizer_id", organizerId);
    setBroadcasts((prev) => prev.filter((b) => b.id !== broadcastId));
    setDeletingId(null);
  }

  if (loading) {
    return (
      <div className="min-h-[100dvh] rondo-page flex items-center justify-center">
        <div className="w-2 h-2 rounded-full bg-rondo-accent animate-ping" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] rondo-page pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[color-mix(in_oklch,var(--bg-page)_95%,transparent)] backdrop-blur-md border-b border-[var(--stroke)] px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center text-[var(--ink-hi)]/80 hover:text-[var(--ink-hi)]"
            aria-label="Back"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Radio size={18} className="text-rondo-accent shrink-0" />
            <h1 className="font-heading text-[var(--ink-hi)] font-black italic text-lg uppercase truncate">
              My Room
            </h1>
          </div>
        </div>
      </header>

      {/* Compose section */}
      <section className="px-4 pt-5">
        <form
          onSubmit={handlePost}
          className="bg-card border border-border rounded-xl p-4 space-y-3 mb-6"
        >
          <h2 className="font-heading text-[var(--ink-hi)] font-black uppercase text-sm">
            Broadcast Update
          </h2>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={500}
            placeholder="Share an update with your followers..."
            className="w-full h-24 bg-[var(--bg-inset)] border border-[var(--stroke)] text-[var(--ink-hi)] rounded-lg p-3 text-sm resize-none placeholder:text-[var(--ink-low)] focus:outline-none focus:border-rondo-accent/50"
          />
          {postError && (
            <p className="font-body text-red-400 text-xs">{postError}</p>
          )}
          <div className="flex items-center justify-between">
            <span className="font-body text-[var(--ink-hi)]/30 text-xs">{body.length}/500</span>
            <button
              type="submit"
              disabled={posting || !body.trim()}
              className="bg-rondo-accent text-black font-heading font-black uppercase tracking-widest text-xs px-6 py-2.5 rounded-lg disabled:opacity-40 transition-opacity"
            >
              {posting ? "Posting..." : "Post"}
            </button>
          </div>
        </form>

        {/* Feed */}
        <div className="flex items-center gap-2 mb-3">
          <Radio size={14} className="text-rondo-accent" />
          <h2 className="font-heading text-[var(--ink-hi)] font-black italic text-sm uppercase">
            Past Broadcasts
          </h2>
        </div>

        {broadcasts.length === 0 ? (
          <p className="font-body text-[var(--ink-hi)]/40 text-sm bg-card border border-border rounded-xl p-4">
            No broadcasts yet. Post your first update above.
          </p>
        ) : (
          <div className="space-y-3">
            {broadcasts.map((item) => (
              <article
                key={item.id}
                className="bg-card border border-border rounded-xl p-4"
              >
                <p className="font-body text-[var(--ink-hi)]/90 text-sm leading-relaxed">
                  {item.body}
                </p>
                <div className="flex items-center justify-between mt-3">
                  <p className="font-body text-[var(--ink-hi)]/40 text-xs">
                    {formatRelativeTime(item.created_at)}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    disabled={deletingId === item.id}
                    className="w-7 h-7 flex items-center justify-center text-[var(--ink-hi)]/30 hover:text-red-400 transition-colors disabled:opacity-40"
                    aria-label="Delete broadcast"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
