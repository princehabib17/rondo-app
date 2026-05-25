"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle2, Calendar, Share2, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatGameDate } from "@/lib/utils/format";
import type { Game } from "@/lib/supabase/types";

type PaymentState = "loading" | "pending" | "paid" | "error";

function ConfirmedContent() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [game, setGame] = useState<Game | null>(null);
  const [paymentState, setPaymentState] = useState<PaymentState>("loading");

  useEffect(() => {
    let cancelled = false;

    async function confirmPayment() {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        router.push("/login");
        return;
      }

      const { data: gameData } = await supabase.from("games").select("*").eq("id", id).single();
      if (gameData && !cancelled) setGame(gameData as Game);

      const res = await fetch("/api/payments/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId: id }),
      });

      const json = await res.json().catch(() => ({}));
      if (cancelled) return;

      if (!res.ok) {
        setPaymentState("error");
        return;
      }

      if (json.status === "paid") {
        setPaymentState("paid");
        return;
      }

      setPaymentState("pending");
    }

    confirmPayment();
    const retry = setInterval(confirmPayment, 3000);
    const stop = setTimeout(() => clearInterval(retry), 45000);

    return () => {
      cancelled = true;
      clearInterval(retry);
      clearTimeout(stop);
    };
  }, [id, router]);

  if (paymentState === "loading") {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center px-6 text-center gap-4">
        <Loader2 size={40} className="text-rondo-yellow animate-spin" />
        <p className="text-muted-foreground text-sm">Confirming your payment...</p>
      </div>
    );
  }

  if (paymentState === "pending") {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center px-6 text-center space-y-6 max-w-sm">
        <Loader2 size={40} className="text-rondo-yellow animate-spin" />
        <div>
          <h1 className="text-white font-bold text-xl">Still confirming</h1>
          <p className="text-muted-foreground text-sm mt-2">
            If you finished paying, wait a moment. Otherwise go back and try again.
          </p>
        </div>
        <button
          onClick={() => router.push("/my-games")}
          className="w-full border border-border text-white text-sm py-4 rounded-xl cursor-pointer min-h-[52px]"
        >
          My Games
        </button>
      </div>
    );
  }

  if (paymentState === "error") {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center px-6 text-center gap-4">
        <p className="text-destructive text-sm">Could not confirm payment. Try again or contact support.</p>
        <button
          onClick={() => router.push(`/games/${id}/payment`)}
          className="w-full border border-border text-white text-sm py-4 rounded-xl cursor-pointer"
        >
          Back to payment
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center px-6 text-center space-y-8">
      <div className="space-y-4">
        <CheckCircle2 size={64} className="text-rondo-yellow mx-auto" strokeWidth={1.5} />
        <div>
          <h1 className="text-white font-black text-4xl tracking-tight uppercase leading-none">
            Match
            <br />
            Confirmed
          </h1>
          {game && (
            <div className="flex items-center justify-center gap-2 mt-4 text-muted-foreground text-sm">
              <Calendar size={14} />
              <span>See you on {formatGameDate(game.date_time)}</span>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3 w-full max-w-xs">
        <button
          onClick={() => router.push(`/games/${id}/invite`)}
          className="w-full bg-rondo-yellow text-rondo-black font-black uppercase tracking-widest text-sm py-4 rounded-xl active:scale-[0.98] transition-all cursor-pointer min-h-[52px] flex items-center justify-center gap-2"
        >
          <Share2 size={18} />
          Invite Friends
        </button>
        <button
          onClick={() => router.push("/feed")}
          className="w-full border border-border text-muted-foreground hover:text-white text-sm py-4 rounded-xl active:scale-[0.98] transition-all cursor-pointer min-h-[52px]"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}

export default function ConfirmedPage() {
  return <ConfirmedContent />;
}
