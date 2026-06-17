"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { signInAsGuest } from "@/lib/auth/guest";
import Link from "next/link";

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
    <main className="relative min-h-screen bg-black flex flex-col overflow-hidden">
      {/* Hero image */}
      <Image
        src="/feed/hero-night-court.png"
        alt=""
        fill
        priority
        className="object-cover object-center scale-105"
        sizes="100vw"
      />

      {/* Multi-layer gradient: cinematic dark vignette */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/20 via-40% to-black" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" style={{ background: "radial-gradient(ellipse 120% 60% at 50% 100%, #000 30%, transparent 80%)" }} />

      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-screen px-6 pt-16 pb-12 max-w-lg mx-auto w-full">

        {/* Logo mark */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 rounded-full blur-xl bg-rondo-accent/30 scale-150" />
            <Image
              src="/rondo-logo.png"
              alt="Rondo"
              width={40}
              height={40}
              priority
              className="relative object-contain"
            />
          </div>
          <span className="font-heading font-black italic uppercase text-white text-xl tracking-wide">Rondo</span>
        </div>

        <div className="flex-1" />

        {/* Hero headline */}
        <div className="mb-8">
          <p className="font-body text-rondo-accent text-xs font-bold uppercase tracking-[0.25em] mb-3">
            The pickup football app
          </p>
          <h1
            className="font-heading font-black italic uppercase text-white leading-[0.88] mb-4"
            style={{ fontSize: "clamp(3.5rem, 18vw, 5.5rem)" }}
          >
            Find<br />Your<br />Game.
          </h1>
          <p className="font-body text-white/55 text-sm leading-relaxed max-w-[260px]">
            Book spots, join teams, and play with players near you — tonight.
          </p>
        </div>

        {/* CTAs */}
        <div className="space-y-3">
          <Link
            href="/signup"
            className="rondo-btn rondo-btn-primary text-[13px]"
          >
            Create Account
          </Link>
          <Link
            href="/login"
            className="rondo-btn border border-white/15 bg-white/[0.06] text-white backdrop-blur-sm text-[13px] hover:bg-white/10 transition-colors"
          >
            Log In
          </Link>
          <button
            type="button"
            onClick={handleGuest}
            disabled={guestLoading}
            className="w-full pt-2 pb-1 text-white/40 text-[11px] uppercase tracking-[0.22em] disabled:opacity-40 transition-opacity font-body hover:text-white/60"
          >
            {guestLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={13} className="animate-spin" /> Please wait…
              </span>
            ) : (
              "Continue as guest"
            )}
          </button>
          {guestError && (
            <p className="text-red-400 text-xs text-center leading-relaxed px-2">
              {guestError}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
