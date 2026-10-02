"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { motion, useReducedMotion } from "motion/react";
import {
  CalendarPlus,
  ChatsCircle,
  CheckCircle,
  NavigationArrow,
  ShareNetwork,
} from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import { RondoButton } from "@/components/rondo/primitives";
import { gentle } from "@/components/motion/springs";
import { matchHeroImage } from "@/lib/venues/pitch-photos";
import { downloadIcs } from "@/lib/calendar/ics";
import { cn } from "@/lib/utils";
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
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    let cancelled = false;
    let settled = false;

    async function confirmPayment() {
      // Guard first: the component may have unmounted, or a final answer already landed.
      if (cancelled || settled) return;

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
        settled = true;
        setPaymentState("reserved");
        return;
      }
      if (myEntry?.payment_status === "pending_approval") {
        settled = true;
        setPaymentState("pending_approval");
        return;
      }
      if (myEntry?.payment_status === "venue") {
        settled = true;
        setPaymentState("venue");
        return;
      }
      if (myEntry?.payment_status === "rejected") {
        settled = true;
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
        settled = true;
        setPaymentState("error");
        return;
      }

      if (json.status === "paid" || myEntry?.payment_status === "paid" || myEntry?.payment_status === "approved") {
        settled = true;
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
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 px-6 text-center rondo-page">
        <span className="size-10 animate-spin rounded-[var(--r-pill)] border-2 border-[var(--stroke)] border-t-[var(--gold)]" aria-hidden />
        <p className="rondo-meta text-[var(--ink-low)]">Locking in your spot...</p>
      </div>
    );
  }

  const hero = game ? matchHeroImage(game) : null;
  const kickoff = game ? new Date(game.date_time) : null;

  function addToCalendar() {
    if (!game || !kickoff) return;
    downloadIcs(
      {
        uid: `game-${game.id}`,
        title: game.title,
        start: kickoff,
        durationMinutes: 120,
        location: [game.venue_name, game.venue_address].filter(Boolean).join(", "),
        description: "Booked on Rondo. Arrive 15 minutes early to warm up.",
        url: `${window.location.origin}/games/${game.id}`,
      },
      `rondo-${format(kickoff, "MMM-d").toLowerCase()}.ics`
    );
  }

  const copy: Record<Exclude<PaymentState, "loading">, { eyebrow: string; title: string; body: string; tone: "ok" | "gold" | "muted" | "live" }> = {
    paid: { eyebrow: "Spot confirmed", title: "You're in.", body: "Paid from your wallet. Your name is on the team sheet.", tone: "ok" },
    venue: { eyebrow: "Spot held", title: "You're in.", body: "Settle the fee with the organizer at the venue on match day.", tone: "ok" },
    reserved: { eyebrow: "Spot reserved", title: "Almost there.", body: "Pay from your wallet before kickoff to keep your place.", tone: "gold" },
    pending_approval: { eyebrow: "Request sent", title: "Over to the organizer.", body: "You'll get a notification the moment they approve you.", tone: "muted" },
    pending: { eyebrow: "Checking payment", title: "Still confirming.", body: "If you finished paying, give it a moment. This screen updates on its own.", tone: "muted" },
    rejected: { eyebrow: "Not this time", title: "Request declined.", body: "The organizer picked another lineup. Plenty more games on tonight.", tone: "live" },
    error: { eyebrow: "Something went wrong", title: "We couldn't confirm that.", body: "No money moved twice. Try the payment again, or message Help and we'll sort it.", tone: "live" },
  };
  const state = copy[paymentState];
  const booked = paymentState === "paid" || paymentState === "venue" || paymentState === "reserved";

  return (
    <div className="min-h-[100dvh] rondo-page">
      <section className="relative isolate">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-[var(--bg-inset)]">
          {hero && <img src={hero.src} alt={hero.alt} className="h-full w-full object-cover" />}
          <div
            aria-hidden
            className="absolute inset-0 bg-[linear-gradient(180deg,color-mix(in_oklch,var(--bg-night)_30%,transparent)_0%,transparent_30%,var(--bg-page)_100%)]"
          />
        </div>
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={gentle}
          className="relative -mt-24 px-4"
        >
          <div className="mx-auto max-w-lg">
            <span
              className={cn(
                "inline-flex items-center gap-2 rounded-[var(--r-pill)] px-3 py-1 rondo-label",
                state.tone === "ok" && "bg-[var(--ok)] text-[var(--bg-night)]",
                state.tone === "gold" && "bg-[var(--gold)] text-[var(--gold-ink)]",
                state.tone === "muted" && "bg-[var(--bg-inset)] text-[var(--ink-mid)]",
                state.tone === "live" && "bg-[var(--live)] text-[var(--night-ink)]"
              )}
            >
              {state.tone === "ok" && <CheckCircle size={14} weight="fill" aria-hidden />}
              {state.eyebrow}
            </span>
            <h1 className="mt-4 font-heading text-[3.25rem] font-bold uppercase leading-[0.9] text-[var(--ink-hi)]">{state.title}</h1>
            <p className="mt-3 max-w-sm rondo-body text-[var(--ink-mid)]">{state.body}</p>
          </div>
        </motion.div>
      </section>

      <div className="mx-auto max-w-lg space-y-6 px-4 pb-10 pt-8">
        {game && kickoff && (
          <Link
            href={`/games/${game.id}`}
            className="flex items-stretch overflow-hidden rounded-[var(--r-md)] border border-[var(--stroke)] bg-[var(--bg-surface)]"
          >
            <div className="flex w-20 shrink-0 flex-col items-center justify-center border-r border-dashed border-[var(--stroke)] bg-[var(--bg-inset)] py-3">
              <span className="rondo-label text-[var(--ink-low)]">{format(kickoff, "EEE")}</span>
              <span className="font-heading text-[2rem] font-bold leading-none tabular-nums text-[var(--ink-hi)]">{format(kickoff, "d")}</span>
              <span className="rondo-label text-[var(--ink-low)]">{format(kickoff, "MMM")}</span>
            </div>
            <div className="min-w-0 flex-1 p-4">
              <p className="line-clamp-2 rondo-body font-bold text-[var(--ink-hi)]">{game.title}</p>
              <p className="mt-1 truncate rondo-meta text-[var(--ink-low)]">
                {format(kickoff, "h:mm a")} · {game.venue_name}
              </p>
            </div>
          </Link>
        )}

        <div className="grid gap-3">
          {paymentState === "reserved" ? (
            <RondoButton href={`/games/${id}/payment`}>Pay now</RondoButton>
          ) : paymentState === "error" ? (
            <RondoButton href={`/games/${id}/payment`}>Try the payment again</RondoButton>
          ) : paymentState === "rejected" ? (
            <RondoButton href="/feed">Find another match</RondoButton>
          ) : booked ? (
            <RondoButton href={`/games/${id}/invite`}>
              <ShareNetwork size={18} weight="bold" aria-hidden />
              Invite your crew
            </RondoButton>
          ) : (
            <RondoButton href="/my-games" variant="secondary">My matches</RondoButton>
          )}

          {booked && game && (
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={addToCalendar}
                className="flex min-h-16 flex-col items-center justify-center gap-1 rounded-[var(--r-md)] bg-[var(--bg-inset)] text-[var(--ink-hi)] active:scale-[0.97]"
              >
                <CalendarPlus size={20} aria-hidden />
                <span className="rondo-label text-[0.625rem] text-[var(--ink-mid)]">Calendar</span>
              </button>
              <Link
                href={`/games/${id}/chat`}
                className="flex min-h-16 flex-col items-center justify-center gap-1 rounded-[var(--r-md)] bg-[var(--bg-inset)] text-[var(--ink-hi)] active:scale-[0.97]"
              >
                <ChatsCircle size={20} aria-hidden />
                <span className="rondo-label text-[0.625rem] text-[var(--ink-mid)]">Match chat</span>
              </Link>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  [game.venue_name, game.venue_address].filter(Boolean).join(", ")
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-16 flex-col items-center justify-center gap-1 rounded-[var(--r-md)] bg-[var(--bg-inset)] text-[var(--ink-hi)] active:scale-[0.97]"
              >
                <NavigationArrow size={20} aria-hidden />
                <span className="rondo-label text-[0.625rem] text-[var(--ink-mid)]">Directions</span>
              </a>
            </div>
          )}

          {(paymentState === "error" || paymentState === "rejected") && (
            <RondoButton href="/help/new?type=payment_issue" variant="secondary">
              Message Help
            </RondoButton>
          )}

          <RondoButton href="/feed" variant="ghost">
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
