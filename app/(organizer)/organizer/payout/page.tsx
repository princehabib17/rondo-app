"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { motion } from "motion/react";
import { bouncy } from "@/components/motion/springs";
import { createClient } from "@/lib/supabase/client";
import { formatGameDate, formatPrice } from "@/lib/utils/format";

interface PayoutHistoryEntry {
  id: string;
  amount: number;
  status: "pending" | "approved" | "rejected" | "paid";
  bank_name: string | null;
  created_at: string;
}

const payoutStatusStyle: Record<PayoutHistoryEntry["status"], string> = {
  pending: "bg-amber-400/15 text-amber-300",
  approved: "bg-sky-400/15 text-sky-300",
  paid: "bg-emerald-400/15 text-emerald-300",
  rejected: "bg-red-400/15 text-red-300",
};

const inputClass =
  "w-full rounded-xl border border-white/10 bg-black/35 px-4 py-3.5 font-body text-sm text-white placeholder:text-white/30 outline-none transition focus:border-rondo-accent";

export default function PayoutPage() {
  const router = useRouter();
  const [organizerId, setOrganizerId] = useState<string | null>(null);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [payoutMessage, setPayoutMessage] = useState<string | null>(null);
  const [payoutHistory, setPayoutHistory] = useState<PayoutHistoryEntry[]>([]);

  async function loadPayoutHistory() {
    const res = await fetch("/api/wallet/payout");
    if (!res.ok) return;
    const json = await res.json();
    setPayoutHistory(json.requests ?? []);
  }

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        router.push("/login");
        return;
      }
      setOrganizerId(userData.user.id);
      await loadPayoutHistory();
    }
    load();
  }, [router]);

  async function submitPayoutRequest() {
    if (!organizerId) return;
    const amount = Math.round(Number(payoutAmount) * 100);
    if (!amount || amount <= 0) return;
    const res = await fetch("/api/wallet/payout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amountCentavos: amount,
        bankName,
        bankAccountName,
        bankAccountNumber,
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      setPayoutMessage(json.error ?? "Could not submit payout request");
      return;
    }
    setPayoutAmount("");
    setBankName("");
    setBankAccountName("");
    setBankAccountNumber("");
    setPayoutMessage("Payout request submitted.");
    await loadPayoutHistory();
  }

  return (
    <div className="min-h-[100dvh] bg-[#050505]">
      <header className="sticky top-0 z-40 border-b border-white/5 bg-black/85 px-5 py-3 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <Link
            href="/organizer/dashboard"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/6 text-white/70 transition active:scale-[0.97]"
          >
            <ArrowLeft size={16} />
          </Link>
          <p className="font-body text-[10px] font-black uppercase tracking-[0.26em] text-rondo-accent">
            Wallet Ops
          </p>
        </div>
      </header>

      <div className="space-y-8 px-5 pb-12 pt-8">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={bouncy}
        >
          <h1 className="font-heading text-4xl font-black uppercase italic leading-none text-white">
            Request Payout
          </h1>
          <p className="mt-2 font-body text-sm text-white/40">
            Funds are transferred within 2–3 business days.
          </p>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...bouncy, delay: 0.06 }}
          className="space-y-3"
        >
          <input
            value={payoutAmount}
            onChange={(e) => setPayoutAmount(e.target.value)}
            placeholder="Amount in PHP, e.g. 500"
            type="number"
            min="1"
            className={inputClass}
          />
          <input
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            placeholder="Bank name"
            className={inputClass}
          />
          <input
            value={bankAccountName}
            onChange={(e) => setBankAccountName(e.target.value)}
            placeholder="Account name"
            className={inputClass}
          />
          <input
            value={bankAccountNumber}
            onChange={(e) => setBankAccountNumber(e.target.value)}
            placeholder="Account number"
            className={inputClass}
          />
          <button
            onClick={submitPayoutRequest}
            className="min-h-[52px] w-full rounded-xl bg-rondo-accent font-body text-sm font-black uppercase tracking-wider text-black transition active:scale-[0.98]"
          >
            Submit Payout
          </button>
          {payoutMessage && (
            <p className="text-center font-body text-xs text-white/60">{payoutMessage}</p>
          )}
        </motion.section>

        {payoutHistory.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...bouncy, delay: 0.1 }}
            className="space-y-3"
          >
            <h2 className="font-heading text-lg font-black uppercase italic text-white">
              Recent Requests
            </h2>
            <div className="space-y-2">
              {payoutHistory.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-white/6 bg-white/[0.03] p-4 font-body text-xs"
                >
                  <div className="min-w-0">
                    <p className="font-black text-white">{formatPrice(entry.amount)}</p>
                    <p className="mt-0.5 truncate text-white/40">
                      {entry.bank_name ?? "No bank"} · {formatGameDate(entry.created_at)}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 font-body text-[10px] font-black uppercase tracking-wide ${payoutStatusStyle[entry.status]}`}
                  >
                    {entry.status}
                  </span>
                </div>
              ))}
            </div>
          </motion.section>
        )}
      </div>
    </div>
  );
}
