"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { PlayerAvatar } from "@/components/game/PlayerAvatar";
import type { Profile } from "@/lib/supabase/types";

type Conversation = {
  peerId: string;
  peer: Pick<Profile, "id" | "full_name" | "avatar_url" | "nationality"> | null;
  lastBody: string;
  lastAt: string;
  unread: number;
};

export default function MessagesPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/messages/direct")
      .then((r) => r.json())
      .then((json) => setConversations(json.conversations ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-[100dvh] rondo-page pb-20">
      <header className="sticky top-0 rondo-glass-nav border-b border-white/5 z-40 px-4 py-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center text-white"
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-heading text-white font-black italic text-base uppercase">Messages</h1>
      </header>

      <div className="px-4 py-4 max-w-lg mx-auto">
        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-16 rondo-shimmer rounded-xl" />
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center text-center py-16 px-4">
            <MessageCircle size={32} className="text-white/30 mb-3" />
            <p className="text-white font-semibold">No conversations yet</p>
            <p className="text-white/50 text-sm mt-1 max-w-[260px]">
              Message a player from their profile to start a private chat.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {conversations.map((c) => (
              <Link
                key={c.peerId}
                href={`/messages/${c.peerId}`}
                className="flex items-center gap-3 py-3 active:opacity-80"
              >
                {c.peer ? (
                  <PlayerAvatar
                    profile={c.peer as Parameters<typeof PlayerAvatar>[0]["profile"]}
                    size="md"
                    showFlag
                    linkable={false}
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-white/10" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-white text-sm font-semibold truncate">
                      {c.peer?.full_name ?? "Player"}
                    </p>
                    <span className="text-white/35 text-[10px] shrink-0">
                      {new Date(c.lastAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-white/50 text-xs truncate mt-0.5">{c.lastBody}</p>
                </div>
                {c.unread > 0 && (
                  <span className="bg-rondo-accent text-black text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
                    {c.unread}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
