"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, CreditCard, Loader2, Lock, MapPin, ShieldCheck, Zap } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils/format";
import type { Game } from "@/lib/supabase/types";
import { RondoButton } from "@/components/rondo/primitives";

function payIdempotencyKey(gameId: string) {
  const storageKey = `rondo_pay_idem_${gameId}`;
  const existing = sessionStorage.getItem(storageKey);
  if (existing) return existing;
  const key = crypto.randomUUID();
  sessionStorage.setItem(storageKey, key);
  return key;
}

function clearPayIdempotencyKey(gameId: string) {
  sessionStorage.removeItem(`rondo_pay_idem_${gameId}`);
}

function PaymentForm() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const teamIdFromUrl = searchParams.get("teamId");
  const [teamId] = useState<string | null>(teamIdFromUrl);
  const [game, setGame] = useState<Game | null>(null);
  const [balanceCentavos, setBalanceCentavos] = useState(0);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const payLock = useRef(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) { router.push("/login"); return; }
      if (userData.user.is_anonymous) {
        router.push(`/signup?next=/games/${id}/payment`);
        return;
      }
      const [{ data }, { data: balData }] = await Promise.all([
        supabase.from("games").select("*").eq("id", id).single(),
        fetch("/api/wallet/balance").then((r) => r.json()).catch(() => ({ balanceCentavos: 0 })),
      ]);
      if (data) setGame(data as Game);
      if (typeof balData?.balanceCentavos === "number") setBalanceCentavos(balData.balanceCentavos);
      setLoading(false);
    }
    load();
  }, [id, router]);

  async function handlePayOnline() {
    if (!game || paying) return;
    setPaying(true);
    setError(null);
    try {
      const res = await fetch("/api/wallet/topup/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountCentavos: game.price_per_player,
          returnPath: `/games/${id}/payment?teamId=${teamId ?? ""}`,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Payment failed");
      setRedirecting(true);
      window.location.href = json.checkoutUrl;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Payment failed");
      setPaying(false);
    }
  }

  async function handlePayWithWallet() {
    if (!game || payLock.current) return;
    payLock.current = true;
    setPaying(true);
    setError(null);

    try {
      const res = await fetch("/api/wallet/pay-game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameId: game.id,
          teamId,
          idempotencyKey: payIdempotencyKey(game.id),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Payment failed");
      clearPayIdempotencyKey(game.id);
      router.push(`/games/${id}/confirmed`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Payment failed");
      setPaying(false);
      payLock.current = false;
    }
  }

  if (redirecting) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center gap-5 px-6 text-center">
        <Loader2 size={44} className="text-[var(--gold)] animate-spin" />
        <div>
          <p className="text-[var(--ink-hi)] font-black text-xl">Redirecting to payment</p>
          <p className="text-[var(--ink-low)] text-sm mt-1">Do not close this page</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center gap-3 rondo-page">
        <div className="w-8 h-8 border-2 border-[var(--gold)] border-t-transparent rounded-full animate-spin" />
        <p className="text-[var(--ink-low)] text-sm">Loading payment…</p>
      </div>
    );
  }

  if (!game) return null;

  const price = game.price_per_player;
  const hasEnoughBalance = balanceCentavos >= price;

  return (
    <div className="min-h-[100dvh] pb-8 rondo-page">
      <header className="sticky top-0 bg-[var(--bg-page)]/95 backdrop-blur-md border-b border-[var(--stroke)] z-40 px-4 py-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--ink-hi)]"
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="font-heading text-[var(--ink-hi)] font-black text-base uppercase">Secure payment</h1>
          <p className="rondo-meta text-[var(--ink-low)]">PayMongo · Rondo Wallet</p>
        </div>
        <Lock size={18} className="text-[var(--gold)]" aria-hidden />
      </header>

      <div className="px-4 py-6 space-y-5 max-w-lg mx-auto">
        <div className="flex items-center gap-2 rounded-[var(--r-md)] border border-[color-mix(in_oklch,var(--gold)_28%,var(--stroke))] bg-[color-mix(in_oklch,var(--gold)_8%,var(--bg-surface))] px-3 py-2.5">
          <ShieldCheck size={18} className="shrink-0 text-[var(--gold)]" aria-hidden />
          <p className="rondo-meta text-[var(--ink-mid)]">
            Encrypted checkout. Match fees settle in your wallet — never pay organizers in-app.
          </p>
        </div>

        <div className="rondo-surface p-4">
          <p className="font-body text-[var(--ink-low)] text-xs uppercase mb-1">Match</p>
          <p className="font-heading text-[var(--ink-hi)] font-black text-lg">{game.title}</p>
          <p className="font-body text-[var(--ink-low)] text-sm flex items-center gap-1.5 mt-2">
            <MapPin size={12} />
            {game.venue_name}
          </p>
          <div className="flex justify-between items-end mt-4 pt-4 border-t border-[var(--stroke)]">
            <span className="font-body text-[var(--ink-low)] text-sm">Amount due</span>
            <span className="font-heading text-[var(--gold)] font-black text-2xl">{formatPrice(price)}</span>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <p className="rondo-label text-[var(--gold)]">Payment decision</p>
            <h2 className="font-heading text-2xl font-black uppercase text-[var(--ink-hi)]">
              Confirm your spot
            </h2>
          </div>

          <button
            onClick={handlePayOnline}
            disabled={paying}
            className="w-full rounded-[var(--r-md)] border border-[var(--stroke)] bg-[var(--bg-surface)] p-4 text-left transition-all hover:border-[var(--gold)]/40 active:scale-[0.98] disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[var(--gold)]/10 flex items-center justify-center">
                <CreditCard size={18} className="text-[var(--gold)]" />
              </div>
              <div className="flex-1">
                <p className="text-[var(--ink-hi)] font-semibold text-sm">Top up then pay</p>
                <p className="text-[var(--ink-low)] text-xs">
                  GCash, Maya, and card checkout through PayMongo.
                </p>
              </div>
              {paying && (
                <div className="w-4 h-4 border-2 border-[var(--gold)] border-t-transparent rounded-full animate-spin" />
              )}
            </div>
          </button>

          <div className="rounded-[var(--r-md)] border border-[var(--stroke)] bg-[var(--bg-surface)] p-4">
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-body text-[var(--ink-low)] text-xs uppercase">Wallet balance</p>
                <p className="font-heading text-[var(--ink-hi)] font-black text-2xl">{formatPrice(balanceCentavos)}</p>
              </div>
              <Link href={`/wallet?next=/games/${id}/payment?teamId=${teamId ?? ""}`} className="text-[var(--gold)] text-xs font-semibold uppercase shrink-0">
                Top up
              </Link>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--bg-inset)]">
              <div
                className="h-full rounded-full bg-[var(--gold)]"
                style={{ width: `${Math.min(100, Math.round((balanceCentavos / Math.max(price, 1)) * 100))}%` }}
              />
            </div>
            <p className={`mt-2 text-xs ${hasEnoughBalance ? "text-[var(--ok)]" : "text-[var(--ink-low)]"}`}>
              {hasEnoughBalance
                ? "Your wallet covers this match."
                : `${formatPrice(Math.max(price - balanceCentavos, 0))} more needed before wallet payment.`}
            </p>
          </div>
        </div>

        {paying && (
          <div className="rondo-surface border-[var(--gold)]/20 p-4 flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-[var(--gold)] border-t-transparent rounded-full animate-spin shrink-0" />
            <p className="text-[var(--ink-hi)] text-sm">Processing payment…</p>
          </div>
        )}

        <RondoButton onClick={handlePayWithWallet} disabled={paying || !hasEnoughBalance} variant="primary">
          <Zap size={18} aria-hidden />
          Pay {formatPrice(price)}
        </RondoButton>

        {error && (
          <div className="rounded-[var(--r-md)] border border-[color-mix(in_oklch,var(--live)_40%,transparent)] bg-[color-mix(in_oklch,var(--live)_12%,transparent)] p-4">
            <p className="text-[var(--live)] text-sm text-center">{error}</p>
          </div>
        )}

        <p className="font-body text-[var(--ink-low)] text-xs text-center leading-relaxed">
          Secured by PayMongo. Top-ups land in your Rondo Wallet before they are applied to the match.
        </p>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[100dvh] flex items-center justify-center rondo-page">
          <div className="w-2 h-2 rounded-full bg-[var(--gold)] animate-ping" />
        </div>
      }
    >
      <PaymentForm />
    </Suspense>
  );
}
