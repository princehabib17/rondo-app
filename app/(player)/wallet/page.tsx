"use client";

import { useCallback, useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Plus, Wallet } from "lucide-react";
import { formatPrice, formatRelativeTime } from "@/lib/utils/format";
import { TOPUP_PRESETS_CENTAVOS } from "@/lib/wallet/constants";
import type { WalletTransaction } from "@/lib/supabase/types";

const TOPUP_SESSION_KEY = "rondo_pending_topup_session";
const TOPUP_REFERENCE_KEY = "rondo_pending_topup_reference";

function WalletContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [balanceCentavos, setBalanceCentavos] = useState(0);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [topingUp, setTopingUp] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [topupReference, setTopupReference] = useState<string | null>(null);
  const [topupBanner, setTopupBanner] = useState<"cancelled" | "failed" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadWallet = useCallback(async () => {
    const res = await fetch("/api/wallet/balance");
    const json = await res.json();
    if (!res.ok) {
      if (res.status === 401) {
        router.push("/login?next=/wallet");
        return;
      }
      throw new Error(json.error ?? "Failed to load wallet");
    }
    setBalanceCentavos(json.balanceCentavos ?? 0);
    setTransactions(json.transactions ?? []);
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
      <div className="min-h-[100dvh] flex items-center justify-center bg-black">
        <div className="w-2 h-2 rounded-full bg-rondo-accent animate-ping" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] rondo-page pb-24">
      <header className="sticky top-0 z-40 rondo-glass-nav border-b border-white/5 px-4 py-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="w-10 h-10 flex items-center justify-center text-white/80"
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-heading text-white font-black italic text-lg uppercase">Wallet</h1>
      </header>

      <div className="px-4 py-6 space-y-6 max-w-lg mx-auto">
        <div className="rondo-surface border-rondo-accent/30 bg-gradient-to-br from-rondo-accent/15 to-transparent p-6">
          <div className="flex items-center gap-2 mb-2">
            <Wallet size={18} className="text-rondo-accent" />
            <span className="font-body text-white/60 text-xs uppercase tracking-wider">Available balance</span>
          </div>
          <p className="font-heading text-white font-black text-4xl">{formatPrice(balanceCentavos)}</p>
          <p className="font-body text-white/50 text-xs mt-2">
            Top up with PayMongo, then pay match fees from here — one balance, no paying the organizer directly in the app.
          </p>
        </div>

        {topupBanner === "cancelled" && (
          <div className="bg-[#141414] border border-white/15 rounded-xl p-4 space-y-2">
            <p className="text-white font-semibold text-sm">Top-up cancelled</p>
            <p className="text-white/50 text-xs">No money was added. You can try again when ready.</p>
          </div>
        )}

        {topupBanner === "failed" && error && (
          <div className="bg-red-950/40 border border-red-800/50 rounded-xl p-4 space-y-2">
            <p className="text-red-200 font-semibold text-sm">Top-up not completed</p>
            <p className="text-red-200/80 text-xs">{error}</p>
          </div>
        )}

        {message && (
          <div className="bg-green-950/40 border border-green-800/50 rounded-xl p-4 space-y-1">
            <p className="text-green-400 text-sm font-semibold">{message}</p>
            {topupReference && (
              <p className="text-green-200/70 text-xs font-mono break-all">Ref: {topupReference}</p>
            )}
          </div>
        )}
        {error && !topupBanner && (
          <p className="text-red-400 text-sm text-center bg-red-950/30 border border-red-800/40 rounded-xl py-3 px-4">
            {error}
          </p>
        )}

        <section>
          <h2 className="font-heading text-white font-black text-sm uppercase mb-3">Top up</h2>
          <p className="font-body text-white/50 text-xs mb-4">
            Add funds via GCash, Maya, or card. Money lands in your Rondo Wallet right after payment.
          </p>
          <div className="grid grid-cols-3 gap-2">
            {TOPUP_PRESETS_CENTAVOS.map((amount) => (
              <button
                key={amount}
                type="button"
                disabled={topingUp !== null}
                onClick={() => handleTopUp(amount)}
                className="bg-[#141414] border border-white/10 hover:border-rondo-accent/50 rounded-xl py-3 text-white font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-1"
              >
                {topingUp === amount ? (
                  <span className="w-4 h-4 border-2 border-rondo-accent border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Plus size={14} className="text-rondo-accent" />
                    {formatPrice(amount)}
                  </>
                )}
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-heading text-white font-black text-sm uppercase mb-3">Recent activity</h2>
          {transactions.length === 0 ? (
            <p className="font-body text-white/40 text-sm">No transactions yet. Top up to join paid matches.</p>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="bg-[#141414] border border-white/10 rounded-xl px-4 py-3 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="font-body text-white text-sm capitalize">
                      {tx.direction === "credit" ? "Added" : "Spent"} · {tx.source.replaceAll("_", " ")}
                    </p>
                    <p className="font-body text-white/40 text-xs">{formatRelativeTime(tx.created_at)}</p>
                  </div>
                  <span
                    className={`font-heading font-black text-sm shrink-0 ${
                      tx.direction === "credit" ? "text-green-400" : "text-white"
                    }`}
                  >
                    {tx.direction === "credit" ? "+" : "−"}
                    {formatPrice(tx.amount)}
                  </span>
                </div>
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
        <div className="min-h-[100dvh] flex items-center justify-center bg-black">
          <div className="w-2 h-2 rounded-full bg-rondo-accent animate-ping" />
        </div>
      }
    >
      <WalletContent />
    </Suspense>
  );
}
