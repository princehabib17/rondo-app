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
      {/* Daylight athletic plane — replaces night-court so the published light system is obvious */}
      <div className="absolute inset-0">
        <Image
          src="/feed/hero-soccer.jpg"
          alt="Football cleats and ball on the pitch"
          fill
          priority
          className="object-cover object-[center_35%]"
          sizes="100vw"
        />
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(180deg,color-mix(in_oklch,var(--bg-page)_28%,transparent)_0%,color-mix(in_oklch,var(--bg-page)_55%,transparent)_42%,var(--bg-page)_78%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_80%_18%,color-mix(in_oklch,var(--gold)_18%,transparent),transparent_55%)]" />

      <div className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-lg flex-col px-4 pb-8 pt-5">
        <motion.div className="flex items-center justify-end" {...enter(0)}>
          <RondoButton href="/login" variant="ghost" className="!h-10 !w-auto !px-3 text-sm">
            Log in
          </RondoButton>
        </motion.div>

        <section className="mt-auto space-y-6 pb-2">
          <motion.div className="space-y-4" {...enter(0.05)}>
            <div className="flex items-center gap-3">
              <Image
                src="/rondo-logo.png"
                alt=""
                width={56}
                height={56}
                priority
                className="object-contain"
              />
              <p className="font-heading text-[clamp(3.25rem,16vw,5.5rem)] font-black uppercase leading-[0.82] tracking-[-0.04em] text-[var(--ink-hi)]">
                Rondo
              </p>
            </div>
            <h1 className="max-w-[18rem] font-heading text-[clamp(1.75rem,7vw,2.35rem)] font-extrabold uppercase leading-[0.95] tracking-[-0.03em] text-[var(--ink-hi)]">
              Find your next matchday
            </h1>
            <p className="max-w-[22rem] rondo-body text-[var(--ink-mid)]">
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
            {guestError && (
              <p className="rondo-meta px-2 text-center text-[var(--live)]">{guestError}</p>
            )}
          </motion.div>
        </section>
      </div>
    </main>
  );
}
