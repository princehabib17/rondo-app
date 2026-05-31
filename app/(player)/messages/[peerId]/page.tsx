"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
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
    if (!userData.user || userData.user.is_anonymous) {
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
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
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
        <p className="text-white/50 text-sm">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] rondo-page flex flex-col pb-24">
      <header className="sticky top-0 rondo-glass-nav border-b border-white/5 z-40 px-4 py-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center text-white"
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-white font-bold text-sm truncate flex-1">
          {peer?.full_name ?? "Player"}
        </h1>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 max-w-lg mx-auto w-full">
        {messages.length === 0 && (
          <p className="text-center text-white/40 text-sm py-8">Say hello — this is a private 1:1 chat.</p>
        )}
        {messages.map((m) => {
          const mine = m.sender_id === currentUserId;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                  mine ? "bg-rondo-accent text-black" : "bg-white/10 text-white"
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
        className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto px-4 pb-6 pt-3 rondo-glass-nav z-30 flex gap-2"
      >
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Message…"
          maxLength={2000}
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/35 min-h-[48px]"
        />
        <button
          type="submit"
          disabled={!body.trim() || sending}
          className="min-w-[48px] min-h-[48px] rondo-btn rondo-btn-primary flex items-center justify-center disabled:opacity-40"
          aria-label="Send"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
