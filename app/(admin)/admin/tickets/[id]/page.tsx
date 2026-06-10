"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Lock, Send } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/supabase/types";
import { PROFILE_SUMMARY_SELECT } from "@/lib/supabase/profile-select";
import { PlayerAvatar } from "@/components/game/PlayerAvatar";
import { formatRelativeTime } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

interface AdminTicket {
  id: string;
  user_id: string;
  type: string;
  description: string;
  status: string;
  admin_note: string | null;
  created_at: string;
  user?: Profile;
}

interface TicketReply {
  id: string;
  ticket_id: string;
  author_id: string;
  body: string;
  is_internal: boolean;
  created_at: string;
  author?: Pick<Profile, "id" | "full_name" | "avatar_url" | "role">;
}

const STATUS_OPTIONS = ["open", "in_review", "refund_pending", "resolved", "refunded", "closed"];

export default function AdminTicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [ticket, setTicket] = useState<AdminTicket | null>(null);
  const [replies, setReplies] = useState<TicketReply[]>([]);
  const [reply, setReply] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [sending, setSending] = useState(false);
  const [adminId, setAdminId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    const [{ data: userData }, { data: t }, { data: replyRows }] = await Promise.all([
      supabase.auth.getUser(),
      supabase
        .from("support_tickets")
        .select(`*, user:profiles!user_id(${PROFILE_SUMMARY_SELECT})`)
        .eq("id", id)
        .single(),
      supabase
        .from("ticket_replies")
        .select(`*, author:profiles!author_id(${PROFILE_SUMMARY_SELECT})`)
        .eq("ticket_id", id)
        .order("created_at", { ascending: true }),
    ]);
    setAdminId(userData.user?.id ?? null);
    setTicket((t as AdminTicket) ?? null);
    setReplies((replyRows as TicketReply[]) ?? []);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function updateStatus(status: string) {
    if (!ticket) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("support_tickets")
      .update({ status })
      .eq("id", ticket.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    // Tell the user their ticket moved (allowed by the admin notify policy).
    await supabase.from("notifications").insert({
      user_id: ticket.user_id,
      type: "ticket_status",
      title: "Ticket updated",
      body: `Your ${ticket.type.replaceAll("_", " ")} ticket is now ${status.replaceAll("_", " ")}`,
      link: `/help/${ticket.id}`,
    });
    toast.success(`Status set to ${status.replaceAll("_", " ")}`);
    await load();
  }

  async function sendReply() {
    const body = reply.trim();
    if (!body || !ticket || !adminId || sending) return;
    setSending(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("ticket_replies").insert({
        ticket_id: ticket.id,
        author_id: adminId,
        body,
        is_internal: isInternal,
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      if (!isInternal) {
        await supabase.from("notifications").insert({
          user_id: ticket.user_id,
          type: "ticket_reply",
          title: "Support replied",
          body: body.slice(0, 80),
          link: `/help/${ticket.id}`,
        });
      }
      setReply("");
      setIsInternal(false);
      await load();
    } finally {
      setSending(false);
    }
  }

  if (!ticket) {
    return (
      <div className="min-h-[100dvh] rondo-page px-4 py-5 space-y-3 max-w-lg mx-auto">
        {[0, 1].map((i) => (
          <div key={i} className="h-24 bg-card border border-border rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] rondo-page pb-10">
      <header className="sticky top-0 rondo-glass-nav border-b border-white/5 z-40 px-4 py-3">
        <div className="flex items-center gap-2.5 max-w-lg mx-auto">
          <button type="button" onClick={() => router.push("/admin/tickets")} aria-label="Back">
            <ArrowLeft size={18} className="text-white/70" />
          </button>
          <h1 className="text-white font-black text-lg capitalize truncate">
            {ticket.type.replaceAll("_", " ")}
          </h1>
        </div>
      </header>

      <div className="px-4 py-5 space-y-5 max-w-lg mx-auto">
        <section className="rondo-surface p-4 space-y-3">
          {ticket.user && (
            <div className="flex items-center gap-3">
              <PlayerAvatar profile={ticket.user} size="sm" showFlag={false} linkable={false} />
              <div className="min-w-0">
                <p className="text-white text-sm font-semibold truncate">
                  {ticket.user.full_name ?? "Unknown user"}
                </p>
                <p className="text-muted-foreground text-xs">
                  opened {formatRelativeTime(ticket.created_at)}
                </p>
              </div>
            </div>
          )}
          <p className="text-white/85 text-sm whitespace-pre-wrap">{ticket.description}</p>
          {ticket.admin_note && (
            <p className="text-white/50 text-xs border-t border-white/5 pt-2">
              Legacy note: {ticket.admin_note}
            </p>
          )}
        </section>

        <section className="space-y-2">
          <h2 className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
            Status
          </h2>
          <div className="flex gap-1.5 flex-wrap">
            {STATUS_OPTIONS.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => updateStatus(status)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-semibold capitalize transition-colors",
                  ticket.status === status
                    ? "border-rondo-accent/60 bg-rondo-accent/15 text-rondo-accent"
                    : "border-white/10 text-white/40"
                )}
              >
                {status.replaceAll("_", " ")}
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
            Conversation
          </h2>
          {replies.length === 0 ? (
            <p className="text-muted-foreground text-xs">No replies yet.</p>
          ) : (
            replies.map((entry) => (
              <div
                key={entry.id}
                className={cn(
                  "rounded-xl border p-3 space-y-1",
                  entry.is_internal
                    ? "border-amber-400/30 bg-amber-400/5"
                    : "border-border bg-card"
                )}
              >
                <div className="flex items-center gap-2">
                  <p className="text-white text-xs font-semibold">
                    {entry.author?.full_name ?? "Staff"}
                  </p>
                  {entry.is_internal && (
                    <span className="inline-flex items-center gap-1 text-amber-300 text-[10px] font-bold uppercase tracking-wide">
                      <Lock size={10} />
                      Internal
                    </span>
                  )}
                  <span className="text-muted-foreground text-[11px] ml-auto">
                    {formatRelativeTime(entry.created_at)}
                  </span>
                </div>
                <p className="text-white/80 text-sm whitespace-pre-wrap">{entry.body}</p>
              </div>
            ))
          )}

          <div className="rondo-surface p-3 space-y-2">
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value.slice(0, 4000))}
              placeholder={isInternal ? "Internal note (user won't see this)…" : "Reply to the user…"}
              rows={3}
              className="w-full bg-transparent text-white text-sm placeholder:text-white/30 resize-none outline-none"
            />
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsInternal((v) => !v)}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors",
                  isInternal
                    ? "border-amber-400/60 bg-amber-400/15 text-amber-300"
                    : "border-white/10 text-white/40"
                )}
              >
                <Lock size={11} />
                Internal note
              </button>
              <button
                type="button"
                onClick={sendReply}
                disabled={!reply.trim() || sending}
                className="inline-flex items-center gap-1.5 rounded-full bg-rondo-accent text-black px-4 py-1.5 text-xs font-bold disabled:opacity-40"
              >
                <Send size={12} />
                {sending ? "Sending…" : isInternal ? "Add note" : "Reply"}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
