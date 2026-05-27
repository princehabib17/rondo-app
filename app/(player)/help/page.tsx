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
    <div className="min-h-[100dvh] p-4 max-w-lg mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-white font-bold text-xl">Help Center</h1>
        <Link href="/help/new" className="text-rondo-accent text-sm font-semibold">New Ticket</Link>
      </div>
      {tickets.length === 0 ? (
        <p className="text-white/60 text-sm">No tickets yet.</p>
      ) : (
        <div className="space-y-2">
          {tickets.map((ticket) => (
            <Link key={ticket.id} href={`/help/${ticket.id}`} className="block bg-card border border-border rounded-xl p-3">
              <p className="text-white text-sm capitalize">{ticket.type.replaceAll("_", " ")}</p>
              <p className="text-white/60 text-xs capitalize">{ticket.status.replaceAll("_", " ")}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
