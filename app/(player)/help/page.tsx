"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CaretRight, ChatCircleDots, Lifebuoy, Plus } from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/layout/PageHeader";
import { HELP_TOPICS, helpStatusLabel, helpTopicLabel, isHelpTicketClosed } from "@/lib/help/topics";
import { formatRelativeTime } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

interface TicketListItem {
  id: string;
  type: string;
  status: string;
  description: string | null;
  created_at: string;
}

export default function HelpPage() {
  const [tickets, setTickets] = useState<TicketListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("support_tickets")
          .select("id, type, status, description, created_at")
          .order("created_at", { ascending: false });
        setTickets((data as TicketListItem[]) ?? []);
      } catch {
        setTickets([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="min-h-[100dvh] rondo-page">
      <PageHeader
        title="Help"
        back
        fallbackHref="/profile"
        trailing={
          <Link
            href="/help/new"
            className="inline-flex h-10 items-center gap-1 rounded-[var(--r-pill)] border border-[var(--stroke)] px-3 rondo-meta font-bold text-[var(--ink-hi)] active:scale-[0.97]"
          >
            <Plus size={14} weight="bold" aria-hidden />
            New
          </Link>
        }
      />

      <div className="mx-auto max-w-lg space-y-8 px-4 py-6">
        <section className="relative overflow-hidden rounded-[var(--r-lg)] border border-[var(--stroke)] rondo-floodlight-scene p-6">
          <Lifebuoy size={28} weight="duotone" className="text-[var(--gold)]" aria-hidden />
          <h2 className="mt-4 rondo-display text-[var(--ink-hi)]">How can we help?</h2>
          <p className="mt-2 rondo-body text-[var(--ink-mid)]">
            Real people reply, usually within a day. Refunds on cancelled matches go back to your wallet.
          </p>
        </section>

        <section>
          <h3 className="mb-3 rondo-label text-[var(--ink-low)]">Pick a topic</h3>
          <div className="overflow-hidden rounded-[var(--r-md)] border border-[var(--stroke)] bg-[var(--bg-surface)]">
            {HELP_TOPICS.slice(0, 5).map((topic, i) => (
              <Link
                key={topic.value}
                href={`/help/new?type=${topic.value}`}
                className={cn(
                  "flex min-h-14 items-center gap-3 px-4 py-3 transition-colors active:bg-[var(--bg-inset)]",
                  i > 0 && "border-t border-[var(--stroke)]"
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className="rondo-body font-bold text-[var(--ink-hi)]">{topic.label}</p>
                  <p className="truncate rondo-meta text-[var(--ink-low)]">{topic.hint}</p>
                </div>
                <CaretRight size={16} className="shrink-0 text-[var(--ink-low)]" aria-hidden />
              </Link>
            ))}
          </div>
        </section>

        <section>
          <h3 className="mb-3 rondo-label text-[var(--ink-low)]">Your tickets</h3>
          {loading ? (
            <div className="space-y-3">
              {[0, 1].map((i) => (
                <div key={i} className="h-16 rounded-[var(--r-md)] rondo-shimmer" />
              ))}
            </div>
          ) : tickets.length === 0 ? (
            <div className="flex items-center gap-3 rounded-[var(--r-md)] border border-dashed border-[var(--stroke)] px-4 py-5">
              <ChatCircleDots size={22} weight="duotone" className="shrink-0 text-[var(--ink-low)]" aria-hidden />
              <p className="rondo-meta text-[var(--ink-low)]">
                No tickets yet. Anything you open shows up here with every reply.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-[var(--r-md)] border border-[var(--stroke)] bg-[var(--bg-surface)]">
              {tickets.map((ticket, i) => {
                const closed = isHelpTicketClosed(ticket.status);
                return (
                  <Link
                    key={ticket.id}
                    href={`/help/${ticket.id}`}
                    className={cn(
                      "flex min-h-16 items-center gap-3 px-4 py-3 transition-colors active:bg-[var(--bg-inset)]",
                      i > 0 && "border-t border-[var(--stroke)]"
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="rondo-body font-bold text-[var(--ink-hi)]">{helpTopicLabel(ticket.type)}</p>
                      <p className="truncate rondo-meta text-[var(--ink-low)]">
                        {formatRelativeTime(ticket.created_at)}
                        {ticket.description ? ` · ${ticket.description}` : ""}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-[var(--r-pill)] px-2.5 py-1 rondo-label",
                        closed
                          ? "bg-[var(--bg-inset)] text-[var(--ink-low)]"
                          : "bg-[var(--gold-dim)] text-[var(--gold)]"
                      )}
                    >
                      {helpStatusLabel(ticket.status)}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
