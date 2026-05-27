"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface TicketDetail {
  id: string;
  type: string;
  description: string;
  status: string;
  admin_note: string | null;
  created_at: string;
}

export default function HelpTicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [ticket, setTicket] = useState<TicketDetail | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase.from("support_tickets").select("*").eq("id", id).single();
      setTicket((data as TicketDetail) ?? null);
    }
    load();
  }, [id]);

  if (!ticket) {
    return <div className="min-h-[100dvh] p-4 text-white/70">Loading ticket...</div>;
  }

  return (
    <div className="min-h-[100dvh] p-4 max-w-lg mx-auto space-y-3">
      <h1 className="text-white font-bold text-xl capitalize">{ticket.type.replaceAll("_", " ")}</h1>
      <p className="text-white/70 text-sm capitalize">Status: {ticket.status.replaceAll("_", " ")}</p>
      <div className="bg-card border border-border rounded-xl p-3 text-white text-sm whitespace-pre-wrap">
        {ticket.description}
      </div>
      {ticket.admin_note && (
        <div className="bg-card border border-border rounded-xl p-3">
          <p className="text-xs text-white/60 mb-1">Admin note</p>
          <p className="text-sm text-white">{ticket.admin_note}</p>
        </div>
      )}
    </div>
  );
}
