"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { toast } from "sonner";
import { dropOutRule, FREE_DROP_OUT_HOURS } from "@/lib/match/drop-out";
import { formatPrice } from "@/lib/utils/format";

/** "Can't make it?" Gives the spot back, with the refund rule spelled out first. */
export function DropOutPanel({
  gameId,
  kickoff,
  paymentStatus,
  pricePerPlayer,
  onLeft,
}: {
  gameId: string;
  kickoff: string;
  paymentStatus: string | null;
  pricePerPlayer: number;
  onLeft: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const reducedMotion = useReducedMotion();
  const rule = dropOutRule({ kickoff, paymentStatus });

  if (rule.kind === "started") return null;

  const consequence =
    rule.kind === "refund"
      ? `You'll get ${formatPrice(pricePerPlayer)} back in your wallet right away.`
      : rule.kind === "late"
        ? `Kickoff is less than ${FREE_DROP_OUT_HOURS} hours away, so the fee can't come back automatically. Ask Help and the organizer will decide.`
        : "Your spot goes to the next player on the waitlist.";

  async function dropOut() {
    setBusy(true);
    try {
      const res = await fetch("/api/matches/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Could not drop out. Try again.");
      toast.success(
        json.refunded > 0 ? `You're out. ${formatPrice(json.refunded)} is back in your wallet.` : "You're out. Spot released."
      );
      onLeft();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not drop out. Try again.");
    } finally {
      setBusy(false);
      setConfirming(false);
    }
  }

  return (
    <section className="border-t border-[var(--stroke)] pt-6">
      <AnimatePresence initial={false} mode="wait">
        {confirming ? (
          <motion.div
            key="confirm"
            initial={reducedMotion ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reducedMotion ? undefined : { opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
            className="space-y-3"
          >
            <p className="rondo-body font-bold text-[var(--ink-hi)]">Give up your spot?</p>
            <p className="rondo-meta text-[var(--ink-mid)]">{consequence}</p>
            {rule.kind === "late" ? (
              <div className="flex gap-2">
                <Link
                  href={`/help/new?type=refund_request&game=${gameId}`}
                  className="grid h-11 flex-1 place-items-center rounded-[var(--r-pill)] bg-[var(--ink-hi)] text-sm font-bold text-[var(--bg-page)]"
                >
                  Ask Help
                </Link>
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  className="h-11 flex-1 rounded-[var(--r-pill)] border border-[var(--stroke)] text-sm font-semibold text-[var(--ink-hi)]"
                >
                  Keep my spot
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={dropOut}
                  disabled={busy}
                  className="h-11 flex-1 rounded-[var(--r-pill)] bg-[var(--live)] text-sm font-bold text-white disabled:opacity-60"
                >
                  {busy ? "Dropping out..." : "Yes, drop out"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  disabled={busy}
                  className="h-11 flex-1 rounded-[var(--r-pill)] border border-[var(--stroke)] text-sm font-semibold text-[var(--ink-hi)]"
                >
                  Keep my spot
                </button>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="ask"
            initial={reducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reducedMotion ? undefined : { opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex items-center justify-between gap-3"
          >
            <div className="min-w-0">
              <p className="rondo-body font-semibold text-[var(--ink-hi)]">Can&apos;t make it?</p>
              <p className="rondo-meta text-[var(--ink-low)]">
                Free to drop out up to {FREE_DROP_OUT_HOURS} hours before kickoff.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="h-10 shrink-0 rounded-[var(--r-pill)] border border-[var(--stroke)] px-4 rondo-meta font-semibold text-[var(--ink-hi)]"
            >
              Drop out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
