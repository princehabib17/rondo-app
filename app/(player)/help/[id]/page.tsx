"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatRelativeTime } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

interface TicketDetail {
  id: string;
  user_id: string;
  type: string;
  description: string;
  status: string;
  admin_note: string | null;
  created_at: string;
}

interface TicketReply {
  id: string;
  author_id: string;
  body: string;
  created_at: string;
}

export default function HelpTicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [replies, setReplies] = useState<TicketReply[]>([]);
  const [forbidden, setForbidden] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) { router.push("/login"); return; }
    setUserId(userData.user.id);

    const { data } = await supabase.from("support_tickets").select("*").eq("id", id).single();
    if (!data) { setForbidden(true); return; }

    if ((data as TicketDetail).user_id !== userData.user.id) {
      setForbidden(true);
      return;
    }
    setTicket(data as TicketDetail);

    // RLS hides internal admin notes from the ticket owner.
    const { data: replyRows } = await supabase
      .from("ticket_replies")
      .select("id, author_id, body, created_at")
      .eq("ticket_id", id)
      .order("created_at", { ascending: true });
    setReplies((replyRows as TicketReply[]) ?? []);
  }, [id, router]);

  useEffect(() => {
    load();
  }, [load]);

  async function sendReply() {
    const body = reply.trim();
    if (!body || !userId || sending) return;
    setSending(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("ticket_replies").insert({
        ticket_id: id,
        author_id: userId,
        body,
      });
      if (!error) {
        setReply("");
        await load();
      }
    } finally {
      setSending(false);
    }
  }

  if (forbidden) {
    return <div className="min-h-[100dvh] p-4 text-destructive">Ticket not found.</div>;
  }

  if (!ticket) {
    return <div className="min-h-[100dvh] p-4 text-[var(--ink-mid)]">Loading ticket...</div>;
  }

  const ticketClosed = ["resolved", "refunded", "closed"].includes(ticket.status);

  return (
    <div className="min-h-[100dvh] p-4 max-w-lg mx-auto space-y-3">
      <h1 className="text-[var(--ink-hi)] font-bold text-xl capitalize">{ticket.type.replaceAll("_", " ")}</h1>
      <p className="text-[var(--ink-mid)] text-sm capitalize">Status: {ticket.status.replaceAll("_", " ")}</p>
      <div className="bg-[var(--bg-surface)] border border-[var(--stroke)] rounded-[var(--r-md)] p-3 text-[var(--ink-hi)] text-sm whitespace-pre-wrap">
        {ticket.description}
      </div>
      {ticket.admin_note && (
        <div className="bg-[var(--bg-surface)] border border-[var(--stroke)] rounded-[var(--r-md)] p-3">
          <p className="text-xs text-[var(--ink-mid)] mb-1">Admin note</p>
          <p className="text-sm text-[var(--ink-hi)]">{ticket.admin_note}</p>
        </div>
      )}

      {replies.map((entry) => (
        <div
          key={entry.id}
          className={cn(
            "rounded-[var(--r-md)] border border-[var(--stroke)] p-3 space-y-1",
            entry.author_id === userId ? "bg-[var(--bg-surface)]" : "bg-[var(--gold)]/5 border-[var(--gold)]/20"
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-[var(--ink-mid)]">
              {entry.author_id === userId ? "You" : "Rondo Support"}
            </p>
            <span className="text-[var(--ink-low)] text-[11px]">{formatRelativeTime(entry.created_at)}</span>
          </div>
          <p className="text-sm text-[var(--ink-hi)] whitespace-pre-wrap">{entry.body}</p>
        </div>
      ))}

      {!ticketClosed && (
        <div className="flex items-center gap-2">
          <input
            value={reply}
            onChange={(e) => setReply(e.target.value.slice(0, 4000))}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendReply();
              }
            }}
            placeholder="Add a reply…"
            className="flex-1 bg-[var(--bg-page)]/30 border border-[var(--stroke)] rounded-full px-4 py-2.5 text-[var(--ink-hi)] text-sm placeholder:text-[var(--ink-low)] outline-none focus:border-[var(--gold)]/40"
          />
          <button
            type="button"
            onClick={sendReply}
            disabled={!reply.trim() || sending}
            aria-label="Send reply"
            className="rounded-full bg-[var(--gold)] text-[var(--gold-ink)] p-2.5 disabled:opacity-40"
          >
            <Send size={15} />
          </button>
        </div>
      )}
    </div>
  );
}
