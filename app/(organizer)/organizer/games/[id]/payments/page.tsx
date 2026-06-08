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

const STATUS_STYLE: Record<string, { label: string; cls: string }> = {
  paid: { label: "Paid", cls: "text-green-400 bg-green-400/10" },
  approved: { label: "Approved", cls: "text-green-400/70 bg-green-400/10" },
  venue: { label: "At Venue", cls: "text-rondo-accent bg-rondo-accent/10" },
  reserved: { label: "Reserved", cls: "text-blue-400 bg-blue-400/10" },
  pending_payment: { label: "Pending", cls: "text-white/40 bg-white/8" },
  pending: { label: "Pending", cls: "text-white/40 bg-white/8" },
  no_show: { label: "No Show", cls: "text-red-400 bg-red-400/10" },
  refund_requested: { label: "Refund", cls: "text-orange-400 bg-orange-400/10" },
  cancelled: { label: "Cancelled", cls: "text-white/20 bg-white/5" },
};

export default function OrganizerGamePaymentsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [entries, setEntries] = useState<PaymentEntry[]>([]);
  const [pricePerPlayer, setPricePerPlayer] = useState(0);
  const [loading, setLoading] = useState(true);

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
      const normalized = (
        (players as Array<{
          id: string;
          payment_status: string;
          profile: Array<{ full_name: string | null }> | null;
        }> | null) ?? []
      ).map((row) => ({
        id: row.id,
        payment_status: row.payment_status,
        profile: row.profile?.[0] ?? null,
      }));
      setEntries(normalized);
      setLoading(false);
    }
    load();
  }, [id]);

  const stats = useMemo(() => {
    const paid = entries.filter((e) => ["paid", "approved"].includes(e.payment_status)).length;
    const venue = entries.filter((e) => e.payment_status === "venue").length;
    const pending = entries.filter((e) =>
      ["pending", "pending_payment", "reserved"].includes(e.payment_status)
    ).length;
    const issues = entries.filter((e) =>
      ["refund_requested", "no_show"].includes(e.payment_status)
    ).length;
    return {
      paid,
      venue,
      pending,
      issues,
      total: entries.length,
      collected: paid * pricePerPlayer,
      expected: entries.length * pricePerPlayer,
    };
  }, [entries, pricePerPlayer]);

  return (
    <div className="min-h-[100dvh] bg-black pb-10">
      <header className="sticky top-0 z-40 bg-black border-b border-white/8 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 flex items-center justify-center text-white/70"
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-heading text-white font-black italic text-xl uppercase">Payments</h1>
      </header>

      <div className="px-4 py-5 space-y-4 max-w-lg mx-auto">
        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-16 bg-[#141414] border border-white/8 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {/* Summary card */}
            <div className="bg-[#141414] border border-white/8 rounded-2xl p-5">
              <div className="flex items-end justify-between mb-4">
                <div>
                  <p className="text-white/40 text-xs uppercase tracking-widest mb-1">Collected</p>
                  <p className="font-heading text-rondo-accent font-black text-3xl">{formatPrice(stats.collected)}</p>
                </div>
                <div className="text-right">
                  <p className="text-white/40 text-xs">of {formatPrice(stats.expected)} expected</p>
                  <p className="text-white/40 text-xs">{stats.total} players total</p>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2 pt-3 border-t border-white/6">
                <Stat label="Paid" value={stats.paid} color="text-green-400" />
                <Stat label="Venue" value={stats.venue} color="text-rondo-accent" />
                <Stat label="Pending" value={stats.pending} color="text-white/40" />
                {stats.issues > 0 && <Stat label="Issues" value={stats.issues} color="text-orange-400" />}
              </div>
            </div>

            {/* Player list */}
            <div className="bg-[#141414] border border-white/8 rounded-2xl overflow-hidden">
              {entries.length === 0 ? (
                <p className="px-4 py-6 text-white/25 text-sm text-center">No players yet</p>
              ) : (
                <div className="divide-y divide-white/5">
                  {entries.map((entry) => {
                    const s = STATUS_STYLE[entry.payment_status] ?? { label: entry.payment_status, cls: "text-white/40 bg-white/5" };
                    return (
                      <div key={entry.id} className="px-4 py-3 flex items-center justify-between gap-3">
                        <span className="text-white text-sm">{entry.profile?.full_name ?? "—"}</span>
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${s.cls}`}>
                          {s.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="text-center">
      <p className={`font-heading font-black text-lg ${color}`}>{value}</p>
      <p className="text-white/30 text-[10px]">{label}</p>
    </div>
  );
}
