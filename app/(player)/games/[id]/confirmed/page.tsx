"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle2, Calendar, Share2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatGameDate } from "@/lib/utils/format";
import type { Game } from "@/lib/supabase/types";

function ConfirmedContent() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [game, setGame] = useState<Game | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();

      // Payment status is confirmed by the PayMongo webhook (server-side).
      // We only fetch the game here — no client-side paid upsert to prevent bypass.
      const { data } = await supabase.from("games").select("*").eq("id", id).single();
      if (data) setGame(data as Game);
    }
    load();
  }, [id]);

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center px-6 text-center space-y-8">
      <div className="space-y-4">
        <CheckCircle2
          size={64}
          className="text-rondo-yellow mx-auto"
          strokeWidth={1.5}
        />
        <div>
          <h1 className="text-white font-black text-4xl tracking-tight uppercase leading-none">
            Match
            <br />
            Confirmed
          </h1>
          {game && (
            <div className="flex items-center justify-center gap-2 mt-4 text-muted-foreground text-sm">
              <Calendar size={14} />
              <span>See you on {formatGameDate(game.date_time)}</span>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3 w-full max-w-xs">
        <button
          onClick={() => router.push(`/games/${id}/invite`)}
          className="w-full bg-rondo-yellow text-rondo-black font-black uppercase tracking-widest text-sm py-4 rounded-xl active:scale-[0.98] transition-all cursor-pointer min-h-[52px] flex items-center justify-center gap-2"
        >
          <Share2 size={18} />
          Invite Friends
        </button>
        <button
          onClick={() => router.push("/feed")}
          className="w-full border border-border text-muted-foreground hover:text-white text-sm py-4 rounded-xl active:scale-[0.98] transition-all cursor-pointer min-h-[52px]"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}

export default function ConfirmedPage() {
  return <ConfirmedContent />;
}
