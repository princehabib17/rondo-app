"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { applyOnboardingDraft } from "@/lib/onboarding/apply-draft";
import { readOnboardingDraft } from "@/lib/onboarding/draft";

/** Post-OAuth landing: apply the pre-auth join draft, then enter the app. */
export default function OnboardingFinishPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Saving your profile…");

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const draft = readOnboardingDraft();
      if (!draft.username) {
        router.replace("/onboarding/username");
        return;
      }

      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      if (!data.user?.id) {
        router.replace("/onboarding/account");
        return;
      }

      try {
        await applyOnboardingDraft(data.user.id, draft);
        if (cancelled) return;
        router.replace("/feed");
        router.refresh();
      } catch {
        if (cancelled) return;
        setMessage("Could not save your profile. Taking you to the feed…");
        window.setTimeout(() => {
          router.replace("/feed");
          router.refresh();
        }, 1200);
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-[var(--bg-page)] px-5 text-center">
      <p className="font-body text-sm text-[var(--ink-mid)]">{message}</p>
    </main>
  );
}
