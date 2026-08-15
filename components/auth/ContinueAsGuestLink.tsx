"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInAsGuest } from "@/lib/auth/guest";
import { getSafeRedirectPath } from "@/lib/auth/safe-redirect";

const GUEST_BLOCKED_PREFIXES = ["/my-games", "/wallet", "/organizer"];
const GUEST_BLOCKED_SUFFIXES = ["/join", "/payment", "/chat", "/room", "/confirmed", "/invite"];

function getGuestDestination(rawNext: string | null): string {
  const next = getSafeRedirectPath(rawNext, "/feed");
  const isBlocked =
    GUEST_BLOCKED_PREFIXES.some((prefix) => next.startsWith(prefix)) ||
    GUEST_BLOCKED_SUFFIXES.some((suffix) => next.endsWith(suffix));

  return isBlocked ? "/feed" : next;
}

export function ContinueAsGuestLink() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleGuest() {
    setLoading(true);
    await signInAsGuest();
    const next = new URLSearchParams(window.location.search).get("next");
    router.replace(getGuestDestination(next));
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleGuest}
      disabled={loading}
      className="rondo-btn rondo-btn-secondary mt-3"
    >
      {loading ? "Opening feed" : "Continue as guest"}
    </button>
  );
}
