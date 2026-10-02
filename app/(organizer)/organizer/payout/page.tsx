"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
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
  pending: "bg-[var(--gold)]/15 text-[var(--gold)]",
  approved: "bg-[var(--bg-inset)] text-[var(--ink-hi)]",
  paid: "bg-[var(--ok)]/15 text-[var(--ok)]",
  rejected: "bg-[var(--live)]/15 text-[var(--live)]",
};

const inputClass =
  "w-full rounded-[var(--r-md)] border border-[var(--stroke)] bg-[var(--bg-page)]/35 px-4 py-3.5 font-body text-sm text-[var(--ink-hi)] placeholder:text-[var(--ink-low)] outline-none transition focus:border-[var(--gold)]";

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
    <div className="min-h-[100dvh] rondo-page">
      <PageHeader title="Payout" subtitle="Bank transfer by the Rondo team" back="/organizer/dashboard" />

      <div className="mx-auto max-w-lg space-y-8 px-4 pb-12 pt-8">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={bouncy}
        >
          <h2 className="rondo-display text-[var(--ink-hi)]">Request a payout</h2>
          <p className="mt-2 rondo-body text-[var(--ink-low)]">
            We send it by bank transfer within 3 to 5 business days.
          </p>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...bouncy, delay: 0.06 }}
          className="space-y-3"
        >
          <label htmlFor="payout-amount" className="block space-y-2">
            <span className="rondo-label text-[var(--ink-low)]">Amount in pesos</span>
          <input
            id="payout-amount"
            value={payoutAmount}
            onChange={(e) => setPayoutAmount(e.target.value)}
            placeholder="e.g. 500"
            type="number"
            min="1"
            className={inputClass}
          />
          </label>
          <label htmlFor="payout-bank" className="block space-y-2">
            <span className="rondo-label text-[var(--ink-low)]">Bank or e-wallet</span>
          <input
            id="payout-bank"
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            placeholder="BDO, BPI, GCash, Maya"
            className={inputClass}
          />
          </label>
          <label htmlFor="payout-name" className="block space-y-2">
            <span className="rondo-label text-[var(--ink-low)]">Account name</span>
          <input
            id="payout-name"
            value={bankAccountName}
            onChange={(e) => setBankAccountName(e.target.value)}
            placeholder="Name on the account"
            className={inputClass}
          />
          </label>
          <label htmlFor="payout-number" className="block space-y-2">
            <span className="rondo-label text-[var(--ink-low)]">Account number</span>
          <input
            id="payout-number"
            value={bankAccountNumber}
            onChange={(e) => setBankAccountNumber(e.target.value)}
            placeholder="Digits only"
            className={inputClass}
          />
          </label>
          <button
            onClick={submitPayoutRequest}
            className="rondo-btn rondo-btn-primary"
          >
            Request payout
          </button>
          {payoutMessage && (
            <p className="text-center font-body text-xs text-[var(--ink-mid)]">{payoutMessage}</p>
          )}
        </motion.section>

        {payoutHistory.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...bouncy, delay: 0.1 }}
            className="space-y-3"
          >
            <h2 className="rondo-label text-[var(--ink-low)]">Recent requests</h2>
            <div className="space-y-2">
              {payoutHistory.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between gap-2 rounded-[var(--r-md)] border border-[var(--stroke)] bg-[var(--bg-surface)] p-4 font-body text-xs"
                >
                  <div className="min-w-0">
                    <p className="font-black text-[var(--ink-hi)]">{formatPrice(entry.amount)}</p>
                    <p className="mt-0.5 truncate text-[var(--ink-low)]">
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
