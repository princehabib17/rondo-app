"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { formatRelativeTime } from "@/lib/utils/format";
import { PlayerAvatar } from "@/components/game/PlayerAvatar";
import { EmptyState, RondoButton } from "@/components/rondo/primitives";
import type { Profile } from "@/lib/supabase/types";

type Conversation = {
  peerId: string;
  peer: Pick<Profile, "id" | "full_name" | "avatar_url" | "nationality"> | null;
  lastBody: string;
  lastAt: string;
  unread: number;
};

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsAccount, setNeedsAccount] = useState(false);

  useEffect(() => {
    fetch("/api/messages/direct")
      .then(async (r) => {
        if (r.status === 401 || r.status === 403) {
          setNeedsAccount(true);
          return;
        }
        const json = await r.json();
        setConversations(json.conversations ?? []);
      })
      .catch(() => setConversations([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-[100dvh] rondo-page">
      <PageHeader title="Messages" back fallbackHref="/profile" />

      <div className="mx-auto max-w-lg px-4 py-6">
        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-16 rondo-shimmer rounded-[var(--r-md)]" />
            ))}
          </div>
        ) : needsAccount ? (
          <EmptyState
            title="Sign in to see your messages"
            body="Private chats are tied to your account. Log in or create one to pick up where you left off."
            action={<RondoButton href="/login?next=/messages">Log in</RondoButton>}
            className="py-16"
          />
        ) : conversations.length === 0 ? (
          <EmptyState
            title="No conversations yet"
            body="Open a player's profile and tap the chat icon to start a private conversation."
            action={<RondoButton href="/community" variant="secondary">Find players</RondoButton>}
            className="py-16"
          />
        ) : (
          <div className="divide-y divide-[var(--stroke)] overflow-hidden rounded-[var(--r-md)] border border-[var(--stroke)] bg-[var(--bg-surface)]">
            {conversations.map((c) => (
              <Link
                key={c.peerId}
                href={`/messages/${c.peerId}`}
                className="flex min-h-16 items-center gap-3 px-4 py-3 transition-colors active:bg-[var(--bg-inset)]"
              >
                {c.peer ? (
                  <PlayerAvatar
                    profile={c.peer as Parameters<typeof PlayerAvatar>[0]["profile"]}
                    size="md"
                    showFlag
                    linkable={false}
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[var(--bg-inset)]" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate rondo-body font-bold text-[var(--ink-hi)]">
                      {c.peer?.full_name ?? "Player"}
                    </p>
                    <span className="shrink-0 rondo-meta text-[var(--ink-low)]">
                      {formatRelativeTime(c.lastAt).replace("about ", "")}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate rondo-meta text-[var(--ink-low)]">{c.lastBody}</p>
                </div>
                {c.unread > 0 && (
                  <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-[var(--r-pill)] bg-[var(--gold)] px-1.5 text-[0.6875rem] font-bold tabular-nums text-[var(--gold-ink)]">
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
