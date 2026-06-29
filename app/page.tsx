"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { signInAsGuest } from "@/lib/auth/guest";
import Link from "next/link";
import { motion } from "motion/react";
import { bouncy, gentle } from "@/components/motion/springs";

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
    <main className="relative min-h-[100dvh] bg-black flex flex-col overflow-hidden">
      {/* Hero image */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0, scale: 1.04 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
      >
        <Image
          src="/feed/hero-night-court.png"
          alt=""
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
      </motion.div>

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/10 to-black" />

      {/* Atmospheric type — oversized low-opacity brand word */}
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden"
        aria-hidden
      >
        <span
          className="select-none font-heading text-[22vw] font-black uppercase italic leading-none text-white"
          style={{ opacity: 0.04, letterSpacing: "-0.02em" }}
        >
          RONDO
        </span>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-[100dvh] px-6 pt-14 pb-10 max-w-lg mx-auto w-full">

        {/* Logo */}
        <motion.div
          className="flex justify-center"
          initial={{ opacity: 0, scale: 0.82 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ ...bouncy, delay: 0.25 }}
        >
          <Image
            src="/rondo-logo.png"
            alt="Rondo"
            width={52}
            height={52}
            priority
            className="object-contain drop-shadow-[0_0_24px_rgba(255,250,152,0.45)]"
          />
        </motion.div>

        <div className="flex-1" />

        {/* CTAs — staggered entrance */}
        <div className="space-y-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...gentle, delay: 0.4 }}
          >
            <Link
              href="/signup"
              className="block w-full bg-rondo-accent text-black font-heading font-black uppercase tracking-widest text-sm py-4 text-center rounded-xl active:scale-[0.98] transition-transform"
            >
              Create Account
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...gentle, delay: 0.47 }}
          >
            <Link
              href="/login"
              className="block w-full bg-white/[0.07] border border-white/12 text-white font-heading font-black uppercase tracking-widest text-sm py-4 text-center rounded-xl active:scale-[0.98] transition-transform backdrop-blur-sm"
            >
              Log In
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ ...gentle, delay: 0.56 }}
          >
            <button
              type="button"
              onClick={handleGuest}
              disabled={guestLoading}
              className="w-full py-3 text-white/40 text-xs uppercase tracking-[0.2em] disabled:opacity-40 transition-opacity flex items-center justify-center gap-2"
            >
              {guestLoading ? (
                <>
                  <Loader2 size={12} className="animate-spin" />
                  Please wait…
                </>
              ) : (
                "Continue as guest"
              )}
            </button>
          </motion.div>

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
