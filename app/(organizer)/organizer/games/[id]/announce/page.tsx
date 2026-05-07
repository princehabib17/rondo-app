"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Megaphone, Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function AnnouncePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSend() {
    if (!body.trim() || sending) return;
    setSending(true);
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;
    await supabase.from("announcements").insert({
      game_id: id,
      organizer_id: userData.user.id,
      body: body.trim(),
    });
    setSent(true);
    setSending(false);
    setTimeout(() => router.back(), 1500);
  }

  return (
    <div className="min-h-[100dvh] pb-8">
      <header className="sticky top-0 bg-background/90 backdrop-blur-md border-b border-border z-40 px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="min-w-[44px] min-h-[44px] flex items-center justify-center text-white hover:text-rondo-yellow cursor-pointer" aria-label="Back">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-white font-bold text-base">Announce</h1>
      </header>

      <div className="px-4 py-6 space-y-6 max-w-lg mx-auto">
        <div className="flex items-start gap-3 p-4 bg-rondo-yellow/5 border border-rondo-yellow/20 rounded-xl">
          <Megaphone size={16} className="text-rondo-yellow mt-0.5 shrink-0" />
          <p className="text-muted-foreground text-sm">This message will be broadcast to all players in this game. They will see it in the feed.</p>
        </div>

        <div className="space-y-2">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your announcement here..."
            className="w-full bg-secondary border border-border text-white rounded-xl p-4 text-sm resize-none h-36 focus:border-rondo-yellow focus:outline-none placeholder:text-muted-foreground"
            maxLength={500}
            aria-label="Announcement text"
          />
          <p className="text-muted-foreground text-xs text-right">{body.length}/500</p>
        </div>

        {sent ? (
          <div className="text-center py-4">
            <p className="text-green-400 font-semibold">Announcement sent!</p>
          </div>
        ) : (
          <button
            onClick={handleSend}
            disabled={!body.trim() || sending}
            className="w-full bg-rondo-yellow text-rondo-black font-black uppercase tracking-widest text-sm py-4 rounded-xl active:scale-[0.98] transition-all disabled:opacity-40 cursor-pointer min-h-[52px] flex items-center justify-center gap-2"
          >
            <Send size={16} />
            {sending ? "Sending..." : "Send Announcement"}
          </button>
        )}
      </div>
    </div>
  );
}
