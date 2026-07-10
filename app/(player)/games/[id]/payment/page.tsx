"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, CreditCard, Lock, MapPin, ShieldCheck, Wallet } from "@phosphor-icons/react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils/format";
import type { Game } from "@/lib/supabase/types";
import { RondoButton, RondoSurface } from "@/components/rondo/primitives";

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
      if (!userData.user) {
        router.push("/login");
        return;
      }
      if (userData.user.is_anonymous) {
        router.push(`/signup?next=/games/${id}/payment`);
        return;
      }
      const [{ data }, { data: balData }] = await Promise.all([
        supabase.from("games").select("*").eq("id", id).single(),
        fetch("/api/wallet/balance")
          .then((r) => r.json())
          .catch(() => ({ balanceCentavos: 0 })),
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
      <div className="rondo-page flex min-h-[100dvh] flex-col items-center justify-center gap-5 px-6 text-center">
        <div className="h-10 w-10 rounded-full border-2 border-[var(--gold)] border-t-transparent animate-spin" />
        <div>
          <p className="font-heading text-xl font-black uppercase text-[var(--ink-hi)]">Redirecting securely</p>
          <p className="rondo-meta mt-1 text-[var(--ink-low)]">Do not close this page</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rondo-page flex min-h-[100dvh] flex-col items-center justify-center gap-3">
        <div className="h-8 w-32 rounded-[var(--r-pill)] rondo-shimmer" />
        <p className="rondo-meta text-[var(--ink-low)]">Loading payment</p>
      </div>
    );
  }

  if (!game) return null;

  const price = game.price_per_player;
  const hasEnoughBalance = balanceCentavos >= price;

  return (
    <div className="rondo-page min-h-[100dvh] pb-8">
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-[var(--stroke)] rondo-glass-nav px-4 py-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex min-h-11 min-w-11 items-center justify-center text-[var(--ink-hi)]"
          aria-label="Back"
        >
          <ArrowLeft size={20} weight="bold" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="font-heading text-base font-black uppercase text-[var(--ink-hi)]">Secure payment</h1>
          <p className="rondo-meta text-[var(--ink-low)]">PayMongo · Rondo Wallet</p>
        </div>
        <Lock size={18} weight="duotone" className="text-[var(--gold)]" aria-hidden />
      </header>

      <div className="mx-auto max-w-lg space-y-5 px-4 py-6">
        <div className="flex items-center gap-2 rounded-[var(--r-md)] border border-[color-mix(in_oklch,var(--gold)_28%,var(--stroke))] bg-[color-mix(in_oklch,var(--gold)_8%,var(--bg-surface))] px-3 py-2.5">
          <ShieldCheck size={18} weight="duotone" className="shrink-0 text-[var(--gold)]" aria-hidden />
          <p className="rondo-meta text-[var(--ink-mid)]">
            Encrypted checkout. Match fees settle in your wallet — never pay organizers in-app.
          </p>
        </div>

        <RondoSurface className="p-4">
          <p className="rondo-label text-[var(--ink-low)]">Match</p>
          <p className="mt-1 font-heading text-lg font-black uppercase text-[var(--ink-hi)]">{game.title}</p>
          <p className="rondo-meta mt-2 flex items-center gap-1.5 text-[var(--ink-low)]">
            <MapPin size={12} weight="duotone" aria-hidden />
            {game.venue_name}
          </p>
          <div className="mt-4 flex items-end justify-between border-t border-[var(--stroke)] pt-4">
            <span className="rondo-meta text-[var(--ink-low)]">Amount due</span>
            <span className="font-heading text-3xl font-black text-[var(--gold)]">{formatPrice(price)}</span>
          </div>
        </RondoSurface>

        <div className="space-y-3">
          <div>
            <p className="rondo-label text-[var(--gold)]">Payment decision</p>
            <h2 className="font-heading text-2xl font-black uppercase text-[var(--ink-hi)]">Confirm your spot</h2>
          </div>

          <button
            type="button"
            onClick={handlePayOnline}
            disabled={paying}
            className="w-full rounded-[var(--r-md)] border border-[var(--stroke)] bg-[var(--bg-surface)] p-4 text-left transition-colors hover:border-[color-mix(in_oklch,var(--gold)_40%,var(--stroke))] disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--gold-dim)]">
                <CreditCard size={18} weight="duotone" className="text-[var(--gold)]" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <p className="rondo-body font-semibold text-[var(--ink-hi)]">Top up then pay</p>
                <p className="rondo-meta text-[var(--ink-low)]">GCash, Maya, and card via PayMongo</p>
              </div>
            </div>
          </button>

          <RondoSurface className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--bg-inset)]">
                <Wallet size={18} weight="duotone" className="text-[var(--gold)]" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <p className="rondo-label text-[var(--ink-low)]">Wallet balance</p>
                <p className="font-heading text-2xl font-black text-[var(--ink-hi)]">{formatPrice(balanceCentavos)}</p>
              </div>
              <Link
                href={`/wallet?next=/games/${id}/payment?teamId=${teamId ?? ""}`}
                className="rondo-label shrink-0 text-[var(--gold)]"
              >
                Top up
              </Link>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--bg-inset)]">
              <div
                className="h-full rounded-full bg-[var(--gold)]"
                style={{ width: `${Math.min(100, Math.round((balanceCentavos / Math.max(price, 1)) * 100))}%` }}
              />
            </div>
            <p className={`mt-2 rondo-meta ${hasEnoughBalance ? "text-[var(--ok)]" : "text-[var(--ink-low)]"}`}>
              {hasEnoughBalance
                ? "Your wallet covers this match."
                : `${formatPrice(Math.max(price - balanceCentavos, 0))} more needed before wallet payment.`}
            </p>
          </RondoSurface>
        </div>

        {paying && (
          <RondoSurface className="flex items-center gap-3 border-[color-mix(in_oklch,var(--gold)_24%,var(--stroke))] p-4">
            <div className="h-5 w-5 shrink-0 rounded-full border-2 border-[var(--gold)] border-t-transparent animate-spin" />
            <p className="rondo-body text-[var(--ink-mid)]">Processing payment…</p>
          </RondoSurface>
        )}

        <RondoButton onClick={handlePayWithWallet} disabled={paying || !hasEnoughBalance} variant="primary">
          Pay {formatPrice(price)}
        </RondoButton>

        {error && (
          <div className="rounded-[var(--r-md)] border border-[color-mix(in_oklch,var(--live)_40%,transparent)] bg-[color-mix(in_oklch,var(--live)_12%,transparent)] p-4">
            <p className="rondo-meta text-center text-[var(--live)]">{error}</p>
          </div>
        )}

        <p className="rondo-meta text-center leading-relaxed text-[var(--ink-low)]">
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
        <div className="rondo-page flex min-h-[100dvh] items-center justify-center">
          <div className="h-8 w-32 rounded-[var(--r-pill)] rondo-shimmer" />
        </div>
      }
    >
      <PaymentForm />
    </Suspense>
  );
}
