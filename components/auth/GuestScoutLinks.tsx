"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInAsGuest } from "@/lib/auth/guest";
import { signInAsScout } from "@/lib/auth/scout";
import { getSafeRedirectPath } from "@/lib/auth/safe-redirect";
import { Eye, UserSearch } from "lucide-react";

export function GuestScoutLinks() {
  const router = useRouter();
  const [guestLoading, setGuestLoading] = useState(false);
  const [scoutLoading, setScoutLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGuest() {
    setError(null);
    setGuestLoading(true);
    const result = await signInAsGuest();
    if (!result.ok) {
      setError(result.error ?? "Guest sign-in failed");
      setGuestLoading(false);
      return;
    }
    const next = new URLSearchParams(window.location.search).get("next");
    router.push(next ? getSafeRedirectPath(next) : "/onboarding/slides");
    router.refresh();
  }

  async function handleScout() {
    setError(null);
    setScoutLoading(true);
    const result = await signInAsScout();
    if (!result.ok) {
      setError(result.error ?? "Scout sign-in failed");
      setScoutLoading(false);
      return;
    }
    router.push("/reels");
    router.refresh();
  }

  return (
    <div className="mt-6 space-y-3">
      <p className="text-center font-body text-white/30 text-xs uppercase tracking-widest">
        or browse without an account
      </p>
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={handleGuest}
          disabled={guestLoading || scoutLoading}
          className="flex flex-col items-center gap-1.5 rounded-xl border border-white/10 py-3 px-2 text-white/50 hover:text-white/80 hover:border-white/20 transition-colors disabled:opacity-40"
        >
          <Eye size={18} />
          <span className="font-body text-xs font-semibold">
            {guestLoading ? "Opening…" : "Guest"}
          </span>
        </button>
        <button
          type="button"
          onClick={handleScout}
          disabled={guestLoading || scoutLoading}
          className="flex flex-col items-center gap-1.5 rounded-xl border border-rondo-accent/40 bg-rondo-accent/5 py-3 px-2 text-rondo-accent hover:bg-rondo-accent/10 transition-colors disabled:opacity-40"
        >
          <UserSearch size={18} />
          <span className="font-body text-xs font-semibold">
            {scoutLoading ? "Opening…" : "Scout"}
          </span>
        </button>
      </div>
      <p className="text-center font-body text-white/25 text-[10px] leading-relaxed">
        Scout mode &mdash; browse players &amp; reels, build a shortlist
      </p>
      {error && (
        <p className="text-center text-xs text-red-400" role="alert">{error}</p>
      )}
    </div>
  );
}
