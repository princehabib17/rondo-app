"use client";

import { useCallback, useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Wallet, ArrowDownToLine, ArrowDownLeft, ArrowUpRight, Clock } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { describeWalletTransaction } from "@/lib/wallet/describe";
import { cn } from "@/lib/utils";
import { formatPrice, formatRelativeTime } from "@/lib/utils/format";
import { TOPUP_PRESETS_CENTAVOS } from "@/lib/wallet/constants";
import type { WalletTransaction } from "@/lib/supabase/types";

const TOPUP_SESSION_KEY = "rondo_pending_topup_session";
const TOPUP_REFERENCE_KEY = "rondo_pending_topup_reference";

interface PayoutRequest {
  id: string;
  amount: number;
  status: string;
  bank_name: string;
  bank_account_name: string;
  note: string | null;
  created_at: string;
}

function WalletContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [balanceCentavos, setBalanceCentavos] = useState(0);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [topingUp, setTopingUp] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [topupReference, setTopupReference] = useState<string | null>(null);
  const [topupBanner, setTopupBanner] = useState<"cancelled" | "failed" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPayoutForm, setShowPayoutForm] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutBank, setPayoutBank] = useState("");
  const [payoutName, setPayoutName] = useState("");
  const [payoutAccount, setPayoutAccount] = useState("");
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutError, setPayoutError] = useState<string | null>(null);
  const [payoutSuccess, setPayoutSuccess] = useState(false);

  const loadWallet = useCallback(async () => {
    const [balRes, payoutRes] = await Promise.all([
      fetch("/api/wallet/balance"),
      fetch("/api/wallet/payout"),
    ]);
    const balJson = await balRes.json();
    if (!balRes.ok) {
      if (balRes.status === 401) {
        router.push("/login?next=/wallet");
        return;
      }
      throw new Error(balJson.error ?? "Failed to load wallet");
    }
    setBalanceCentavos(balJson.balanceCentavos ?? 0);
    setTransactions(balJson.transactions ?? []);
    if (payoutRes.ok) {
      const payoutJson = await payoutRes.json();
      setPayoutRequests(payoutJson.requests ?? []);
    }
  }, [router]);

  const confirmPendingTopUp = useCallback(async () => {
    const sessionId = sessionStorage.getItem(TOPUP_SESSION_KEY);
    if (!sessionId) return false;

    const res = await fetch("/api/wallet/topup/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    });
    const json = await res.json();

    if (json.status === "credited") {
      sessionStorage.removeItem(TOPUP_SESSION_KEY);
      setBalanceCentavos(json.balanceCentavos ?? balanceCentavos);
      const ref = json.paymentReference as string | undefined;
      if (ref) {
        setTopupReference(ref);
        sessionStorage.setItem(TOPUP_REFERENCE_KEY, ref);
      }
      setMessage(`Added ${formatPrice(json.amountCentavos ?? 0)} to your wallet`);
      setTopupBanner(null);
      return true;
    }

    if (json.status === "pending") return false;

    sessionStorage.removeItem(TOPUP_SESSION_KEY);
    setTopupBanner("failed");
    setError(json.error ?? "Top-up could not be confirmed. If you were charged, contact Help with your receipt.");
    return false;
  }, [balanceCentavos]);

  useEffect(() => {
    async function init() {
      try {
        await loadWallet();

        if (searchParams.get("topup") === "success") {
          let credited = await confirmPendingTopUp();
          if (!credited) {
            for (let i = 0; i < 8 && !credited; i++) {
              await new Promise((r) => setTimeout(r, 2000));
              credited = await confirmPendingTopUp();
              if (credited) await loadWallet();
            }
          } else {
            await loadWallet();
          }
          const returnTo = searchParams.get("next");
          router.replace(returnTo && returnTo.startsWith("/") ? returnTo : "/wallet");
        }

        if (searchParams.get("topup") === "cancelled") {
          sessionStorage.removeItem(TOPUP_SESSION_KEY);
          sessionStorage.removeItem(TOPUP_REFERENCE_KEY);
          setTopupBanner("cancelled");
          setMessage(null);
          setError(null);
          const returnTo = searchParams.get("next");
          router.replace(returnTo && returnTo.startsWith("/") ? returnTo : "/wallet");
        }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to load wallet");
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [loadWallet, confirmPendingTopUp, searchParams, router]);

  async function handleTopUp(amountCentavos: number) {
    setTopingUp(amountCentavos);
    setError(null);
    try {
      const returnPath = searchParams.get("next");
      const res = await fetch("/api/wallet/topup/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountCentavos,
          ...(returnPath && returnPath.startsWith("/") ? { returnPath } : {}),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Top-up failed");
      if (json.sessionId) {
        sessionStorage.setItem(TOPUP_SESSION_KEY, json.sessionId);
      }
      window.location.href = json.checkoutUrl;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Top-up failed");
      setTopingUp(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-[var(--bg-page)]">
        <div className="w-2 h-2 rounded-full bg-[var(--gold)] animate-ping" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] rondo-page">
      <PageHeader title="Wallet" subtitle="Secured by PayMongo" back fallbackHref="/profile" />

      <div className="px-4 py-6 space-y-6 max-w-lg mx-auto">
        <div className="relative overflow-hidden rounded-[var(--r-lg)] border border-[var(--stroke)] rondo-floodlight-scene p-6">
          <div className="flex items-center gap-2">
            <Wallet size={16} className="text-[var(--ink-low)]" aria-hidden />
            <span className="rondo-label text-[var(--ink-low)]">Available balance</span>
          </div>
          <p
            className={`mt-3 font-heading text-[3.5rem] font-bold leading-none tabular-nums ${balanceCentavos < 0 ? "text-[var(--live)]" : "text-[var(--ink-hi)]"}`}
          >
            {balanceCentavos < 0 ? `-${formatPrice(-balanceCentavos)}` : formatPrice(balanceCentavos)}
          </p>
          <p className="mt-3 max-w-xs rondo-meta text-[var(--ink-mid)]">
            {balanceCentavos < 0
              ? "Refunds for a match you cancelled came to more than your balance. Earnings from your next matches cover it first, and cash-outs open again once you're back above zero."
              : "Top up once, then pay any match in two taps. You never send money to an organizer directly."}
          </p>
        </div>

        {topupBanner === "cancelled" && (
          <div className="bg-[var(--bg-surface)] border border-[var(--stroke)] rounded-[var(--r-md)] p-4 space-y-2">
            <p className="text-[var(--ink-hi)] font-semibold text-sm">Top-up cancelled</p>
            <p className="text-[var(--ink-low)] text-xs">No money was added. You can try again when ready.</p>
          </div>
        )}

        {topupBanner === "failed" && error && (
          <div className="bg-[var(--live)]/10 border border-[var(--live)]/40 rounded-[var(--r-md)] p-4 space-y-2">
            <p className="text-[var(--live)] font-semibold text-sm">Top-up not completed</p>
            <p className="text-[var(--live)]/80 text-xs">{error}</p>
          </div>
        )}

        {message && (
          <div className="bg-[var(--ok)]/10 border border-[var(--ok)]/40 rounded-[var(--r-md)] p-4 space-y-1">
            <p className="text-[var(--ok)] text-sm font-semibold">{message}</p>
            {topupReference && (
              <p className="text-[var(--ok)]/70 text-xs font-mono break-all">Ref: {topupReference}</p>
            )}
          </div>
        )}
        {error && !topupBanner && (
          <p className="text-[var(--live)] text-sm text-center bg-[var(--live)]/10 border border-[var(--live)]/40 rounded-[var(--r-md)] py-3 px-4">
            {error}
          </p>
        )}

        <section>
          <h2 className="mb-1 rondo-label text-[var(--ink-low)]">Top up</h2>
          <p className="mb-3 rondo-meta text-[var(--ink-low)]">GCash, Maya, or card. Lands in your wallet right after payment.</p>
          <div className="grid grid-cols-3 gap-2">
            {TOPUP_PRESETS_CENTAVOS.map((amount) => (
              <button
                key={amount}
                type="button"
                disabled={topingUp !== null}
                onClick={() => handleTopUp(amount)}
                className="flex min-h-12 items-center justify-center gap-1 rounded-[var(--r-md)] border border-[var(--stroke)] bg-[var(--bg-surface)] font-heading text-lg font-bold tabular-nums text-[var(--ink-hi)] transition-[border-color,transform] hover:border-[color-mix(in_oklch,var(--gold)_50%,var(--stroke))] active:scale-[0.97] disabled:opacity-50"
              >
                {topingUp === amount ? (
                  <span className="w-4 h-4 border-2 border-[var(--gold)] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Plus size={14} className="text-[var(--ink-low)]" aria-hidden />
                    {formatPrice(amount)}
                  </>
                )}
              </button>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="rondo-label text-[var(--ink-low)]">Cash out</h2>
            {!showPayoutForm && (
              <button
                type="button"
                onClick={() => { setShowPayoutForm(true); setPayoutSuccess(false); setPayoutError(null); }}
                className="inline-flex min-h-11 items-center gap-1.5 rondo-meta font-bold text-[var(--ink-mid)] hover:text-[var(--ink-hi)]"
              >
                <ArrowDownToLine size={13} /> Request
              </button>
            )}
          </div>

          <p className="mb-3 rondo-meta text-[var(--ink-low)]">
            Your balance is real money. The Rondo team sends payouts by bank transfer within 3 to 5 business days.
          </p>

          {payoutSuccess && (
            <div className="bg-[var(--ok)]/10 border border-[var(--ok)]/40 rounded-[var(--r-md)] p-4 mb-3">
              <p className="text-[var(--ok)] text-sm font-semibold">Payout request submitted</p>
              <p className="text-[var(--ok)]/70 text-xs mt-0.5">We&apos;ll process it within 3–5 business days.</p>
            </div>
          )}

          {showPayoutForm && !payoutSuccess && (
            <div className="bg-[var(--bg-surface)] border border-[var(--stroke)] rounded-[var(--r-md)] p-4 space-y-3 mb-3">
              <div className="space-y-1">
                <label className="font-heading text-[var(--ink-mid)] text-[10px] uppercase tracking-wider">Amount (₱)</label>
                <input
                  type="number"
                  placeholder="e.g. 500"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  className="w-full bg-[var(--bg-inset)] text-[var(--ink-hi)] font-body text-sm px-4 py-3 rounded-[var(--r-md)] border-0 focus:outline-none focus:ring-2 focus:ring-[color-mix(in_oklch,var(--gold)_50%,transparent)] placeholder:text-[var(--ink-low)]"
                />
              </div>
              <div className="space-y-1">
                <label className="font-heading text-[var(--ink-mid)] text-[10px] uppercase tracking-wider">Bank Name</label>
                <input
                  type="text"
                  placeholder="BDO, BPI, GCash, Maya…"
                  value={payoutBank}
                  onChange={(e) => setPayoutBank(e.target.value)}
                  className="w-full bg-[var(--bg-inset)] text-[var(--ink-hi)] font-body text-sm px-4 py-3 rounded-[var(--r-md)] border-0 focus:outline-none focus:ring-2 focus:ring-[color-mix(in_oklch,var(--gold)_50%,transparent)] placeholder:text-[var(--ink-low)]"
                />
              </div>
              <div className="space-y-1">
                <label className="font-heading text-[var(--ink-mid)] text-[10px] uppercase tracking-wider">Account Name</label>
                <input
                  type="text"
                  placeholder="Full name on account"
                  value={payoutName}
                  onChange={(e) => setPayoutName(e.target.value)}
                  className="w-full bg-[var(--bg-inset)] text-[var(--ink-hi)] font-body text-sm px-4 py-3 rounded-[var(--r-md)] border-0 focus:outline-none focus:ring-2 focus:ring-[color-mix(in_oklch,var(--gold)_50%,transparent)] placeholder:text-[var(--ink-low)]"
                />
              </div>
              <div className="space-y-1">
                <label className="font-heading text-[var(--ink-mid)] text-[10px] uppercase tracking-wider">Account Number</label>
                <input
                  type="text"
                  placeholder="09xxxxxxxxxx or account number"
                  value={payoutAccount}
                  onChange={(e) => setPayoutAccount(e.target.value)}
                  className="w-full bg-[var(--bg-inset)] text-[var(--ink-hi)] font-body text-sm px-4 py-3 rounded-[var(--r-md)] border-0 focus:outline-none focus:ring-2 focus:ring-[color-mix(in_oklch,var(--gold)_50%,transparent)] placeholder:text-[var(--ink-low)]"
                />
              </div>
              {payoutError && (
                <p className="text-[var(--live)] text-xs">{payoutError}</p>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowPayoutForm(false)}
                  className="flex-1 py-3 rounded-[var(--r-md)] border border-[var(--stroke)] text-[var(--ink-low)] text-xs font-bold uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={payoutLoading}
                  onClick={async () => {
                    setPayoutLoading(true);
                    setPayoutError(null);
                    try {
                      const res = await fetch("/api/wallet/payout", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          amountCentavos: Math.round(parseFloat(payoutAmount) * 100),
                          bankName: payoutBank,
                          bankAccountName: payoutName,
                          bankAccountNumber: payoutAccount,
                        }),
                      });
                      const json = await res.json();
                      if (!res.ok) { setPayoutError(json.error ?? "Request failed"); return; }
                      setPayoutSuccess(true);
                      setShowPayoutForm(false);
                      setPayoutAmount(""); setPayoutBank(""); setPayoutName(""); setPayoutAccount("");
                      await loadWallet();
                    } finally {
                      setPayoutLoading(false);
                    }
                  }}
                  className="flex-1 py-3 rounded-[var(--r-md)] bg-[var(--gold)] text-[var(--gold-ink)] text-xs font-black uppercase tracking-wider disabled:opacity-50"
                >
                  {payoutLoading ? "Submitting…" : "Submit Request"}
                </button>
              </div>
            </div>
          )}

          {payoutRequests.length > 0 && (
            <div className="space-y-2 mb-3">
              {payoutRequests.map((req) => (
                <div key={req.id} className="bg-[var(--bg-surface)] border border-[var(--stroke)] rounded-[var(--r-md)] px-4 py-3 flex items-center gap-3">
                  <Clock size={14} className="text-[var(--ink-low)] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[var(--ink-hi)] text-sm font-semibold">{formatPrice(req.amount)} → {req.bank_name}</p>
                    <p className="text-[var(--ink-low)] text-xs">{req.bank_account_name} · {formatRelativeTime(req.created_at)}</p>
                  </div>
                  <span className={`text-xs font-bold uppercase ${
                    req.status === "paid" ? "text-[var(--ok)]" :
                    req.status === "rejected" ? "text-[var(--live)]" :
                    "text-[var(--gold)]/80"
                  }`}>
                    {req.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-3 rondo-label text-[var(--ink-low)]">Recent activity</h2>
          {transactions.length === 0 ? (
            <p className="rounded-[var(--r-md)] border border-dashed border-[var(--stroke)] px-4 py-5 rondo-meta text-[var(--ink-low)]">
              No activity yet. Top up once and pay for any match in two taps.
            </p>
          ) : (
            <div className="divide-y divide-[var(--stroke)] overflow-hidden rounded-[var(--r-md)] border border-[var(--stroke)] bg-[var(--bg-surface)]">
              {transactions.map((tx) => {
                const label = describeWalletTransaction(tx as WalletTransaction & { game?: { title: string } | null });
                return (
                  <div key={tx.id} className="flex min-h-16 items-center gap-3 px-4 py-3">
                    <span
                      className={cn(
                        "grid size-9 shrink-0 place-items-center rounded-[var(--r-pill)]",
                        tx.direction === "credit"
                          ? "bg-[color-mix(in_oklch,var(--ok)_16%,transparent)] text-[var(--ok)]"
                          : "bg-[var(--bg-inset)] text-[var(--ink-mid)]"
                      )}
                    >
                      {tx.direction === "credit" ? <ArrowDownLeft size={16} aria-hidden /> : <ArrowUpRight size={16} aria-hidden />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate rondo-body text-[var(--ink-hi)]">{label.title}</p>
                      <p className="truncate rondo-meta text-[var(--ink-low)]">
                        {label.detail ? `${label.detail} · ` : ""}
                        {formatRelativeTime(tx.created_at)}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 font-heading text-base font-bold tabular-nums",
                        tx.direction === "credit" ? "text-[var(--ok)]" : "text-[var(--ink-hi)]"
                      )}
                    >
                      {tx.direction === "credit" ? "+" : "\u2212"}
                      {formatPrice(tx.amount)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default function WalletPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[100dvh] flex items-center justify-center bg-[var(--bg-page)]">
          <div className="w-2 h-2 rounded-full bg-[var(--gold)] animate-ping" />
        </div>
      }
    >
      <WalletContent />
    </Suspense>
  );
}
