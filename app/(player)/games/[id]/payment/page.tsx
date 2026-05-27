"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, Wallet, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils/format";
import type { Game } from "@/lib/supabase/types";

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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user?.id || userData.user.is_anonymous) {
        router.push(`/signup?next=/games/${id}/payment`);
        return;
      }

      const [{ data: gameData }, walletRes, { data: playerRow }] = await Promise.all([
        supabase.from("games").select("*").eq("id", id).single(),
        fetch("/api/wallet/balance"),
        supabase
          .from("game_players")
          .select("team_id")
          .eq("game_id", id)
          .eq("user_id", userData.user.id)
          .maybeSingle(),
      ]);

      if (gameData) setGame(gameData as Game);
      if (!teamIdFromUrl && playerRow?.team_id) {
        setTeamId(playerRow.team_id);
      }

      const walletJson = await walletRes.json();
      if (walletRes.ok) {
        setBalanceCentavos(walletJson.balanceCentavos ?? 0);
      }
      setLoading(false);
    }
    load();
  }, [id, router]);

  async function handlePayWithWallet() {
    if (!game) return;
    setPaying(true);
    setError(null);

    try {
      const res = await fetch("/api/wallet/pay-game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId: game.id, teamId }),
      });
      const json = await res.json();

      if (!res.ok) {
        if (json.code === "INSUFFICIENT_BALANCE") {
          setError(json.error ?? "Insufficient balance");
        } else {
          setError(json.error ?? "Payment failed");
        }
        setPaying(false);
        return;
      }

      router.push(`/games/${id}/confirmed?teamId=${teamId ?? ""}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Payment failed");
      setPaying(false);
    }
  }

  async function handlePayAtVenue() {
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const { error: venueError } = await supabase.from("game_players").upsert(
      {
        game_id: id,
        user_id: userData.user.id,
        team_id: teamId,
        payment_status: "venue",
      },
      { onConflict: "game_id,user_id" }
    );
    if (venueError) {
      setError(venueError.message);
      return;
    }
    router.push(`/games/${id}/invite`);
  }

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center">
        <div className="w-2 h-2 rounded-full bg-rondo-accent animate-ping" />
      </div>
    );
  }

  if (!game) return null;

  const price = game.price_per_player;
  const canPay = balanceCentavos >= price;
  const shortfall = price - balanceCentavos;

  return (
    <div className="min-h-[100dvh] pb-8 bg-black">
      <header className="sticky top-0 bg-black/95 backdrop-blur-md border-b border-white/5 z-40 px-4 py-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center text-white"
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-heading text-white font-black italic text-base uppercase">Confirm payment</h1>
      </header>

      <div className="px-4 py-6 space-y-5 max-w-lg mx-auto">
        <div className="bg-[#141414] border border-white/10 rounded-xl p-4">
          <p className="font-body text-white/50 text-xs uppercase mb-1">Match</p>
          <p className="font-heading text-white font-black text-lg">{game.title}</p>
          <p className="font-body text-white/50 text-sm flex items-center gap-1.5 mt-2">
            <MapPin size={12} />
            {game.venue_name}
          </p>
          <div className="flex justify-between items-end mt-4 pt-4 border-t border-white/10">
            <span className="font-body text-white/50 text-sm">Slot fee</span>
            <span className="font-heading text-rondo-accent font-black text-2xl">{formatPrice(price)}</span>
          </div>
        </div>

        <div className="bg-[#141414] border border-rondo-accent/30 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-rondo-accent/15 flex items-center justify-center">
              <Wallet size={18} className="text-rondo-accent" />
            </div>
            <div>
              <p className="font-body text-white/50 text-xs">Rondo Wallet</p>
              <p className="font-heading text-white font-black text-xl">{formatPrice(balanceCentavos)}</p>
            </div>
          </div>
          <Link href="/wallet" className="text-rondo-accent text-xs font-semibold uppercase">
            Top up
          </Link>
        </div>

        {!canPay && (
          <div className="bg-amber-950/30 border border-amber-700/40 rounded-xl p-4 text-center space-y-3">
            <p className="font-body text-amber-200/90 text-sm">
              You need {formatPrice(shortfall)} more to join this game.
            </p>
            <Link
              href={`/wallet?next=/games/${id}/payment?teamId=${teamId ?? ""}`}
              className="inline-flex items-center justify-center w-full bg-rondo-accent text-black font-heading font-black uppercase tracking-widest text-xs py-3 rounded-xl"
            >
              Add funds to wallet
            </Link>
          </div>
        )}

        <button
          type="button"
          onClick={handlePayWithWallet}
          disabled={paying || !canPay}
          className="w-full bg-rondo-accent text-black font-heading font-black uppercase tracking-widest text-sm py-4 rounded-xl disabled:opacity-40 flex items-center justify-center gap-2 min-h-[52px]"
        >
          {paying ? (
            <span className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Zap size={18} />
              Pay {formatPrice(price)} with wallet
            </>
          )}
        </button>

        {game.payment_type === "venue" && (
          <button
            type="button"
            onClick={handlePayAtVenue}
            className="w-full border border-white/15 text-white font-body text-sm py-4 rounded-xl"
          >
            Pay at venue instead
          </button>
        )}

        {error && <p className="text-red-400 text-sm text-center">{error}</p>}

        <p className="font-body text-white/35 text-xs text-center leading-relaxed">
          Payment stays in Rondo. Top-ups use PayMongo securely; match fees are deducted instantly from your wallet.
        </p>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[100dvh] flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-rondo-accent animate-ping" />
        </div>
      }
    >
      <PaymentForm />
    </Suspense>
  );
}
