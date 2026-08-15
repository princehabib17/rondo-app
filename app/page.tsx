"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight, SoccerBall } from "@phosphor-icons/react";
import { signInAsGuest } from "@/lib/auth/guest";
import Link from "next/link";

export default function HomePage() {
  const router = useRouter();
  const [guestLoading, setGuestLoading] = useState(false);

  async function handleGuest() {
    setGuestLoading(true);
    await signInAsGuest();
    router.push("/feed");
    router.refresh();
  }

  return (
    <main className="relative mx-auto flex min-h-[100dvh] w-full max-w-lg flex-col bg-[var(--bg-page)] text-[var(--ink-hi)]">
      <section className="rondo-night relative isolate flex min-h-[52dvh] flex-col overflow-hidden">
        <Image
          src="/feed/hero-night-court.png"
          alt=""
          fill
          priority
          className="pointer-events-none object-cover object-center"
          sizes="100vw"
        />
        <div
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,color-mix(in_oklch,var(--bg-night)_28%,transparent)_0%,color-mix(in_oklch,var(--bg-night)_58%,transparent)_52%,var(--bg-night)_100%)]"
          aria-hidden
        />

        <div className="relative z-10 flex items-center justify-between px-4 pt-5">
          <div className="flex items-center gap-2.5">
            <Image src="/rondo-logo.png" alt="Rondo" width={40} height={40} priority className="object-contain" />
            <p className="font-heading text-sm font-black uppercase tracking-wide text-[var(--night-ink)]">Rondo</p>
          </div>
          <Link
            href="/login"
            className="inline-flex min-h-11 items-center rounded-[var(--r-pill)] border border-[color-mix(in_oklch,var(--night-ink)_28%,transparent)] bg-[color-mix(in_oklch,var(--bg-night)_40%,transparent)] px-4 font-body text-sm font-semibold text-[var(--night-ink)]"
          >
            Log in
          </Link>
        </div>

        <div className="relative z-10 mt-auto px-4 pb-8 pt-20">
          <h1 className="font-heading text-[3.5rem] font-black uppercase leading-[0.86] tracking-[-0.04em] text-[var(--night-ink)] sm:text-[4.25rem]">
            Own the street
          </h1>
          <p className="mt-3 max-w-[20rem] text-[0.95rem] leading-relaxed text-[color-mix(in_oklch,var(--night-ink)_78%,transparent)]">
            Find nearby football, join a squad, and play tonight.
          </p>
        </div>
      </section>

      <section className="flex flex-col gap-3 px-4 py-5">
        <Link href="/signup" className="rondo-btn rondo-btn-primary">
          Create account
          <ArrowRight size={18} weight="bold" aria-hidden />
        </Link>
        <button
          type="button"
          onClick={handleGuest}
          disabled={guestLoading}
          className="rondo-btn rondo-btn-secondary"
        >
          <SoccerBall size={18} weight="fill" aria-hidden />
          {guestLoading ? "Opening feed" : "Continue as guest"}
        </button>
      </section>
    </main>
  );
}
