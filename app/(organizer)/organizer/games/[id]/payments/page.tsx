"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils/format";

interface PaymentEntry {
  id: string;
  payment_status: string;
  profile: { full_name: string | null } | null;
}

export default function OrganizerGamePaymentsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [entries, setEntries] = useState<PaymentEntry[]>([]);
  const [pricePerPlayer, setPricePerPlayer] = useState(0);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const [{ data: game }, { data: players }] = await Promise.all([
        supabase.from("games").select("price_per_player").eq("id", id).single(),
        supabase
          .from("game_players")
          .select("id, payment_status, profile:profiles(full_name)")
          .eq("game_id", id),
      ]);
      setPricePerPlayer(game?.price_per_player ?? 0);
      const normalized = ((players as Array<{ id: string; payment_status: string; profile: Array<{ full_name: string | null }> | null }> | null) ?? []).map((row) => ({
        id: row.id,
        payment_status: row.payment_status,
        profile: row.profile?.[0] ?? null,
      }));
      setEntries(normalized);
    }
    load();
  }, [id]);

  const stats = useMemo(() => {
    const paid = entries.filter((e) => e.payment_status === "paid").length;
    const reserved = entries.filter((e) => e.payment_status === "reserved").length;
    const unpaid = entries.filter((e) =>
      ["pending", "pending_payment", "venue"].includes(e.payment_status)
    ).length;
    const refundRequested = entries.filter((e) => e.payment_status === "refund_requested").length;
    return {
      paid,
      reserved,
      unpaid,
      refundRequested,
      expected: entries.length * pricePerPlayer,
      collected: paid * pricePerPlayer,
    };
  }, [entries, pricePerPlayer]);

  return (
    <div className="min-h-[100dvh] p-4 max-w-lg mx-auto space-y-4">
      <header className="flex items-center gap-3">
        <button onClick={() => router.back()} aria-label="Back" className="w-10 h-10 rounded-[var(--r-sm)] border border-[var(--stroke)] text-[var(--ink-hi)] flex items-center justify-center">
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-[var(--ink-hi)] font-bold">Payments</h1>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[var(--bg-surface)] border border-[var(--stroke)] rounded-[var(--r-md)] p-3 text-xs text-[var(--ink-mid)]">Paid: <span className="text-[var(--ink-hi)] font-bold">{stats.paid}</span></div>
        <div className="bg-[var(--bg-surface)] border border-[var(--stroke)] rounded-[var(--r-md)] p-3 text-xs text-[var(--ink-mid)]">Reserved: <span className="text-[var(--ink-hi)] font-bold">{stats.reserved}</span></div>
        <div className="bg-[var(--bg-surface)] border border-[var(--stroke)] rounded-[var(--r-md)] p-3 text-xs text-[var(--ink-mid)]">Unpaid: <span className="text-[var(--ink-hi)] font-bold">{stats.unpaid}</span></div>
        <div className="bg-[var(--bg-surface)] border border-[var(--stroke)] rounded-[var(--r-md)] p-3 text-xs text-[var(--ink-mid)]">Refund Req: <span className="text-[var(--ink-hi)] font-bold">{stats.refundRequested}</span></div>
      </div>

      <div className="bg-[var(--bg-surface)] border border-[var(--stroke)] rounded-[var(--r-md)] p-4 text-sm text-[var(--ink-hi)]">
        Expected: <span className="text-[var(--ink-hi)] font-bold">{formatPrice(stats.expected)}</span>
        <br />
        Collected: <span className="text-[var(--ink-hi)] font-bold">{formatPrice(stats.collected)}</span>
      </div>

      <div className="space-y-2">
        {entries.map((entry) => (
          <div key={entry.id} className="bg-[var(--bg-surface)] border border-[var(--stroke)] rounded-[var(--r-md)] p-3 flex items-center justify-between">
            <span className="text-[var(--ink-hi)] text-sm">{entry.profile?.full_name ?? "Player"}</span>
            <span className="text-xs text-[var(--ink-mid)] capitalize">{entry.payment_status.replaceAll("_", " ")}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
