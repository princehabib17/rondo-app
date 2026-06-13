"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInAsGuest } from "@/lib/auth/guest";
import { getSafeRedirectPath } from "@/lib/auth/safe-redirect";

export function ContinueAsGuestLink() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleGuest() {
    setError(null);
    setLoading(true);
    const result = await signInAsGuest();

    if (!result.ok) {
      setError(result.error ?? "Guest sign-in failed");
      setLoading(false);
      return;
    }

    const next = new URLSearchParams(window.location.search).get("next");
    router.push(next ? getSafeRedirectPath(next) : "/onboarding/slides");
    router.refresh();
  }

  return (
    <div className="mt-4 text-center">
      <button
        type="button"
        onClick={handleGuest}
        disabled={loading}
        className="min-h-11 px-2 font-body text-sm font-semibold text-white/55 transition-colors hover:text-rondo-accent disabled:opacity-50"
      >
        {loading ? "Opening guest access..." : "Continue as guest"}
      </button>
      {error && (
        <p className="mt-2 text-center text-xs leading-relaxed text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
