"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { signInAsGuest } from "@/lib/auth/guest";

export default function HomePage() {
  const router = useRouter();
  const [guestError, setGuestError] = useState<string | null>(null);
  const [guestLoading, setGuestLoading] = useState(false);

  async function handleGuest() {
    setGuestError(null);
    setGuestLoading(true);
    const result = await signInAsGuest();
    setGuestLoading(false);
    if (!result.ok) {
      setGuestError(result.error ?? "Guest sign-in failed");
      return;
    }
    router.push("/onboarding/slides");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-black flex flex-col px-6 py-8 max-w-lg mx-auto">
      <div className="pt-2">
        <Image
          src="/rondo-logo.png"
          alt=""
          width={48}
          height={48}
          priority
          className="object-contain"
        />
      </div>

      <div className="flex-1" />

      <div className="space-y-3 pb-8 w-full">
        <Link
          href="/signup"
          className="block w-full bg-white text-black font-bold py-4 text-center uppercase tracking-widest text-sm"
        >
          Create Account
        </Link>
        <Link
          href="/login"
          className="block w-full bg-rondo-accent text-black font-heading font-bold py-4 text-center uppercase tracking-widest text-sm"
        >
          Log In
        </Link>
        <button
          type="button"
          onClick={handleGuest}
          disabled={guestLoading}
          className="w-full py-3 text-white/80 text-xs uppercase tracking-[0.2em] hover:text-white disabled:opacity-50"
        >
          {guestLoading ? "Please wait..." : "Continue as guest"}
        </button>
        {guestError && (
          <p className="text-red-400 text-xs text-center leading-relaxed px-2">
            {guestError}
          </p>
        )}
      </div>
    </main>
  );
}
