"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDownUp, LifeBuoy, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/supabase/types";
import { PROFILE_SUMMARY_SELECT } from "@/lib/supabase/profile-select";
import { formatRelativeTime } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

interface AdminTicket {
  id: string;
  user_id: string;
  type: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
  user?: Pick<Profile, "id" | "full_name" | "avatar_url">;
}

const STATUS_FILTERS = [
  "all",
  "open",
  "in_review",
  "refund_pending",
  "resolved",
  "refunded",
  "closed",
] as const;

const statusStyle: Record<string, string> = {
  open: "bg-amber-400/15 text-amber-300",
  in_review: "bg-sky-400/15 text-sky-300",
  refund_pending: "bg-purple-400/15 text-purple-300",
  resolved: "bg-emerald-400/15 text-emerald-300",
  refunded: "bg-emerald-400/15 text-emerald-300",
  closed: "bg-white/10 text-white/50",
};

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<AdminTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]>("all");
  const [search, setSearch] = useState("");
  const [newestFirst, setNewestFirst] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("support_tickets")
        .select(`*, user:profiles!user_id(${PROFILE_SUMMARY_SELECT})`)
        .order("created_at", { ascending: false })
        .limit(200);
      setTickets((data as AdminTicket[]) ?? []);
      setLoading(false);
    }
    load();
  }, []);

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();
    let rows = tickets;
    if (statusFilter !== "all") rows = rows.filter((t) => t.status === statusFilter);
    if (needle) {
      rows = rows.filter(
        (t) =>
          t.description.toLowerCase().includes(needle) ||
          t.type.toLowerCase().includes(needle) ||
          (t.user?.full_name ?? "").toLowerCase().includes(needle)
      );
    }
    return newestFirst ? rows : [...rows].reverse();
  }, [tickets, statusFilter, search, newestFirst]);

  return (
    <div className="min-h-[100dvh] rondo-page pb-10">
      <header className="sticky top-0 rondo-glass-nav border-b border-white/5 z-40 px-4 py-3">
        <div className="flex items-center gap-2.5 max-w-lg mx-auto">
          <LifeBuoy size={18} className="text-rondo-accent" />
          <h1 className="text-white font-black text-lg">Support Tickets</h1>
          <span className="text-muted-foreground text-xs ml-auto">admin</span>
        </div>
      </header>

      <div className="px-4 py-5 space-y-4 max-w-lg mx-auto">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2">
            <Search size={14} className="text-white/30 shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search description, type, or user…"
              className="flex-1 bg-transparent text-white text-sm placeholder:text-white/30 outline-none"
            />
          </div>
          <button
            type="button"
            onClick={() => setNewestFirst((v) => !v)}
            aria-label="Toggle sort order"
            className="rounded-lg border border-white/10 p-2 text-white/50"
            title={newestFirst ? "Newest first" : "Oldest first"}
          >
            <ArrowDownUp size={15} />
          </button>
        </div>

        <div className="flex gap-1.5 overflow-x-auto -mx-4 px-4 pb-1">
          {STATUS_FILTERS.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-semibold capitalize shrink-0 transition-colors",
                statusFilter === status
                  ? "border-rondo-accent/60 bg-rondo-accent/15 text-rondo-accent"
                  : "border-white/10 text-white/40"
              )}
            >
              {status.replaceAll("_", " ")}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-card border border-border rounded-xl animate-pulse" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="rondo-surface p-6 text-center">
            <p className="text-white/55 text-sm">No tickets match.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {visible.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/admin/tickets/${ticket.id}`}
                className="block rondo-surface p-3 space-y-1.5 hover:border-rondo-accent/40 border border-transparent transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-white text-sm font-semibold capitalize truncate">
                    {ticket.type.replaceAll("_", " ")}
                  </p>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide shrink-0",
                      statusStyle[ticket.status] ?? "bg-white/10 text-white/50"
                    )}
                  >
                    {ticket.status.replaceAll("_", " ")}
                  </span>
                </div>
                <p className="text-white/60 text-xs line-clamp-2">{ticket.description}</p>
                <p className="text-muted-foreground text-[11px]">
                  {ticket.user?.full_name ?? "Unknown user"} · {formatRelativeTime(ticket.created_at)}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
