"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface TicketListItem {
  id: string;
  type: string;
  status: string;
  created_at: string;
}

export default function HelpPage() {
  const [tickets, setTickets] = useState<TicketListItem[]>([]);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("support_tickets")
        .select("id, type, status, created_at")
        .order("created_at", { ascending: false });
      setTickets((data as TicketListItem[]) ?? []);
    }
    load();
  }, []);

  return (
    <div className="min-h-[100dvh] rondo-page pb-20">
      <header className="sticky top-0 rondo-glass-nav border-b border-white/5 z-40 px-4 py-3 max-w-lg mx-auto flex items-center justify-between">
        <h1 className="font-heading text-white font-black italic text-lg uppercase">Help</h1>
        <Link href="/help/new" className="text-rondo-accent text-xs font-semibold uppercase tracking-wide">New ticket</Link>
      </header>
      <div className="p-4 max-w-lg mx-auto space-y-4">
      {tickets.length === 0 ? (
        <div className="rondo-surface p-6 text-center">
          <p className="text-white/55 text-sm">No tickets yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tickets.map((ticket) => (
            <Link key={ticket.id} href={`/help/${ticket.id}`} className="block rondo-surface p-3">
              <p className="text-white text-sm capitalize">{ticket.type.replaceAll("_", " ")}</p>
              <p className="text-white/60 text-xs capitalize">{ticket.status.replaceAll("_", " ")}</p>
            </Link>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}
