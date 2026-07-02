"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Calendar, Share2, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatGameDate } from "@/lib/utils/format";
import type { Game } from "@/lib/supabase/types";

type PaymentState =
  | "loading"
  | "pending"
  | "paid"
  | "reserved"
  | "pending_approval"
  | "rejected"
  | "venue"
  | "error";

function ConfirmedContent() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [game, setGame] = useState<Game | null>(null);
  const [paymentState, setPaymentState] = useState<PaymentState>("loading");

  useEffect(() => {
    let cancelled = false;

    async function confirmPayment() {
      // Guard first — component may have unmounted between polling intervals
      if (cancelled) return;

      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        if (!cancelled) router.push("/login");
        return;
      }

      const { data: gameData } = await supabase.from("games").select("*").eq("id", id).single();
      if (cancelled) return;
      if (gameData) setGame(gameData as Game);

      const { data: myEntry } = await supabase
        .from("game_players")
        .select("payment_status")
        .eq("game_id", id)
        .eq("user_id", userData.user.id)
        .maybeSingle();

      if (cancelled) return;

      if (myEntry?.payment_status === "reserved") {
        setPaymentState("reserved");
        return;
      }
      if (myEntry?.payment_status === "pending_approval") {
        setPaymentState("pending_approval");
        return;
      }
      if (myEntry?.payment_status === "venue") {
        setPaymentState("venue");
        return;
      }
      if (myEntry?.payment_status === "rejected") {
        setPaymentState("rejected");
        return;
      }

      // PayMongo appends ?checkout_session_id=xxx to the success URL automatically.
      const sessionId = searchParams.get("checkout_session_id") ?? undefined;
      const res = await fetch("/api/payments/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId: id, sessionId }),
      });

      const json = await res.json().catch(() => ({}));
      if (cancelled) return;

      if (!res.ok) {
        setPaymentState("error");
        return;
      }

      if (json.status === "paid" || myEntry?.payment_status === "paid" || myEntry?.payment_status === "approved") {
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
  }, [id, router, searchParams]);

  if (paymentState === "loading") {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center px-6 text-center gap-4">
        <Loader2 size={40} className="text-rondo-yellow animate-spin" />
        <p className="text-muted-foreground text-sm">Confirming your spot...</p>
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
          My Matches
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
        <button
          onClick={() => router.push("/help/new")}
          className="w-full border border-border text-white text-sm py-4 rounded-xl cursor-pointer"
        >
          Contact Help
        </button>
      </div>
    );
  }

  if (paymentState === "reserved") {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center px-6 text-center space-y-6 max-w-sm">
        <h1 className="text-white font-bold text-2xl">Spot Reserved</h1>
        <p className="text-muted-foreground text-sm">
          Your slot is reserved. Complete payment before kick-off to keep your place.
        </p>
        <button onClick={() => router.push(`/games/${id}/payment`)} className="w-full bg-rondo-yellow text-rondo-black font-black uppercase tracking-widest text-sm py-4 rounded-xl">
          Pay Now
        </button>
        <button onClick={() => router.push("/my-games")} className="w-full border border-border text-white text-sm py-4 rounded-xl">
          My Matches
        </button>
      </div>
    );
  }

  if (paymentState === "pending_approval") {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center px-6 text-center space-y-6 max-w-sm">
        <h1 className="text-white font-bold text-2xl">Pending Approval</h1>
        <p className="text-muted-foreground text-sm">
          Your request is with the organizer. You will get an update once reviewed.
        </p>
        <button onClick={() => router.push("/my-games")} className="w-full border border-border text-white text-sm py-4 rounded-xl">
          My Matches
        </button>
      </div>
    );
  }

  if (paymentState === "rejected") {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center px-6 text-center space-y-6 max-w-sm">
        <h1 className="text-white font-bold text-2xl">Request Not Approved</h1>
        <p className="text-muted-foreground text-sm">
          This slot request was declined by the organizer. Try another match or contact support.
        </p>
        <button onClick={() => router.push("/help/new")} className="w-full border border-border text-white text-sm py-4 rounded-xl">
          Contact Help
        </button>
      </div>
    );
  }

  if (paymentState === "venue") {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center px-6 text-center space-y-6 max-w-sm">
        <h1 className="text-white font-bold text-2xl">Joined - Pay at Venue</h1>
        <p className="text-muted-foreground text-sm">
          You are in the match. Please settle payment with the organizer on match day.
        </p>
        <button onClick={() => router.push(`/games/${id}/room`)} className="w-full bg-rondo-yellow text-rondo-black font-black uppercase tracking-widest text-sm py-4 rounded-xl">
          Organizer room
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
  return (
    <Suspense>
      <ConfirmedContent />
    </Suspense>
  );
}
