"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function OnboardingEntryPage() {
  const router = useRouter();

  useEffect(() => {
    const next = new URLSearchParams(window.location.search).get("next");
    const params = new URLSearchParams();
    if (next) params.set("next", next);
    router.replace(`/onboarding/role${params.size ? `?${params.toString()}` : ""}`);
  }, [router]);

  return (
    <main className="grid min-h-[100dvh] place-items-center bg-[var(--bg-page)] px-6 text-center">
      <div className="space-y-3">
        <div className="mx-auto h-1 w-20 overflow-hidden rounded-full bg-[var(--bg-inset)]">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-rondo-accent" />
        </div>
        <p className="rondo-label text-[var(--ink-low)]">Setting up matchday</p>
      </div>
    </main>
  );
}
