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
        className="object-cover object-center"
        sizes="100vw"
      />

      {/* Gradient overlay — dark at top and heavy at bottom */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/10 to-black" />

      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-screen px-6 pt-14 pb-10 max-w-lg mx-auto w-full">

        {/* Logo */}
        <div className="flex justify-center">
          <Image
            src="/rondo-logo.png"
            alt="Rondo"
            width={52}
            height={52}
            priority
            className="object-contain drop-shadow-[0_0_20px_rgba(255,250,152,0.4)]"
          />
        </div>

        <div className="flex-1" />

        {/* CTAs */}
        <div className="space-y-3">
          <Link
            href="/signup"
            className="block w-full bg-rondo-accent text-black font-heading font-black uppercase tracking-widest text-sm py-4 text-center rounded-xl active:scale-[0.98] transition-transform"
          >
            Create Account
          </Link>
          <Link
            href="/login"
            className="block w-full bg-white/[0.08] border border-white/15 text-white font-heading font-black uppercase tracking-widest text-sm py-4 text-center rounded-xl active:scale-[0.98] transition-transform backdrop-blur-sm"
          >
            Log In
          </Link>
          <button
            type="button"
            onClick={handleGuest}
            disabled={guestLoading}
            className="w-full py-3 text-white/45 text-xs uppercase tracking-[0.2em] disabled:opacity-40 transition-opacity"
          >
            {guestLoading ? "Please wait..." : "Continue as guest"}
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
