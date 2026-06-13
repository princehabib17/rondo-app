"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getFlagEmoji } from "@/lib/utils/format";

interface SuggestedPlayer {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  nationality: string | null;
  position: string | null;
}

export function SuggestedProfiles() {
  const [players, setPlayers] = useState<SuggestedPlayer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, nationality, position")
        .eq("role", "player")
        .not("full_name", "is", null)
        .order("created_at", { ascending: false })
        .limit(15);
      setPlayers((data as SuggestedPlayer[]) ?? []);
      setLoading(false);
    }
    load();
  }, []);

  if (!loading && players.length === 0) return null;

  return (
    <section className="px-4 pt-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users size={16} className="text-rondo-accent" />
          <h2 className="font-heading text-white font-black italic text-sm uppercase tracking-wide">
            Suggested Players
          </h2>
        </div>
        <Link
          href="/reels"
          className="flex items-center gap-0.5 font-body text-white/40 text-xs hover:text-rondo-accent transition-colors"
        >
          See Reels
          <ChevronRight size={13} strokeWidth={2.5} />
        </Link>
      </div>

      <div className="flex gap-4 overflow-x-auto scrollbar-none pb-1 -mx-1 px-1">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2 shrink-0 w-[72px]">
                <div className="w-14 h-14 rounded-full bg-white/10 animate-pulse" />
                <div className="h-2.5 w-12 rounded bg-white/10 animate-pulse" />
              </div>
            ))
          : players.map((player) => {
              const flag = player.nationality ? getFlagEmoji(player.nationality) : "";
              return (
                <Link
                  key={player.id}
                  href={`/profile/${player.id}`}
                  className="flex flex-col items-center gap-2 shrink-0 w-[72px] group"
                >
                  <div className="relative">
                    <div className="w-14 h-14 rounded-full bg-secondary border border-white/10 flex items-center justify-center overflow-hidden group-hover:border-rondo-accent/50 transition-colors">
                      {player.avatar_url ? (
                        <img src={player.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="font-heading text-white font-black text-sm">
                          {(player.full_name ?? "?")[0]}
                        </span>
                      )}
                    </div>
                    {flag && (
                      <span className="absolute -bottom-0.5 -right-0.5 text-base leading-none">{flag}</span>
                    )}
                  </div>
                  <div className="text-center">
                    <p className="font-body text-white/80 text-[10px] leading-tight line-clamp-1">
                      {player.full_name}
                    </p>
                    {player.position && (
                      <p className="font-body text-white/40 text-[9px] capitalize">{player.position}</p>
                    )}
                  </div>
                </Link>
              );
            })}
      </div>
    </section>
  );
}
