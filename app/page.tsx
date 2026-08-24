"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight, SoccerBall } from "@phosphor-icons/react";
import { signInAsGuest } from "@/lib/auth/guest";
import { motion, useReducedMotion } from "motion/react";
import { gentle } from "@/components/motion/springs";
import { RondoButton } from "@/components/rondo/primitives";

const LANDING_VIDEO = "/landing/pickup.mp4";
const LANDING_POSTER = "/landing/pickup-poster.jpg";

export default function HomePage() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [guestError, setGuestError] = useState<string | null>(null);
  const [guestLoading, setGuestLoading] = useState(false);
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (reduceMotion) {
      setShowVideo(false);
      video.pause();
      return;
    }

    const play = () => {
      video.play().catch(() => setShowVideo(false));
    };

    setShowVideo(true);
    if (video.readyState >= 2) play();
    else video.addEventListener("canplay", play, { once: true });

    return () => {
      video.removeEventListener("canplay", play);
      video.pause();
    };
  }, [reduceMotion]);

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
    <main className="relative min-h-[100dvh] overflow-hidden bg-[var(--bg-page)] text-[var(--ink-hi)]">
      <div className="absolute inset-0">
        <Image
          src={LANDING_POSTER}
          alt=""
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        <video
          ref={videoRef}
          className={`absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-500 ${
            showVideo ? "opacity-100" : "opacity-0"
          }`}
          poster={LANDING_POSTER}
          muted
          loop
          playsInline
          preload={reduceMotion ? "none" : "metadata"}
          aria-hidden
          tabIndex={-1}
        >
          <source src={LANDING_VIDEO} type="video/mp4" />
        </video>
      </div>

      {/* Bottom wash — theme-aware, tiny elsewhere */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,transparent_38%,color-mix(in_oklch,var(--bg-page)_42%,transparent)_62%,var(--bg-page)_100%)]"
      />

      <div className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-lg flex-col justify-end px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))]">
        <motion.div className="mb-auto flex items-center gap-3" {...enter(0)}>
          <Image src="/rondo-logo.png" alt="" width={48} height={48} priority className="object-contain" />
          <p className="font-heading text-2xl font-black uppercase tracking-[-0.03em] text-[var(--ink-hi)]">
            Rondo
          </p>
        </motion.div>

        <section className="space-y-6 pb-2">
          <motion.h1
            className="rondo-hero-title max-w-[14ch] text-[clamp(2.75rem,12vw,4.5rem)] text-[var(--ink-hi)]"
            {...enter(0.06)}
          >
            Find games near you.
          </motion.h1>

          <motion.div className="space-y-2" {...enter(0.12)}>
            <RondoButton href="/signup" variant="primary">
              Create account
              <ArrowRight size={18} weight="bold" aria-hidden />
            </RondoButton>
            <RondoButton href="/login" variant="ghost" className="!min-h-11">
              Log in
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
