"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { JoinShell } from "@/components/onboarding/JoinShell";
import { PermissionHero } from "@/components/onboarding/PermissionHero";
import { RondoButton, rondoFieldClass } from "@/components/rondo/primitives";
import {
  joinBackPath,
  joinNextPath,
  readOnboardingDraft,
  writeOnboardingDraft,
} from "@/lib/onboarding/draft";

export default function OnboardingLocationPage() {
  const router = useRouter();
  const [enabled, setEnabled] = useState(false);
  const [area, setArea] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);

  useEffect(() => {
    const draft = readOnboardingDraft();
    setEnabled(draft.locationEnabled);
    setArea(draft.area);
  }, []);

  const ready = enabled || area.trim().length >= 2;

  function next() {
    if (!ready) return;
    writeOnboardingDraft({ area: area.trim() });
    router.push(joinNextPath("location"));
  }

  function enableLocation() {
    setAsking(true);
    setError(null);
    if (!navigator.geolocation) {
      setError("Location isn't available on this device. Type your area below.");
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
        setError("Location was blocked. Turn it on in your browser settings, or type your area below.");
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
      subtitle="We use it to show games and pitches near you. Your exact spot is never shown to other players."
      footer={
        <div className="space-y-3">
          {!enabled && (
            <RondoButton type="button" variant="secondary" disabled={asking} onClick={enableLocation}>
              {asking ? "Asking…" : "Enable location"}
            </RondoButton>
          )}
          <RondoButton type="button" variant="primary" disabled={!ready} onClick={next}>
            Next
          </RondoButton>
        </div>
      }
    >
      <PermissionHero
        src="/onboarding/gold-pin.png"
        alt="Gold map pin"
        enabled={enabled}
        enabledTitle="Location enabled"
        enabledBody="You'll see games and pitches closest to you first."
      />
      {!enabled && (
        <label className="mt-2 block">
          <span className="sr-only">Area near you</span>
          <input
            value={area}
            onChange={(e) => setArea(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && next()}
            placeholder="Or type your area, e.g. BGC"
            maxLength={60}
            className={rondoFieldClass}
          />
        </label>
      )}
      {error && <p className="mt-3 text-center font-body text-sm text-[var(--live)]">{error}</p>}
    </JoinShell>
  );
}
