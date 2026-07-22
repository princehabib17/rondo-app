"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight, MapPin, SoccerBall, Trophy, Users } from "@phosphor-icons/react";
import { signInAsGuest } from "@/lib/auth/guest";
import Link from "next/link";
import { motion } from "motion/react";
import { gentle } from "@/components/motion/springs";

export default function HomePage() {
  const router = useRouter();
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

  return (
    <main className="relative min-h-[100dvh] overflow-hidden rondo-page text-[var(--ink-hi)]">
      <div className="absolute inset-0 opacity-75">
        <Image
          src="/feed/hero-night-court.png"
          alt=""
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(180deg,color-mix(in_oklch,var(--bg-page)_55%,transparent)_0%,color-mix(in_oklch,var(--bg-page)_42%,transparent)_38%,var(--bg-page)_100%)]" />
      <div className="absolute inset-0 rondo-map-shell opacity-40 mix-blend-screen" />

      <div className="pointer-events-none absolute inset-x-0 top-20 flex justify-center overflow-hidden" aria-hidden>
        <span className="select-none font-heading text-[29vw] font-black uppercase leading-none text-[var(--gold)] opacity-[0.055]">
          Street
        </span>
      </div>

      <div className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-lg flex-col px-4 pb-6 pt-5">
        <motion.div
          className="flex items-center justify-between"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={gentle}
        >
          <div className="flex items-center gap-2.5">
            <Image src="/rondo-logo.png" alt="Rondo" width={48} height={48} priority className="object-contain" />
            <p className="font-heading text-sm font-black uppercase tracking-wide text-[var(--ink-hi)]">Rondo</p>
          </div>
          <Link href="/login" className="rondo-chip bg-[color-mix(in_oklch,var(--bg-page)_70%,transparent)]">
            Log in
          </Link>
        </motion.div>

        <div className="flex-1" />

        <motion.section
          className="space-y-5"
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...gentle, delay: 0.1 }}
        >
          <div className="space-y-3">
            <h1 className="font-heading text-[4.5rem] font-black uppercase leading-[0.78] tracking-[-0.04em] text-[var(--ink-hi)] sm:text-[5.4rem]">
              Own the street
            </h1>
            <p className="max-w-[21rem] rondo-body text-[var(--ink-mid)]">
              Open the map, join nearby football, and turn pickup games into real matchdays.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: MapPin, label: "Live map" },
              { icon: Users, label: "Open squads" },
              { icon: Trophy, label: "Brackets" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="rounded-[var(--r-md)] border border-[var(--stroke)] bg-[color-mix(in_oklch,var(--bg-page)_74%,transparent)] p-3 backdrop-blur-md">
                <Icon size={20} weight="duotone" className="mb-4 text-[var(--gold)]" aria-hidden />
                <p className="font-body text-sm font-semibold text-[var(--ink-hi)]">{label}</p>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <Link href="/signup" className="rondo-btn rondo-btn-primary">
              Create account
              <ArrowRight size={18} weight="bold" aria-hidden />
            </Link>
            <button
              type="button"
              onClick={handleGuest}
              disabled={guestLoading}
              className="rondo-btn border border-[var(--stroke)] bg-[color-mix(in_oklch,var(--bg-page)_76%,transparent)] text-[var(--ink-hi)] backdrop-blur-md"
            >
              <SoccerBall size={18} weight="duotone" aria-hidden />
              {guestLoading ? "Opening feed" : "Continue as guest"}
            </button>
            {guestError && <p className="rondo-meta px-2 text-center text-[var(--live)]">{guestError}</p>}
          </div>
        </motion.section>
      </div>
    </main>
  );
}
