"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, MapPin } from "@phosphor-icons/react";
import { JoinShell } from "@/components/onboarding/JoinShell";
import { RondoButton } from "@/components/rondo/primitives";
import {
  joinBackPath,
  joinNextPath,
  readOnboardingDraft,
  writeOnboardingDraft,
} from "@/lib/onboarding/draft";

export default function OnboardingLocationPage() {
  const router = useRouter();
  const [enabled, setEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);

  useEffect(() => {
    setEnabled(readOnboardingDraft().locationEnabled);
  }, []);

  async function enableLocation() {
    setAsking(true);
    setError(null);
    if (!navigator.geolocation) {
      setError("Location is not available on this device.");
      setAsking(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        writeOnboardingDraft({
          locationEnabled: true,
          lastLat: pos.coords.latitude,
          lastLng: pos.coords.longitude,
        });
        setEnabled(true);
        setAsking(false);
      },
      () => {
        setError("Location permission was denied. You can still continue.");
        writeOnboardingDraft({ locationEnabled: false, lastLat: null, lastLng: null });
        setEnabled(false);
        setAsking(false);
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  }

  return (
    <JoinShell
      step="location"
      backHref={joinBackPath("location")}
      title="Enable location"
      subtitle="We need your location to show you games nearby. You can enable location services or continue and set it later."
      footer={
        <div className="space-y-3">
          {!enabled && (
            <RondoButton type="button" variant="secondary" disabled={asking} onClick={enableLocation}>
              {asking ? "Asking…" : "Enable location"}
            </RondoButton>
          )}
          <RondoButton
            type="button"
            variant="primary"
            onClick={() => router.push(joinNextPath("location"))}
          >
            Next
          </RondoButton>
        </div>
      }
    >
      <div className="flex flex-col items-center gap-8 pt-6">
        <div className="flex h-44 w-44 items-center justify-center rounded-full bg-[var(--bg-inset)]">
          <MapPin size={88} weight="fill" className="text-[var(--gold)]" />
        </div>

        {enabled ? (
          <div className="flex w-full items-start gap-3 rounded-[var(--r-md)] border border-[var(--stroke)] bg-[var(--bg-surface)] px-4 py-3">
            <CheckCircle size={28} weight="fill" className="shrink-0 text-[var(--ok)]" />
            <div>
              <p className="font-body text-sm font-bold text-[var(--ink-hi)]">Location enabled!</p>
              <p className="font-body text-xs text-[var(--ink-mid)]">
                We can show nearby games and clubs.
              </p>
            </div>
          </div>
        ) : null}
        {error && <p className="text-center text-sm text-[var(--live)]">{error}</p>}
      </div>
    </JoinShell>
  );
}
