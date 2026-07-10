"use client";

import { useCallback, useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Plus, Wallet, ArrowLineDown, Clock, ShieldCheck, Lock } from "@phosphor-icons/react";
import { formatPrice, formatRelativeTime } from "@/lib/utils/format";
import { TOPUP_PRESETS_CENTAVOS } from "@/lib/wallet/constants";
import type { WalletTransaction } from "@/lib/supabase/types";
import { RondoButton, RondoSurface, rondoFieldClass } from "@/components/rondo/primitives";

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
      <div className="rondo-page flex min-h-[100dvh] items-center justify-center">
        <div className="h-8 w-32 rounded-[var(--r-pill)] rondo-shimmer" />
      </div>
    );
  }

  return (
    <div className="rondo-page min-h-[100dvh] pb-24">
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-[var(--stroke)] rondo-glass-nav px-4 py-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-11 w-11 items-center justify-center text-[var(--ink-mid)]"
          aria-label="Back"
        >
          <ArrowLeft size={20} weight="bold" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="font-heading text-lg font-black uppercase text-[var(--ink-hi)]">Wallet</h1>
          <p className="rondo-meta text-[var(--ink-low)]">PayMongo secured</p>
        </div>
        <Lock size={18} weight="duotone" className="text-[var(--gold)]" aria-hidden />
      </header>

      <div className="mx-auto max-w-lg space-y-6 px-4 py-6">
        <RondoSurface className="border-[color-mix(in_oklch,var(--gold)_30%,var(--stroke))] bg-[linear-gradient(145deg,color-mix(in_oklch,var(--gold)_14%,transparent),transparent)] p-6">
          <div className="mb-2 flex items-center gap-2">
            <Wallet size={18} weight="duotone" className="text-[var(--gold)]" aria-hidden />
            <span className="rondo-label text-[var(--ink-low)]">Available balance</span>
          </div>
          <p className="font-heading text-4xl font-black text-[var(--ink-hi)]">{formatPrice(balanceCentavos)}</p>
          <div className="mt-3 flex items-start gap-2">
            <ShieldCheck size={16} weight="duotone" className="mt-0.5 shrink-0 text-[var(--gold)]" aria-hidden />
            <p className="rondo-meta text-[var(--ink-mid)]">
              Top up with PayMongo, then pay match fees from here — one balance, no paying organizers in-app.
            </p>
          </div>
        </RondoSurface>

        {topupBanner === "cancelled" && (
          <RondoSurface className="space-y-2 p-4">
            <p className="rondo-body font-semibold text-[var(--ink-hi)]">Top-up cancelled</p>
            <p className="rondo-meta text-[var(--ink-low)]">No money was added. You can try again when ready.</p>
          </RondoSurface>
        )}

        {topupBanner === "failed" && error && (
          <div className="space-y-2 rounded-[var(--r-md)] border border-[color-mix(in_oklch,var(--live)_40%,transparent)] bg-[color-mix(in_oklch,var(--live)_12%,transparent)] p-4">
            <p className="rondo-body font-semibold text-[var(--live)]">Top-up not completed</p>
            <p className="rondo-meta text-[var(--live)]">{error}</p>
          </div>
        )}

        {message && (
          <div className="space-y-1 rounded-[var(--r-md)] border border-[color-mix(in_oklch,var(--ok)_40%,transparent)] bg-[color-mix(in_oklch,var(--ok)_12%,transparent)] p-4">
            <p className="rondo-body font-semibold text-[var(--ok)]">{message}</p>
            {topupReference && (
              <p className="break-all font-mono text-xs text-[var(--ink-mid)]">Ref: {topupReference}</p>
            )}
          </div>
        )}
        {error && !topupBanner && (
          <p className="rounded-[var(--r-md)] border border-[color-mix(in_oklch,var(--live)_40%,transparent)] bg-[color-mix(in_oklch,var(--live)_12%,transparent)] px-4 py-3 text-center rondo-meta text-[var(--live)]">
            {error}
          </p>
        )}

        <section>
          <h2 className="mb-1 font-heading text-sm font-black uppercase text-[var(--ink-hi)]">Top up</h2>
          <p className="rondo-meta mb-4 text-[var(--ink-low)]">
            Add funds via GCash, Maya, or card. Money lands in your Rondo Wallet after payment.
          </p>
          <div className="grid grid-cols-3 gap-2">
            {TOPUP_PRESETS_CENTAVOS.map((amount) => (
              <button
                key={amount}
                type="button"
                disabled={topingUp !== null}
                onClick={() => handleTopUp(amount)}
                className="flex items-center justify-center gap-1 rounded-[var(--r-md)] border border-[var(--stroke)] bg-[var(--bg-surface)] py-3 text-sm font-bold text-[var(--ink-hi)] hover:border-[color-mix(in_oklch,var(--gold)_40%,var(--stroke))] disabled:opacity-50"
              >
                {topingUp === amount ? (
                  <span className="h-4 w-4 rounded-full border-2 border-[var(--gold)] border-t-transparent animate-spin" />
                ) : (
                  <>
                    <Plus size={14} weight="bold" className="text-[var(--gold)]" aria-hidden />
                    {formatPrice(amount)}
                  </>
                )}
              </button>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-heading text-sm font-black uppercase text-[var(--ink-hi)]">Cash out</h2>
            {!showPayoutForm && (
              <button
                type="button"
                onClick={() => {
                  setShowPayoutForm(true);
                  setPayoutSuccess(false);
                  setPayoutError(null);
                }}
                className="flex items-center gap-1.5 rondo-label text-[var(--gold)]"
              >
                <ArrowLineDown size={13} weight="bold" aria-hidden /> Request
              </button>
            )}
          </div>

          <RondoSurface className="mb-3 space-y-1 border-[color-mix(in_oklch,var(--gold)_22%,var(--stroke))] p-4">
            <div className="flex items-start gap-2">
              <ShieldCheck size={16} weight="duotone" className="mt-0.5 shrink-0 text-[var(--gold)]" aria-hidden />
              <p className="rondo-meta leading-relaxed text-[var(--ink-mid)]">
                Top-ups via GCash, Maya, and card are{" "}
                <span className="font-semibold text-[var(--ink-hi)]">real money</span>. Payouts are processed
                manually by the Rondo team and sent via bank transfer within 3–5 business days.
              </p>
            </div>
          </RondoSurface>

          {payoutSuccess && (
            <div className="mb-3 rounded-[var(--r-md)] border border-[color-mix(in_oklch,var(--ok)_40%,transparent)] bg-[color-mix(in_oklch,var(--ok)_12%,transparent)] p-4">
              <p className="rondo-body font-semibold text-[var(--ok)]">Payout request submitted</p>
              <p className="rondo-meta mt-0.5 text-[var(--ink-mid)]">We&apos;ll process it within 3–5 business days.</p>
            </div>
          )}

          {showPayoutForm && !payoutSuccess && (
            <RondoSurface className="mb-3 space-y-3 p-4">
              <div className="space-y-1">
                <label className="rondo-label text-[var(--ink-low)]">Amount (₱)</label>
                <input
                  type="number"
                  placeholder="e.g. 500"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  className={rondoFieldClass}
                />
              </div>
              <div className="space-y-1">
                <label className="rondo-label text-[var(--ink-low)]">Bank name</label>
                <input
                  type="text"
                  placeholder="BDO, BPI, GCash, Maya…"
                  value={payoutBank}
                  onChange={(e) => setPayoutBank(e.target.value)}
                  className={rondoFieldClass}
                />
              </div>
              <div className="space-y-1">
                <label className="rondo-label text-[var(--ink-low)]">Account name</label>
                <input
                  type="text"
                  placeholder="Full name on account"
                  value={payoutName}
                  onChange={(e) => setPayoutName(e.target.value)}
                  className={rondoFieldClass}
                />
              </div>
              <div className="space-y-1">
                <label className="rondo-label text-[var(--ink-low)]">Account number</label>
                <input
                  type="text"
                  placeholder="09xxxxxxxxxx or account number"
                  value={payoutAccount}
                  onChange={(e) => setPayoutAccount(e.target.value)}
                  className={rondoFieldClass}
                />
              </div>
              {payoutError && <p className="rondo-meta text-[var(--live)]">{payoutError}</p>}
              <div className="flex gap-2">
                <RondoButton onClick={() => setShowPayoutForm(false)} variant="secondary" className="flex-1">
                  Cancel
                </RondoButton>
                <RondoButton
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
                      if (!res.ok) {
                        setPayoutError(json.error ?? "Request failed");
                        return;
                      }
                      setPayoutSuccess(true);
                      setShowPayoutForm(false);
                      setPayoutAmount("");
                      setPayoutBank("");
                      setPayoutName("");
                      setPayoutAccount("");
                      await loadWallet();
                    } finally {
                      setPayoutLoading(false);
                    }
                  }}
                  variant="primary"
                  className="flex-1"
                >
                  {payoutLoading ? "Submitting…" : "Submit request"}
                </RondoButton>
              </div>
            </RondoSurface>
          )}

          {payoutRequests.length > 0 && (
            <div className="mb-3 space-y-2">
              {payoutRequests.map((req) => (
                <RondoSurface key={req.id} className="flex items-center gap-3 px-4 py-3">
                  <Clock size={14} weight="duotone" className="shrink-0 text-[var(--ink-low)]" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="rondo-body font-semibold text-[var(--ink-hi)]">
                      {formatPrice(req.amount)} → {req.bank_name}
                    </p>
                    <p className="rondo-meta text-[var(--ink-low)]">
                      {req.bank_account_name} · {formatRelativeTime(req.created_at)}
                    </p>
                  </div>
                  <span
                    className={`rondo-label ${
                      req.status === "paid"
                        ? "text-[var(--ok)]"
                        : req.status === "rejected"
                          ? "text-[var(--live)]"
                          : "text-[var(--gold)]"
                    }`}
                  >
                    {req.status}
                  </span>
                </RondoSurface>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-3 font-heading text-sm font-black uppercase text-[var(--ink-hi)]">Recent activity</h2>
          {transactions.length === 0 ? (
            <p className="rondo-body text-[var(--ink-low)]">No transactions yet. Top up to join paid matches.</p>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx) => (
                <RondoSurface key={tx.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="rondo-body capitalize text-[var(--ink-hi)]">
                      {tx.direction === "credit" ? "Added" : "Spent"} · {tx.source.replaceAll("_", " ")}
                    </p>
                    <p className="rondo-meta text-[var(--ink-low)]">{formatRelativeTime(tx.created_at)}</p>
                  </div>
                  <span
                    className={`shrink-0 font-heading text-sm font-black ${
                      tx.direction === "credit" ? "text-[var(--ok)]" : "text-[var(--ink-hi)]"
                    }`}
                  >
                    {tx.direction === "credit" ? "+" : "−"}
                    {formatPrice(tx.amount)}
                  </span>
                </RondoSurface>
              ))}
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
        <div className="rondo-page flex min-h-[100dvh] items-center justify-center">
          <div className="h-8 w-32 rounded-[var(--r-pill)] rondo-shimmer" />
        </div>
      }
    >
      <WalletContent />
    </Suspense>
  );
}
