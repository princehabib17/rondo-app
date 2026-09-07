"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInAsGuest } from "@/lib/auth/guest";
import { signInAsScout } from "@/lib/auth/scout";
import { getSafeRedirectPath } from "@/lib/auth/safe-redirect";
import { Eye, UserSearch } from "lucide-react";

const GUEST_BLOCKED_PREFIXES = ["/my-games", "/wallet", "/organizer"];
const GUEST_BLOCKED_SUFFIXES = ["/join", "/payment", "/chat", "/room", "/confirmed", "/invite"];

function getGuestDestination(rawNext: string | null): string {
  const next = getSafeRedirectPath(rawNext, "/feed");
  const blocked =
    GUEST_BLOCKED_PREFIXES.some((prefix) => next.startsWith(prefix)) ||
    GUEST_BLOCKED_SUFFIXES.some((suffix) => next.endsWith(suffix));

  return blocked ? "/feed" : next;
}

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
    router.replace(getGuestDestination(next));
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
      <p className="text-center font-body text-xs text-[var(--ink-low)]">
        Or explore without signing up
      </p>
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={handleGuest}
          disabled={guestLoading || scoutLoading}
          className="flex flex-col items-center gap-1.5 rounded-[var(--r-md)] border border-[var(--stroke)] py-3 px-2 text-[var(--ink-low)] hover:text-[var(--ink-hi)] hover:border-[var(--stroke)] transition-colors disabled:opacity-40"
        >
          <Eye size={18} />
          <span className="font-body text-xs font-semibold">
            {guestLoading ? "Opening…" : "Browse matches"}
          </span>
        </button>
        <button
          type="button"
          onClick={handleScout}
          disabled={guestLoading || scoutLoading}
          className="flex flex-col items-center gap-1.5 rounded-[var(--r-md)] border border-[var(--stroke)] py-3 px-2 text-[var(--ink-low)] hover:text-[var(--ink-hi)] hover:border-[var(--stroke)] transition-colors disabled:opacity-40"
        >
          <UserSearch size={18} />
          <span className="font-body text-xs font-semibold">
            {scoutLoading ? "Opening…" : "Watch highlights"}
          </span>
        </button>
      </div>
      <p className="text-center font-body text-[var(--ink-low)] text-[10px] leading-relaxed">
        Browse matches to find games near you. Watch highlights to scout players and save a shortlist.
      </p>
      {error && (
        <p className="text-center text-xs text-[var(--live)]" role="alert">{error}</p>
      )}
    </div>
  );
}
