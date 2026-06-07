"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Share2, Link2, Users, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { PlayerAvatar } from "@/components/game/PlayerAvatar";
import type { Profile } from "@/lib/supabase/types";

interface InvitePlayer {
  id: string;
  profile: Profile | null;
}

interface InviteGame {
  id: string;
  title: string;
  venue_name: string;
  game_players: InvitePlayer[];
}

export default function InvitePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [game, setGame] = useState<InviteGame | null>(null);
  const [players, setPlayers] = useState<InvitePlayer[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("games")
        .select(
          "id, title, venue_name, game_players(id, profile:profiles(id, full_name, avatar_url, nationality))"
        )
        .eq("id", id)
        .single();
      if (data) {
        setGame(data as InviteGame);
        setPlayers((data.game_players as InvitePlayer[]) ?? []);
      }
    }
    load();
  }, [id]);

  async function handleShare() {
    const url = `${window.location.origin}/games/${id}`;
    if (navigator.share) {
      await navigator.share({ title: game?.title ?? "RONDO Game", url });
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="min-h-[100dvh] pb-8">
      <header className="sticky top-0 bg-background/90 backdrop-blur-md border-b border-border z-40 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center text-white hover:text-rondo-yellow transition-colors cursor-pointer"
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-white font-bold text-base">Bring Your Squad</h1>
      </header>

      <div className="px-4 py-8 space-y-8 max-w-lg mx-auto text-center">
        <div className="space-y-2">
          <div className="w-16 h-16 rounded-full bg-rondo-yellow/10 border border-rondo-yellow/20 flex items-center justify-center mx-auto">
            <Users size={28} className="text-rondo-yellow" />
          </div>
          <h2 className="text-white font-black text-2xl tracking-tight">Bring Your Squad!</h2>
          <p className="text-muted-foreground text-sm">
            Share this game with your friends so they can join too
          </p>
        </div>

        <button
          onClick={handleShare}
          className="w-full bg-rondo-yellow text-rondo-black font-black uppercase tracking-widest text-sm py-4 rounded-xl active:scale-[0.98] transition-all cursor-pointer min-h-[52px] flex items-center justify-center gap-2"
        >
          {copied ? (
            <>
              <Link2 size={18} />
              Link Copied!
            </>
          ) : (
            <>
              <Share2 size={18} />
              Share Game Link
            </>
          )}
        </button>

        <button
          onClick={() => router.push(`/games/${id}/confirmed`)}
          className="w-full border border-border text-muted-foreground hover:text-white hover:border-border/80 text-sm py-4 rounded-xl active:scale-[0.98] transition-all cursor-pointer min-h-[52px] flex items-center justify-center gap-2"
        >
          Skip <ChevronRight size={16} />
        </button>

        {players.length > 0 && (
          <div className="text-left space-y-3">
            <p className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">
              Already Joined ({players.length})
            </p>
            <div className="flex flex-wrap gap-3">
              {players.map((gp) =>
                gp.profile ? (
                  <div key={gp.id} className="flex flex-col items-center gap-1">
                    <PlayerAvatar
                      profile={gp.profile}
                      size="md"
                      showFlag
                      linkable
                    />
                    <span className="text-muted-foreground text-[10px] max-w-[44px] truncate text-center">
                      {gp.profile.full_name?.split(" ")[0]}
                    </span>
                  </div>
                ) : null
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
