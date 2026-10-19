"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { JoinShell } from "@/components/onboarding/JoinShell";
import { RondoButton } from "@/components/rondo/primitives";
import {
  joinBackPath,
  joinNextPath,
  readOnboardingDraft,
  writeOnboardingDraft,
} from "@/lib/onboarding/draft";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function daysInMonth(year: number, monthIndex: number) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

export default function OnboardingBirthdatePage() {
  const router = useRouter();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [day, setDay] = useState(Math.min(now.getDate(), 28));
  const [year, setYear] = useState(2000);

  useEffect(() => {
    const existing = readOnboardingDraft().birthdate;
    if (!existing) return;
    const d = new Date(`${existing}T12:00:00`);
    if (Number.isNaN(d.getTime())) return;
    setMonth(d.getMonth());
    setDay(d.getDate());
    setYear(d.getFullYear());
  }, []);

  const maxDay = daysInMonth(year, month);
  const safeDay = Math.min(day, maxDay);
  const years = useMemo(() => {
    const out: number[] = [];
    for (let y = now.getFullYear() - 13; y >= 1950; y--) out.push(y);
    return out;
  }, [now]);

  function saveAndNext(skip: boolean) {
    if (skip) {
      writeOnboardingDraft({ birthdate: null });
    } else {
      const mm = String(month + 1).padStart(2, "0");
      const dd = String(safeDay).padStart(2, "0");
      writeOnboardingDraft({ birthdate: `${year}-${mm}-${dd}` });
    }
    router.push(joinNextPath("birthdate"));
  }

  return (
    <JoinShell
      step="birthdate"
      backHref={joinBackPath("birthdate")}
      title="When were you born?"
      subtitle="Your age will be visible in your profile."
      footer={
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => saveAndNext(true)}
            className="w-full py-2 text-center font-body text-sm font-semibold text-[var(--ink-mid)]"
          >
            Skip this step (optional)
          </button>
          <RondoButton type="button" variant="primary" onClick={() => saveAndNext(false)}>
            Next
          </RondoButton>
        </div>
      }
    >
      <div className="grid grid-cols-3 gap-2 rounded-[var(--r-md)] bg-[var(--bg-inset)] p-3">
        <label className="space-y-1">
          <span className="sr-only">Month</span>
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="h-12 w-full rounded-[var(--r-sm)] border-0 bg-[var(--bg-surface)] px-2 font-body text-sm font-semibold text-[var(--ink-hi)]"
          >
            {MONTHS.map((name, i) => (
              <option key={name} value={i}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1">
          <span className="sr-only">Day</span>
          <select
            value={safeDay}
            onChange={(e) => setDay(Number(e.target.value))}
            className="h-12 w-full rounded-[var(--r-sm)] border-0 bg-[var(--bg-surface)] px-2 font-body text-sm font-semibold text-[var(--ink-hi)]"
          >
            {Array.from({ length: maxDay }, (_, i) => i + 1).map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1">
          <span className="sr-only">Year</span>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="h-12 w-full rounded-[var(--r-sm)] border-0 bg-[var(--bg-surface)] px-2 font-body text-sm font-semibold text-[var(--ink-hi)]"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </label>
      </div>
    </JoinShell>
  );
}
