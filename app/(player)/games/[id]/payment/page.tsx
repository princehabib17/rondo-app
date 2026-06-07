"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, CreditCard, Loader2, MapPin, Shield, Zap } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { isGuestUser } from "@/lib/auth/is-guest";
import { formatPrice } from "@/lib/utils/format";
import type { Game } from "@/lib/supabase/types";

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
  const [teamId, setTeamId] = useState<string | null>(teamIdFromUrl);
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
      const { data } = await supabase.from("games").select("*").eq("id", id).single();
      if (data) setGame(data as Game);
      setLoading(false);
    }
    load();
  }, [id, router]);

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
      setRedirecting(true);
      window.location.href = json.checkoutUrl;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Payment failed");
      setPaying(false);
      payLock.current = false;
    }
  }

  async function handlePayAtVenue() {
    if (!game || paying) return;
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;
    if (userData.user.is_anonymous) {
      router.push(`/signup?next=/games/${id}/payment`);
      return;
    }
    setPaying(true);
    setError(null);
    try {
      const { error: joinError } = await supabase.from("game_players").upsert(
        {
          game_id: id,
          user_id: userData.user.id,
          team_id: teamId,
          payment_status: "venue",
        },
        { onConflict: "game_id,user_id" }
      );
      if (joinError) throw new Error(joinError.message);
      await pushInAppNotification({
        userId: userData.user.id,
        type: "join_confirmed",
        title: "Joined with pay-at-venue",
        body: `You're in ${game.title}.`,
        link: `/games/${id}`,
      });
      router.push(`/games/${id}/invite`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not join. Please try again.");
      setPaying(false);
    }
  }

  if (redirecting) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center gap-5 px-6 text-center">
        <Loader2 size={44} className="text-rondo-yellow animate-spin" />
        <div>
          <p className="text-white font-black text-xl">Redirecting to payment</p>
          <p className="text-muted-foreground text-sm mt-1">Do not close this page</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center gap-3 rondo-page">
        <div className="w-8 h-8 border-2 border-rondo-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-white/50 text-sm">Loading payment…</p>
      </div>
    );
  }

  if (!game) return null;

  const price = game.price_per_player;

  return (
    <div className="min-h-[100dvh] pb-8 rondo-page">
      <header className="sticky top-0 bg-black/95 backdrop-blur-md border-b border-white/5 z-40 px-4 py-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center text-white"
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-heading text-white font-black italic text-base uppercase">Pay from wallet</h1>
      </header>

      <div className="px-4 py-6 space-y-5 max-w-lg mx-auto">
        <div className="rondo-surface p-4">
          <p className="font-body text-white/50 text-xs uppercase mb-1">Match</p>
          <p className="font-heading text-white font-black text-lg">{game.title}</p>
          <p className="font-body text-white/50 text-sm flex items-center gap-1.5 mt-2">
            <MapPin size={12} />
            {game.venue_name}
          </p>
          <div className="flex justify-between items-end mt-4 pt-4 border-t border-white/10">
            <span className="font-body text-white/50 text-sm">Price</span>
            <span className="font-heading text-rondo-accent font-black text-2xl">{formatPrice(price)}</span>
          </div>
        </div>

        {/* Payment options */}
        <div className="space-y-3">
          <h2 className="text-white font-bold text-base">Select Payment Method</h2>

          <button
            onClick={handlePayOnline}
            disabled={paying}
            className="w-full bg-card border border-border hover:border-rondo-yellow/40 rounded-xl p-4 text-left transition-all cursor-pointer active:scale-[0.98] disabled:opacity-50 min-h-[44px]"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rondo-yellow/10 flex items-center justify-center">
                <CreditCard size={18} className="text-rondo-yellow" />
              </div>
              <div className="flex-1">
                <p className="text-white font-semibold text-sm">Pay Online</p>
                <p className="text-muted-foreground text-xs">
                  GCash, Maya, credit/debit card via PayMongo
                </p>
              </div>
              {paying && (
                <div className="w-4 h-4 border-2 border-rondo-yellow border-t-transparent rounded-full animate-spin" />
              )}
            </div>
          </button>

          <div className="rondo-surface p-4 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-body text-white/50 text-xs uppercase">You have</p>
              <p className="font-heading text-white font-black text-2xl">{formatPrice(balanceCentavos)}</p>
            </div>
            <Link href={`/wallet?next=/games/${id}/payment?teamId=${teamId ?? ""}`} className="text-rondo-accent text-xs font-semibold uppercase shrink-0">
              Top up
            </Link>
          </div>
        </div>

        {paying && (
          <div className="rondo-surface border-rondo-accent/20 p-4 flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-rondo-accent border-t-transparent rounded-full animate-spin shrink-0" />
            <p className="text-white/80 text-sm">Processing payment…</p>
          </div>
        )}

        <button
          type="button"
          onClick={handlePayWithWallet}
          disabled={paying}
          className="w-full bg-rondo-accent text-black font-heading font-black uppercase tracking-widest text-sm py-4 rounded-xl disabled:opacity-40 flex items-center justify-center gap-2 min-h-[52px]"
        >
          {!paying && (
            <>
              <Zap size={18} />
              Pay {formatPrice(price)}
            </>
          )}
        </button>

        {error && (
          <div className="bg-red-950/40 border border-red-800/50 rounded-xl p-4">
            <p className="text-red-200 text-sm text-center">{error}</p>
          </div>
        )}

        <p className="font-body text-white/35 text-xs text-center leading-relaxed">
          Match fees come from your Rondo Wallet. Top-ups use PayMongo (GCash, Maya, card) — that money lands in your wallet, not straight to the organizer.
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
          <div className="w-2 h-2 rounded-full bg-rondo-accent animate-ping" />
        </div>
      }
    >
      <PaymentForm />
    </Suspense>
  );
}
