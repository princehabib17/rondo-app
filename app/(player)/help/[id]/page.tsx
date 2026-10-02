"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PaperPlaneRight } from "@phosphor-icons/react";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState, RondoButton } from "@/components/rondo/primitives";
import { helpStatusLabel, helpTopicLabel, isHelpTicketClosed } from "@/lib/help/topics";
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
    return (
      <div className="min-h-[100dvh] rondo-page">
        <PageHeader title="Ticket" back fallbackHref="/help" />
        <div className="mx-auto max-w-lg px-4 py-12">
          <EmptyState
            title="Ticket not found"
            body="It may belong to another account, or the link is old."
            action={<RondoButton href="/help" variant="secondary">Back to Help</RondoButton>}
          />
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-[100dvh] rondo-page">
        <PageHeader title="Ticket" back fallbackHref="/help" />
        <div className="mx-auto max-w-lg space-y-3 px-4 py-6">
          <div className="h-24 rounded-[var(--r-md)] rondo-shimmer" />
          <div className="h-16 rounded-[var(--r-md)] rondo-shimmer" />
        </div>
      </div>
    );
  }

  const ticketClosed = isHelpTicketClosed(ticket.status);

  return (
    <div className="min-h-[100dvh] rondo-page">
      <PageHeader
        title={helpTopicLabel(ticket.type)}
        subtitle={`Opened ${formatRelativeTime(ticket.created_at)}`}
        back
        fallbackHref="/help"
        trailing={
          <span
            className={cn(
              "rounded-[var(--r-pill)] px-2.5 py-1 rondo-label",
              ticketClosed ? "bg-[var(--bg-inset)] text-[var(--ink-low)]" : "bg-[var(--gold-dim)] text-[var(--gold)]"
            )}
          >
            {helpStatusLabel(ticket.status)}
          </span>
        }
      />

      <div className="mx-auto max-w-lg space-y-3 px-4 py-6">
        <div className="ml-8 rounded-[var(--r-md)] rounded-br-[var(--r-sm)] border border-[var(--stroke)] bg-[var(--bg-surface)] p-4">
          <p className="mb-1 rondo-label text-[var(--ink-low)]">You</p>
          <p className="whitespace-pre-wrap rondo-body text-[var(--ink-hi)]">{ticket.description}</p>
        </div>

        {ticket.admin_note && (
          <div className="mr-8 rounded-[var(--r-md)] rounded-bl-[var(--r-sm)] border border-[color-mix(in_oklch,var(--gold)_28%,var(--stroke))] bg-[var(--gold-dim)] p-4">
            <p className="mb-1 rondo-label text-[var(--gold)]">Rondo Support</p>
            <p className="whitespace-pre-wrap rondo-body text-[var(--ink-hi)]">{ticket.admin_note}</p>
          </div>
        )}

        {replies.map((entry) => {
          const mine = entry.author_id === userId;
          return (
            <div
              key={entry.id}
              className={cn(
                "rounded-[var(--r-md)] border p-4",
                mine
                  ? "ml-8 rounded-br-[var(--r-sm)] border-[var(--stroke)] bg-[var(--bg-surface)]"
                  : "mr-8 rounded-bl-[var(--r-sm)] border-[color-mix(in_oklch,var(--gold)_28%,var(--stroke))] bg-[var(--gold-dim)]"
              )}
            >
              <div className="mb-1 flex items-center justify-between gap-2">
                <p className={cn("rondo-label", mine ? "text-[var(--ink-low)]" : "text-[var(--gold)]")}>
                  {mine ? "You" : "Rondo Support"}
                </p>
                <span className="rondo-meta text-[var(--ink-low)]">{formatRelativeTime(entry.created_at)}</span>
              </div>
              <p className="whitespace-pre-wrap rondo-body text-[var(--ink-hi)]">{entry.body}</p>
            </div>
          );
        })}

        {replies.length === 0 && !ticket.admin_note && !ticketClosed && (
          <p className="py-4 text-center rondo-meta text-[var(--ink-low)]">
            Support usually replies within a day. You&apos;ll get a notification.
          </p>
        )}

        {ticketClosed && (
          <p className="py-4 text-center rondo-meta text-[var(--ink-low)]">
            This ticket is {helpStatusLabel(ticket.status).toLowerCase()}. Open a new one if something else comes up.
          </p>
        )}
      </div>

      {!ticketClosed && (
        <div className="fixed inset-x-0 bottom-0 z-30 rondo-sticky-action pb-[env(safe-area-inset-bottom)]">
          <div className="mx-auto flex max-w-lg items-center gap-2 px-4 py-3">
            <input
              value={reply}
              onChange={(e) => setReply(e.target.value.slice(0, 4000))}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendReply();
                }
              }}
              placeholder="Add a reply"
              aria-label="Reply to support"
              className="h-12 min-w-0 flex-1 rounded-[var(--r-sm)] border border-transparent bg-[var(--bg-inset)] px-4 rondo-body text-[var(--ink-hi)] outline-none placeholder:text-[var(--ink-low)] focus:border-[var(--gold)]"
            />
            <button
              type="button"
              onClick={sendReply}
              disabled={!reply.trim() || sending}
              aria-label="Send reply"
              className="grid size-12 shrink-0 place-items-center rounded-[var(--r-pill)] bg-[var(--gold)] text-[var(--gold-ink)] disabled:opacity-40"
            >
              <PaperPlaneRight size={20} weight="fill" aria-hidden />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
