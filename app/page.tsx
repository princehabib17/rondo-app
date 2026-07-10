"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight, SoccerBall } from "@phosphor-icons/react";
import { signInAsGuest } from "@/lib/auth/guest";
import { motion, useReducedMotion } from "motion/react";
import { gentle } from "@/components/motion/springs";
import { RondoButton } from "@/components/rondo/primitives";

export default function HomePage() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [guestError, setGuestError] = useState<string | null>(null);
  const [guestLoading, setGuestLoading] = useState(false);

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

  const enter = (delay = 0) =>
    reduceMotion
      ? { initial: false as const, animate: { opacity: 1 }, transition: { duration: 0 } }
      : {
          initial: { opacity: 0, y: 18 },
          animate: { opacity: 1, y: 0 },
          transition: { ...gentle, delay },
        };

  return (
    <main className="relative min-h-[100dvh] overflow-hidden rondo-page text-[var(--ink-hi)]">
      <div className="absolute inset-0 opacity-60">
        <Image
          src="/feed/hero-night-court.png"
          alt="Night football court under floodlights"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(180deg,color-mix(in_oklch,var(--bg-page)_68%,transparent)_0%,color-mix(in_oklch,var(--bg-page)_38%,transparent)_42%,var(--bg-page)_100%)]" />

      <div className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-lg flex-col justify-end px-4 pb-8 pt-5 sm:justify-center">
        <motion.div className="mb-auto flex items-center justify-between sm:mb-10" {...enter(0)}>
          <div className="flex items-center gap-3">
            <Image src="/rondo-logo.png" alt="" width={48} height={48} priority className="object-contain" />
            <p className="font-heading text-2xl font-black uppercase tracking-[-0.03em] text-[var(--ink-hi)]">
              Rondo
            </p>
          </div>
          <RondoButton href="/login" variant="ghost" className="!h-10 !w-auto !px-3 text-sm">
            Log in
          </RondoButton>
        </motion.div>

        <section className="space-y-6">
          <motion.div className="space-y-3" {...enter(0.06)}>
            <h1 className="rondo-hero-title text-[clamp(3.5rem,14vw,5.25rem)] text-[var(--ink-hi)]">
              Own the street
            </h1>
            <p className="max-w-[21rem] rondo-body text-[var(--ink-mid)]">
              Open the map, join nearby football, and turn pickup games into real matchdays.
            </p>
          </motion.div>

          <motion.div className="space-y-3" {...enter(0.12)}>
            <RondoButton href="/signup" variant="primary">
              Create account
              <ArrowRight size={18} weight="bold" aria-hidden />
            </RondoButton>
            <RondoButton onClick={handleGuest} disabled={guestLoading} variant="secondary">
              <SoccerBall size={18} weight="duotone" aria-hidden />
              {guestLoading ? "Opening feed" : "Continue as guest"}
            </RondoButton>
            {guestError && <p className="rondo-meta px-2 text-center text-[var(--live)]">{guestError}</p>}
          </motion.div>
        </section>
      </div>
    </main>
  );
}
