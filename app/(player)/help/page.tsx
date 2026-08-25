"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { EmptyState, RondoButton } from "@/components/rondo/primitives";

interface TicketListItem {
  id: string;
  type: string;
  status: string;
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
          .select("id, type, status, created_at")
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
    <div className="min-h-[100dvh] rondo-page pb-20">
      <header className="sticky top-0 z-40 mx-auto flex max-w-lg items-center justify-between border-b border-[var(--stroke)] px-4 py-3 rondo-glass-nav">
        <h1 className="font-heading text-lg font-black uppercase italic text-[var(--ink-hi)]">Help</h1>
        <Link href="/help/new" className="text-xs font-semibold uppercase tracking-wide text-[var(--gold)]">
          New ticket
        </Link>
      </header>
      <div className="mx-auto max-w-lg space-y-4 p-4">
        {loading ? (
          <div className="h-28 rounded-[var(--r-md)] border border-[var(--stroke)] rondo-shimmer" />
        ) : tickets.length === 0 ? (
          <div className="rondo-surface px-4">
            <EmptyState
              title="No tickets yet"
              body="Need help with a payment, match, or account? Open a ticket and we’ll take it from there."
              imageSrc="/onboarding/secure.png"
              imageAlt=""
              action={<RondoButton href="/help/new">New ticket</RondoButton>}
            />
          </div>
        ) : (
          <div className="space-y-2">
            {tickets.map((ticket) => (
              <Link key={ticket.id} href={`/help/${ticket.id}`} className="block rondo-surface p-3">
                <p className="text-sm capitalize text-[var(--ink-hi)]">{ticket.type.replaceAll("_", " ")}</p>
                <p className="text-xs capitalize text-[var(--ink-mid)]">{ticket.status.replaceAll("_", " ")}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
