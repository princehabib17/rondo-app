"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, SoccerBall } from "@phosphor-icons/react";
import { signInAsGuest } from "@/lib/auth/guest";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { motion, useReducedMotion } from "motion/react";
import { RondoButton } from "@/components/rondo/primitives";
import { RondoBrand } from "@/components/brand/RondoBrand";
import { AmbientVideo } from "@/components/media/AmbientVideo";
import { ThemeToggle } from "@/components/theme-toggle";

export default function HomePage() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [guestError, setGuestError] = useState<string | null>(null);
  const [guestLoading, setGuestLoading] = useState(false);
  const [openThisWeek, setOpenThisWeek] = useState<number | null>(null);

  // Real proof on the first screen: how many games are open in the next week.
  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const now = new Date();
    const weekOut = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    createClient()
      .from("games")
      .select("id", { count: "exact", head: true })
      .eq("status", "open")
      .gte("date_time", now.toISOString())
      .lte("date_time", weekOut.toISOString())
      .then(({ count, error }) => {
        if (!error && count) setOpenThisWeek(count);
      });
  }, []);

  async function handleGuest() {
    setGuestError(null);
    setGuestLoading(true);
    const result = await signInAsGuest();
    if (!result.ok) {
      setGuestError(result.error ?? "Guest sign-in failed");
      setGuestLoading(false);
      return;
    }
    router.push("/feed");
    router.refresh();
  }

  const visible = {
    initial: false as const,
    animate: { opacity: 1, y: 0 },
    transition: { duration: reduceMotion ? 0 : 0.2 },
  };

  return (
    <main className="relative min-h-[100dvh] overflow-hidden bg-[var(--bg-page)] text-[var(--ink-hi)]">
      <AmbientVideo
        src="/onboarding/media/footwork.mp4"
        poster="/onboarding/media/footwork-poster.jpg"
        fetchPriority="high"
      />

      {/* Bottom wash — theme-aware, tiny elsewhere */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,transparent_38%,color-mix(in_oklch,var(--bg-page)_42%,transparent)_62%,var(--bg-page)_100%)]"
      />

      <div className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-lg flex-col justify-end px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))]">
        <motion.div className="mb-auto flex items-start justify-between gap-3" {...visible}>
          <RondoBrand kind="wordmark" surface="dark" className="h-11 w-44" fetchPriority="high" />
          <ThemeToggle className="text-[var(--night-ink)] hover:bg-[color-mix(in_oklch,var(--night-ink)_12%,transparent)] hover:text-[var(--night-ink)]" />
        </motion.div>

        <section className="space-y-6 pb-2">
          <motion.h1
            className="rondo-hero-title max-w-[14ch] text-[clamp(2.75rem,12vw,4.5rem)] text-[var(--ink-hi)]"
            {...visible}
          >
            Find games near you.
          </motion.h1>

          <motion.div className="space-y-3" {...visible}>
            <p className="max-w-sm rondo-body text-[color-mix(in_oklch,var(--ink-hi)_80%,transparent)]">
              Pickup football and futsal across Metro Manila. Join in a tap, pay from your wallet, run the bracket.
            </p>
            {openThisWeek !== null && (
              <p className="inline-flex items-center gap-2 rounded-[var(--r-pill)] border border-[var(--stroke)] bg-[color-mix(in_oklch,var(--bg-page)_70%,transparent)] px-3 py-1.5 rondo-meta font-bold text-[var(--ink-hi)] backdrop-blur-sm">
                <span className="size-2 rounded-[var(--r-pill)] bg-[var(--ok)]" aria-hidden />
                {openThisWeek} open {openThisWeek === 1 ? "game" : "games"} this week
              </p>
            )}
          </motion.div>

          <motion.div className="space-y-2" {...visible}>
            <RondoButton href="/signup" variant="primary">
              Create account
              <ArrowRight size={18} weight="bold" aria-hidden />
            </RondoButton>
            <RondoButton href="/login" variant="secondary" className="!min-h-11">
              Log in
            </RondoButton>
            <RondoButton onClick={handleGuest} disabled={guestLoading} variant="ghost">
              <SoccerBall size={18} weight="duotone" aria-hidden />
              {guestLoading ? "Opening the feed..." : "Continue as guest"}
            </RondoButton>
            {guestError && <p className="rondo-meta px-2 text-center text-[var(--live)]">{guestError}</p>}
          </motion.div>
        </section>
      </div>
    </main>
  );
}
