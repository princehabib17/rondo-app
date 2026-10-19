"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCircle } from "@phosphor-icons/react";
import { JoinShell } from "@/components/onboarding/JoinShell";
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
      setError("Notifications are not available in this browser.");
      setAsking(false);
      return;
    }
    try {
      const result = await Notification.requestPermission();
      const ok = result === "granted";
      writeOnboardingDraft({ notificationsEnabled: ok });
      setEnabled(ok);
      if (!ok) setError("Notifications were not enabled. You can turn them on later.");
    } catch {
      setError("Could not request notification permission.");
    } finally {
      setAsking(false);
    }
  }

  return (
    <JoinShell
      step="notifications"
      backHref={joinBackPath("notifications")}
      title="Enable notifications"
      subtitle="We'll send you notifications about games you've joined, messages from other players, and more."
      footer={
        <div className="space-y-3">
          {!enabled && (
            <RondoButton
              type="button"
              variant="secondary"
              disabled={asking}
              onClick={enableNotifications}
            >
              {asking ? "Asking…" : "Enable notifications"}
            </RondoButton>
          )}
          <RondoButton
            type="button"
            variant="primary"
            onClick={() => router.push(joinNextPath("notifications"))}
          >
            Next
          </RondoButton>
        </div>
      }
    >
      <div className="flex flex-col items-center gap-8 pt-6">
        <div className="flex h-44 w-44 items-center justify-center rounded-full bg-[var(--bg-inset)]">
          <Bell size={88} weight="fill" className="text-[var(--ink-hi)]" />
        </div>

        {enabled ? (
          <div className="flex w-full items-start gap-3 rounded-[var(--r-md)] border border-[var(--stroke)] bg-[var(--bg-surface)] px-4 py-3">
            <CheckCircle size={28} weight="fill" className="shrink-0 text-[var(--ok)]" />
            <div>
              <p className="font-body text-sm font-bold text-[var(--ink-hi)]">Notifications Enabled</p>
              <p className="font-body text-xs text-[var(--ink-mid)]">
                You will receive game invites, chat updates, and important match alerts.
              </p>
            </div>
          </div>
        ) : null}
        {error && <p className="text-center text-sm text-[var(--live)]">{error}</p>}
      </div>
    </JoinShell>
  );
}
