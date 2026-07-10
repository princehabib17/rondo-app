"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { CalendarBlank, CheckCircle, ShareNetwork, ShieldCheck } from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import { formatGameDate } from "@/lib/utils/format";
import type { Game } from "@/lib/supabase/types";
import { RondoButton } from "@/components/rondo/primitives";

type PaymentState =
  | "loading"
  | "pending"
  | "paid"
  | "reserved"
  | "pending_approval"
  | "rejected"
  | "venue"
  | "error";

function StatusShell({
  title,
  body,
  children,
}: {
  title: string;
  body: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rondo-page flex min-h-[100dvh] flex-col items-center justify-center px-6 text-center">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-3">
          <h1 className="font-heading text-2xl font-black uppercase text-[var(--ink-hi)]">{title}</h1>
          <p className="rondo-body text-[var(--ink-mid)]">{body}</p>
        </div>
        <div className="space-y-3">{children}</div>
      </div>
    </div>
  );
}

function ConfirmedContent() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [game, setGame] = useState<Game | null>(null);
  const [paymentState, setPaymentState] = useState<PaymentState>("loading");

  useEffect(() => {
    let cancelled = false;

    async function confirmPayment() {
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
      <div className="rondo-page flex min-h-[100dvh] flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="h-10 w-10 rounded-full border-2 border-[var(--gold)] border-t-transparent animate-spin" />
        <p className="rondo-meta text-[var(--ink-low)]">Confirming your spot…</p>
      </div>
    );
  }

  if (paymentState === "pending") {
    return (
      <StatusShell
        title="Still confirming"
        body="If you finished paying, wait a moment. Otherwise go back and try again."
      >
        <RondoButton onClick={() => router.push("/my-games")} variant="secondary">
          My Matches
        </RondoButton>
      </StatusShell>
    );
  }

  if (paymentState === "error") {
    return (
      <StatusShell title="Could not confirm" body="Try again or contact support with your receipt.">
        <RondoButton onClick={() => router.push(`/games/${id}/payment`)} variant="primary">
          Back to payment
        </RondoButton>
        <RondoButton onClick={() => router.push("/help/new")} variant="secondary">
          Contact Help
        </RondoButton>
      </StatusShell>
    );
  }

  if (paymentState === "reserved") {
    return (
      <StatusShell
        title="Spot reserved"
        body="Your slot is reserved. Complete payment before kick-off to keep your place."
      >
        <RondoButton onClick={() => router.push(`/games/${id}/payment`)} variant="primary">
          Pay now
        </RondoButton>
        <RondoButton onClick={() => router.push("/my-games")} variant="secondary">
          My Matches
        </RondoButton>
      </StatusShell>
    );
  }

  if (paymentState === "pending_approval") {
    return (
      <StatusShell
        title="Pending approval"
        body="Your request is with the organizer. You will get an update once reviewed."
      >
        <RondoButton onClick={() => router.push("/my-games")} variant="secondary">
          My Matches
        </RondoButton>
      </StatusShell>
    );
  }

  if (paymentState === "rejected") {
    return (
      <StatusShell
        title="Request not approved"
        body="This slot request was declined by the organizer. Try another match or contact support."
      >
        <RondoButton onClick={() => router.push("/help/new")} variant="secondary">
          Contact Help
        </RondoButton>
      </StatusShell>
    );
  }

  if (paymentState === "venue") {
    return (
      <StatusShell
        title="Joined — pay at venue"
        body="You are in the match. Settle payment with the organizer on match day."
      >
        <RondoButton onClick={() => router.push(`/games/${id}/room`)} variant="primary">
          Organizer room
        </RondoButton>
      </StatusShell>
    );
  }

  return (
    <div className="rondo-page flex min-h-[100dvh] flex-col items-center justify-center px-6 text-center">
      <div className="w-full max-w-sm space-y-8">
        <div className="space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--gold-dim)]">
            <CheckCircle size={40} weight="fill" className="text-[var(--gold)]" aria-hidden />
          </div>
          <div>
            <h1 className="font-heading text-4xl font-black uppercase leading-none tracking-tight text-[var(--ink-hi)]">
              Match
              <br />
              confirmed
            </h1>
            {game && (
              <div className="mt-4 flex items-center justify-center gap-2 rondo-meta text-[var(--ink-mid)]">
                <CalendarBlank size={14} weight="duotone" aria-hidden />
                <span>See you on {formatGameDate(game.date_time)}</span>
              </div>
            )}
          </div>
          <div className="inline-flex items-center gap-2 rounded-[var(--r-pill)] border border-[var(--stroke)] bg-[var(--bg-surface)] px-3 py-1.5">
            <ShieldCheck size={14} weight="duotone" className="text-[var(--gold)]" aria-hidden />
            <span className="rondo-meta text-[var(--ink-mid)]">Payment secured</span>
          </div>
        </div>

        <div className="space-y-3">
          <RondoButton onClick={() => router.push(`/games/${id}/invite`)} variant="primary">
            <ShareNetwork size={18} weight="duotone" aria-hidden />
            Invite friends
          </RondoButton>
          <RondoButton onClick={() => router.push("/feed")} variant="secondary">
            Back to home
          </RondoButton>
        </div>
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
