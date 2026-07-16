"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Megaphone } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatGameHeadline, formatRelativeTime } from "@/lib/utils/format";
import type { Announcement, Profile } from "@/lib/supabase/types";

type AnnouncementRow = Announcement & {
  organizer?: Profile | null;
};

export default function OrganizerRoomPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [dateTime, setDateTime] = useState<string | null>(null);
  const [rows, setRows] = useState<AnnouncementRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const [{ data: game }, { data: announcements }] = await Promise.all([
        supabase.from("games").select("date_time").eq("id", id).single(),
        supabase
          .from("announcements")
          .select("*, organizer:profiles!organizer_id(id, full_name, avatar_url)")
          .eq("game_id", id)
          .order("created_at", { ascending: false }),
      ]);
      if (game) setDateTime(game.date_time);
      setRows((announcements as AnnouncementRow[]) ?? []);
      setLoading(false);
    }
    load();
  }, [id]);

  return (
    <div className="min-h-[100dvh] rondo-page pb-24">
      <header className="sticky top-0 z-40 rondo-glass-nav border-b border-white/5 px-4 py-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center text-white"
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-heading text-white font-black italic text-sm uppercase truncate">
            Organizer room
          </h1>
          <p className="font-body text-white/45 text-xs truncate">
            {dateTime ? formatGameHeadline(dateTime) : ""}
          </p>
        </div>
      </header>

      <div className="px-4 py-6 max-w-lg mx-auto space-y-4">
        <p className="font-body text-white/50 text-sm">
          Updates from the organizer. Read-only — no squad chat here.
        </p>

        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-20 rondo-surface rondo-shimmer rounded-xl" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="rondo-surface p-8 text-center">
            <Megaphone size={28} className="text-white/30 mx-auto mb-3" />
            <p className="text-white/60 text-sm">No announcements yet.</p>
          </div>
        ) : (
          rows.map((row) => (
            <article key={row.id} className="rondo-surface p-4">
              <p className="text-white/40 text-[10px] uppercase mb-2">
                {row.organizer?.full_name ?? "Organizer"} · {formatRelativeTime(row.created_at)}
              </p>
              <p className="text-white text-sm leading-relaxed whitespace-pre-wrap">{row.body}</p>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
