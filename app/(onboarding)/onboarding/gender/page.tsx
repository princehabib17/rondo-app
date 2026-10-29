"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "@phosphor-icons/react";
import { JoinShell } from "@/components/onboarding/JoinShell";
import { RondoButton } from "@/components/rondo/primitives";
import { GENDER_OPTIONS, type Gender } from "@/lib/gender";
import {
  joinBackPath,
  joinNextPath,
  readOnboardingDraft,
  writeOnboardingDraft,
} from "@/lib/onboarding/draft";
import { cn } from "@/lib/utils";

export default function OnboardingGenderPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<Gender | null>(null);

  useEffect(() => {
    setSelected(readOnboardingDraft().gender);
  }, []);

  function saveAndNext() {
    if (!selected) return;
    writeOnboardingDraft({ gender: selected });
    router.push(joinNextPath("gender"));
  }

  return (
    <JoinShell
      step="gender"
      backHref={joinBackPath("gender")}
      title="What's your gender?"
      subtitle="Helps organizers balance sides and show the right open games."
      footer={
        <RondoButton type="button" variant="primary" disabled={!selected} onClick={saveAndNext}>
          Next
        </RondoButton>
      }
    >
      <div className="flex flex-1 flex-col justify-center gap-3" role="radiogroup" aria-label="Gender">
        {GENDER_OPTIONS.map((option) => {
          const active = selected === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setSelected(option.value)}
              className={cn(
                "flex min-h-14 items-center justify-between rounded-2xl border px-5 text-left font-body text-base font-semibold transition-[border-color,background-color,transform] duration-200 active:scale-[0.99]",
                active
                  ? "border-[var(--gold)] bg-[color-mix(in_oklch,var(--gold)_12%,var(--bg-surface))] text-[var(--ink-hi)]"
                  : "border-[var(--stroke)] bg-[var(--bg-surface)] text-[var(--ink-hi)] hover:border-[color-mix(in_oklch,var(--gold)_55%,var(--stroke))]"
              )}
            >
              <span>{option.label}</span>
              <span
                className={cn(
                  "grid size-6 place-items-center rounded-full border",
                  active
                    ? "border-[var(--gold)] bg-[var(--gold)] text-[var(--bg-night)]"
                    : "border-[var(--stroke)] text-transparent"
                )}
                aria-hidden
              >
                <Check size={14} weight="bold" />
              </span>
            </button>
          );
        })}
      </div>
    </JoinShell>
  );
}
