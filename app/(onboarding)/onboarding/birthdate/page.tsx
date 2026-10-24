"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { JoinShell } from "@/components/onboarding/JoinShell";
import { DrumPicker } from "@/components/onboarding/DrumPicker";
import { RondoButton } from "@/components/rondo/primitives";
import {
  joinBackPath,
  joinNextPath,
  readOnboardingDraft,
  writeOnboardingDraft,
} from "@/lib/onboarding/draft";
import {
  MONTHS,
  clampBirthParts,
  daysInMonth,
  defaultBirthParts,
  fromIsoDate,
  isOldEnough,
  toIsoDate,
  yearRange,
  type BirthParts,
} from "@/lib/date-of-birth";

export default function OnboardingBirthdatePage() {
  const router = useRouter();
  const [parts, setParts] = useState<BirthParts>(() => defaultBirthParts());
  const { min, max } = useMemo(() => yearRange(), []);

  useEffect(() => {
    const existing = readOnboardingDraft().birthdate;
    const parsed = existing ? fromIsoDate(existing) : null;
    if (parsed) setParts(clampBirthParts(parsed));
  }, []);

  const years = useMemo(() => {
    const out: string[] = [];
    for (let y = min; y <= max; y++) out.push(String(y));
    return out;
  }, [min, max]);
  const days = useMemo(
    () => Array.from({ length: daysInMonth(parts.year, parts.month) }, (_, i) => String(i + 1)),
    [parts.year, parts.month]
  );

  const update = useCallback((patch: Partial<BirthParts>) => {
    setParts((prev) => clampBirthParts({ ...prev, ...patch }));
  }, []);
  const onMonth = useCallback((i: number) => update({ month: i }), [update]);
  const onDay = useCallback((i: number) => update({ day: i + 1 }), [update]);
  const onYear = useCallback((i: number) => update({ year: min + i }), [update, min]);

  const age = useMemo(() => {
    const now = new Date();
    let a = now.getFullYear() - parts.year;
    if (now.getMonth() < parts.month || (now.getMonth() === parts.month && now.getDate() < parts.day)) a--;
    return a;
  }, [parts]);
  const oldEnough = isOldEnough(parts);

  function saveAndNext() {
    if (!oldEnough) return;
    writeOnboardingDraft({ birthdate: toIsoDate(parts) });
    router.push(joinNextPath("birthdate"));
  }

  return (
    <JoinShell
      step="birthdate"
      backHref={joinBackPath("birthdate")}
      title="When were you born?"
      subtitle="Your age shows on your profile so games match the right age group."
      footer={
        <RondoButton type="button" variant="primary" disabled={!oldEnough} onClick={saveAndNext}>
          Next
        </RondoButton>
      }
    >
      <div className="flex flex-1 flex-col justify-center gap-6">
        <DrumPicker
          columns={[
            {
              id: "month",
              label: "Month",
              items: MONTHS,
              selectedIndex: parts.month,
              onChange: onMonth,
              className: "flex-[1.6]",
            },
            { id: "day", label: "Day", items: days, selectedIndex: parts.day - 1, onChange: onDay },
            {
              id: "year",
              label: "Year",
              items: years,
              selectedIndex: parts.year - min,
              onChange: onYear,
              className: "flex-[1.2]",
            },
          ]}
        />
        <p className="text-center font-body text-sm text-[var(--ink-mid)]" aria-live="polite">
          {oldEnough ? (
            <>
              You&apos;re <span className="font-bold text-[var(--gold)]">{age}</span>
            </>
          ) : (
            <span className="text-[var(--live)]">You need to be 13 or older to join.</span>
          )}
        </p>
      </div>
    </JoinShell>
  );
}
