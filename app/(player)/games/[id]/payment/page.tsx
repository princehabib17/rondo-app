"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, CreditCard, MapPin, Shield } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils/format";
import type { Game } from "@/lib/supabase/types";
import { pushInAppNotification } from "@/lib/notifications";

function PaymentForm() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const teamId = searchParams.get("teamId");
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user?.is_anonymous) {
        router.push(`/signup?next=/games/${id}/payment`);
        return;
      }
      setIsGuest(Boolean(userData.user?.is_anonymous));
      const { data } = await supabase.from("games").select("*").eq("id", id).single();
      if (data) setGame(data as Game);
      setLoading(false);
    }
    load();
  }, [id]);

  async function handlePayOnline() {
    if (!game) return;
    setPaying(true);
    setError(null);
    try {
      const res = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId: game.id, teamId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Payment failed");
      window.location.href = json.checkoutUrl;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Payment failed");
      setPaying(false);
    }
  }

  async function handlePayAtVenue() {
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;
    if (userData.user.is_anonymous) {
      router.push(`/signup?next=/games/${id}/payment`);
      return;
    }
    await supabase.from("game_players").insert({
      game_id: id,
      user_id: userData.user.id,
      team_id: teamId,
      payment_status: "venue",
    });
    await pushInAppNotification({
      userId: userData.user.id,
      type: "join_confirmed",
      title: "Joined with pay-at-venue",
      body: `You're in ${game?.title ?? "the game"}.`,
      link: `/games/${id}`,
    });
    router.push(`/games/${id}/invite`);
  }

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <div className="h-32 bg-muted rounded-xl animate-pulse" />
        <div className="h-12 bg-muted rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!game) return null;

  return (
    <div className="min-h-[100dvh] pb-8">
      <header className="sticky top-0 bg-background/90 backdrop-blur-md border-b border-border z-40 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center text-white hover:text-rondo-yellow transition-colors cursor-pointer"
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-white font-bold text-base">Payment</h1>
      </header>

      <div className="px-4 py-6 space-y-6 max-w-lg mx-auto">
        {/* Order summary */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <h2 className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">
            Order Summary
          </h2>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-white font-bold text-base">{game.title}</p>
              <p className="text-muted-foreground text-sm flex items-center gap-1.5 mt-1">
                <MapPin size={12} />
                {game.venue_name}
              </p>
            </div>
            <span className="text-rondo-yellow font-black text-xl whitespace-nowrap">
              {formatPrice(game.price_per_player)}
            </span>
          </div>
        </div>

        {/* Payment options */}
        <div className="space-y-3">
          <h2 className="text-white font-bold text-base">Select Payment Method</h2>

          <button
            onClick={handlePayOnline}
            disabled={paying || isGuest}
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

          {game.payment_type === "venue" && (
            <button
              onClick={handlePayAtVenue}
              className="w-full bg-card border border-border hover:border-rondo-yellow/40 rounded-xl p-4 text-left transition-all cursor-pointer active:scale-[0.98] min-h-[44px]"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                  <MapPin size={18} className="text-muted-foreground" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">Pay at Venue</p>
                  <p className="text-muted-foreground text-xs">
                    Settle with the organizer on game day
                  </p>
                </div>
              </div>
            </button>
          )}
        </div>

        {error && <p className="text-destructive text-sm">{error}</p>}

        <div className="flex items-center gap-2 text-muted-foreground text-xs">
          <Shield size={12} />
          <span>Payments are secured by PayMongo</span>
        </div>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense>
      <PaymentForm />
    </Suspense>
  );
}
