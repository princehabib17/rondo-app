"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { isGuestUser } from "@/lib/auth/is-guest";
import type { DirectMessage, Profile } from "@/lib/supabase/types";

export default function DirectMessageThreadPage() {
  const { peerId } = useParams<{ peerId: string }>();
  const router = useRouter();
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [peer, setPeer] = useState<Profile | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadThread = useCallback(async () => {
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user || isGuestUser(userData.user)) {
      router.push(`/login?next=/messages/${peerId}`);
      return;
    }
    setCurrentUserId(userData.user.id);

    const [{ data: peerData }, res] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", peerId).single(),
      fetch(`/api/messages/${peerId}`),
    ]);
    setPeer(peerData as Profile | null);

    const json = await res.json();
    if (res.ok) setMessages(json.messages ?? []);
    setLoading(false);
  }, [peerId, router]);

  useEffect(() => {
    loadThread();
  }, [loadThread]);

  useEffect(() => {
    // An empty thread has nothing to scroll to; scrolling it only tucked the hint under the header.
    if (messages.length > 0) bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = body.trim();
    if (!trimmed || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/messages/${peerId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: trimmed }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Send failed");
      setMessages((prev) => [...prev, json.message]);
      setBody("");
    } catch {
      // keep draft for retry
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-[100dvh] rondo-page flex items-center justify-center">
        <p className="text-[var(--ink-low)] text-sm">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] rondo-page flex flex-col pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
      <header className="sticky top-0 rondo-glass-nav border-b border-[var(--stroke)] z-40 px-4 py-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--ink-hi)]"
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-[var(--ink-hi)] font-bold text-sm truncate flex-1">
          {peer?.full_name ?? "Player"}
        </h1>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 max-w-lg mx-auto w-full">
        {messages.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <p className="rondo-body font-bold text-[var(--ink-hi)]">Start the conversation</p>
            <p className="max-w-[16rem] rondo-meta text-[var(--ink-low)]">Only the two of you can see this chat.</p>
          </div>
        )}
        {messages.map((m) => {
          const mine = m.sender_id === currentUserId;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-[var(--r-md)] px-4 py-2.5 text-sm ${
                  mine ? "bg-[var(--gold)] text-[var(--gold-ink)]" : "bg-[var(--bg-inset)] text-[var(--ink-hi)]"
                }`}
              >
                {m.body}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={handleSend}
        className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] rondo-sticky-action z-30 flex gap-2"
      >
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Message"
          maxLength={2000}
          aria-label="Message"
          className="h-12 min-w-0 flex-1 rounded-[var(--r-sm)] border border-transparent bg-[var(--bg-inset)] px-4 rondo-body text-[var(--ink-hi)] placeholder:text-[var(--ink-low)] outline-none focus:border-[var(--gold)]"
        />
        <button
          type="submit"
          disabled={!body.trim() || sending}
          aria-label="Send message"
          className="grid size-12 shrink-0 place-items-center rounded-[var(--r-pill)] bg-[var(--gold)] text-[var(--gold-ink)] disabled:opacity-40"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
