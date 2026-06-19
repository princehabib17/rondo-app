"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
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
      <header className="sticky top-0 bg-background/90 backdrop-blur-md border-b border-border z-40 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center text-white"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-white font-bold text-base flex-1">My Shortlist</h1>
        <Bookmark size={18} className="text-rondo-accent" />
      </header>

      {loading ? (
        <div className="p-4 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 bg-card rounded-xl animate-pulse" />
          ))}
        </div>
      ) : shortlist.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 p-8 text-center mt-20">
          <Bookmark size={40} className="text-white/20" />
          <p className="font-heading text-white font-black italic text-xl uppercase">Empty shortlist</p>
          <p className="text-white/50 text-sm">
            Save players from the reels feed to build your scouting list.
          </p>
          <Link
            href="/reels"
            className="mt-2 bg-rondo-accent text-black font-bold px-6 py-3 rounded-xl text-sm"
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
                className="bg-card border border-border rounded-xl p-3 flex items-center gap-3"
              >
                <Link href={`/profile/${entry.player_id}`} className="relative shrink-0">
                  <div className="w-12 h-12 relative rounded-full bg-secondary border border-border overflow-hidden flex items-center justify-center">
                    {player?.avatar_url ? (
                      <Image src={player.avatar_url} alt="" fill className="object-cover" sizes="48px" />
                    ) : (
                      <span className="text-white font-black">
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
                  <p className="text-white font-bold text-sm">{player?.full_name}</p>
                  <p className="text-muted-foreground text-xs capitalize">
                    {player?.position ?? "Player"}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/messages/${entry.player_id}`}
                    className="w-9 h-9 rounded-lg border border-border flex items-center justify-center text-rondo-accent"
                  >
                    <MessageCircle size={16} />
                  </Link>
                  <button
                    onClick={() => remove(entry.player_id)}
                    className="w-9 h-9 rounded-lg border border-border flex items-center justify-center text-white/40 hover:text-red-400 transition-colors"
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
