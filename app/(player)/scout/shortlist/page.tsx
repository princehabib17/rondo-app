"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MessageCircle, Bookmark } from "lucide-react";
import { getFlagEmoji } from "@/lib/utils/format";
import type { ScoutShortlist } from "@/lib/supabase/types";

export default function ScoutShortlistPage() {
  const router = useRouter();
  const [shortlist, setShortlist] = useState<ScoutShortlist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/scout/shortlist")
      .then((r) => r.json())
      .then((json) => {
        setShortlist(json.shortlist ?? []);
        setLoading(false);
      });
  }, []);

  async function remove(playerId: string) {
    await fetch("/api/scout/shortlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ player_id: playerId }),
    });
    setShortlist((prev) => prev.filter((s) => s.player_id !== playerId));
  }

  return (
    <div className="min-h-[100dvh] rondo-page pb-24">
      <header className="sticky top-0 bg-[var(--bg-page)]/90 backdrop-blur-md border-b border-[var(--stroke)] z-40 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--ink-hi)]"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-[var(--ink-hi)] font-bold text-base flex-1">My Shortlist</h1>
        <Bookmark size={18} className="text-[var(--gold)]" />
      </header>

      {loading ? (
        <div className="p-4 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 bg-[var(--bg-surface)] rounded-[var(--r-md)] animate-pulse" />
          ))}
        </div>
      ) : shortlist.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 p-8 text-center mt-20">
          <Bookmark size={40} className="text-[var(--ink-low)]" />
          <p className="font-heading text-[var(--ink-hi)] font-black italic text-xl uppercase">Empty shortlist</p>
          <p className="text-[var(--ink-low)] text-sm">
            Save players from the reels feed to build your scouting list.
          </p>
          <Link
            href="/reels"
            className="mt-2 bg-[var(--gold)] text-[var(--gold-ink)] font-bold px-6 py-3 rounded-[var(--r-md)] text-sm"
          >
            Browse Reels
          </Link>
        </div>
      ) : (
        <div className="p-4 space-y-2">
          {shortlist.map((entry) => {
            const player = entry.player;
            const flag = player?.nationality ? getFlagEmoji(player.nationality) : "";
            return (
              <div
                key={entry.id}
                className="bg-[var(--bg-surface)] border border-[var(--stroke)] rounded-[var(--r-md)] p-3 flex items-center gap-3"
              >
                <Link href={`/profile/${entry.player_id}`} className="relative shrink-0">
                  <div className="w-12 h-12 rounded-full bg-[var(--bg-inset)] border border-[var(--stroke)] overflow-hidden flex items-center justify-center">
                    {player?.avatar_url ? (
                      <img src={player.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[var(--ink-hi)] font-black">
                        {(player?.full_name ?? "?")[0]}
                      </span>
                    )}
                  </div>
                  {flag && (
                    <span className="absolute -bottom-0.5 -right-0.5 text-base leading-none">
                      {flag}
                    </span>
                  )}
                </Link>
                <div className="flex-1 min-w-0">
                  <p className="text-[var(--ink-hi)] font-bold text-sm">{player?.full_name}</p>
                  <p className="text-[var(--ink-low)] text-xs capitalize">
                    {player?.position ?? "Player"}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/messages/${entry.player_id}`}
                    className="w-9 h-9 rounded-[var(--r-sm)] border border-[var(--stroke)] flex items-center justify-center text-[var(--gold)]"
                  >
                    <MessageCircle size={16} />
                  </Link>
                  <button
                    onClick={() => remove(entry.player_id)}
                    className="w-9 h-9 rounded-[var(--r-sm)] border border-[var(--stroke)] flex items-center justify-center text-[var(--ink-low)] hover:text-[var(--live)] transition-colors"
                  >
                    <Bookmark size={16} className="fill-current" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
