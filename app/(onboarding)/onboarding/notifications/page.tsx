"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { JoinShell } from "@/components/onboarding/JoinShell";
import { PermissionHero } from "@/components/onboarding/PermissionHero";
import { RondoButton } from "@/components/rondo/primitives";
import {
  joinBackPath,
  joinNextPath,
  readOnboardingDraft,
  writeOnboardingDraft,
} from "@/lib/onboarding/draft";

export default function OnboardingNotificationsPage() {
  const router = useRouter();
  const [enabled, setEnabled] = useState(false);
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setEnabled(readOnboardingDraft().notificationsEnabled);
  }, []);

  async function enableNotifications() {
    setAsking(true);
    setError(null);
    if (typeof Notification === "undefined") {
      setError("This browser can't send notifications. You can turn them on in the app later.");
      setAsking(false);
      return;
    }
    try {
      const result = await Notification.requestPermission();
      const ok = result === "granted";
      writeOnboardingDraft({ notificationsEnabled: ok });
      setEnabled(ok);
      if (!ok) setError("Notifications were blocked. You can turn them on later in settings.");
    } catch {
      setError("Could not ask for notification permission.");
    } finally {
      setAsking(false);
    }
  }

  return (
    <JoinShell
      step="notifications"
      backHref={joinBackPath("notifications")}
      title="Enable notifications"
      subtitle="Know when a spot opens, your game is about to start, or a teammate messages you."
      footer={
        <div className="space-y-3">
          {!enabled && (
            <RondoButton type="button" variant="primary" disabled={asking} onClick={enableNotifications}>
              {asking ? "Asking…" : "Enable notifications"}
            </RondoButton>
          )}
          <RondoButton
            type="button"
            variant={enabled ? "primary" : "ghost"}
            onClick={() => router.push(joinNextPath("notifications"))}
          >
            {enabled ? "Next" : "Not now"}
          </RondoButton>
        </div>
      }
    >
      <PermissionHero
        src="/onboarding/gold-bell.png"
        alt="Gold notification bell"
        enabled={enabled}
        enabledTitle="Notifications enabled"
        enabledBody="You'll get game invites, chat updates and match alerts."
      />
      {error && <p className="mt-4 text-center font-body text-sm text-[var(--live)]">{error}</p>}
    </JoinShell>
  );
}
