"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { signInAsGuest } from "@/lib/auth/guest";
import { RondoButton, RondoPage } from "@/components/rondo/primitives";

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
    <RondoPage className="flex flex-col px-6 py-8 max-w-lg mx-auto">
      <header className="pt-2 flex items-center justify-between">
        <Image
          src="/rondo-logo.png"
          alt="RONDO"
          width={44}
          height={44}
          priority
          className="object-contain"
        />
        <span className="font-heading text-[10px] uppercase tracking-[0.35em] text-white/40">
          Manila · Futsal
        </span>
      </header>

      <div className="flex-1 flex flex-col justify-center py-10">
        <p className="font-heading text-rondo-accent text-xs uppercase tracking-[0.28em] mb-4">
          Find your match
        </p>
        <h1 className="font-heading text-white font-black italic uppercase text-[clamp(2.75rem,12vw,4.25rem)] leading-[0.92] tracking-tight">
          Play
          <br />
          tonight.
        </h1>
        <p className="font-body text-white/55 text-sm leading-relaxed max-w-[28ch] mt-5">
          Join local matches, pay from your wallet, and show up ready.
        </p>
      </div>

      <div className="space-y-3 pb-6 w-full">
        <RondoButton href="/signup" variant="secondary">
          Create account
        </RondoButton>
        <RondoButton href="/login" variant="primary">
          Log in
        </RondoButton>
        <button
          type="button"
          onClick={handleGuest}
          disabled={guestLoading}
          className="rondo-btn rondo-btn-ghost w-full"
        >
          {guestLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" aria-hidden />
              Opening feed…
            </>
          ) : (
            "Continue as guest"
          )}
        </button>
        {guestError && (
          <p className="text-red-400/90 text-xs text-center leading-relaxed px-2" role="alert">
            {guestError}
          </p>
        )}
      </div>
    </RondoPage>
  );
}
