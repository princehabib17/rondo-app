"use client";

import Link from "next/link";
import { CaretLeft } from "@phosphor-icons/react";
import { motion, useReducedMotion } from "motion/react";
import { JOIN_STEPS, joinProgress, joinStepIndex, type JoinStepId } from "@/lib/onboarding/draft";

export function JoinShell({
  step,
  backHref,
  title,
  subtitle,
  children,
  footer,
}: {
  step: JoinStepId;
  backHref: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  const reduceMotion = useReducedMotion();
  const progress = joinProgress(step);
  const index = joinStepIndex(step);
  // Start the bar where the previous step left it so it visibly fills forward.
  const from = index > 0 ? index / JOIN_STEPS.length : 0;

  return (
    <main className="relative mx-auto flex min-h-[100dvh] w-full max-w-md flex-col bg-[var(--bg-page)] px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] text-[var(--ink-hi)]">
      <header className="mb-8 flex items-center gap-4">
        <Link
          href={backHref}
          aria-label="Back"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[var(--stroke)] bg-[var(--bg-surface)] text-[var(--ink-hi)] transition-colors hover:border-[var(--gold)]"
        >
          <CaretLeft size={20} weight="bold" />
        </Link>
        <div
          className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--bg-inset)]"
          role="progressbar"
          aria-label={`Step ${index + 1} of ${JOIN_STEPS.length}`}
          aria-valuenow={Math.round(progress * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <motion.div
            className="h-full rounded-full bg-[linear-gradient(90deg,color-mix(in_oklch,var(--gold)_75%,black),var(--gold))] shadow-[0_0_12px_color-mix(in_oklch,var(--gold)_55%,transparent)]"
            initial={{ width: `${Math.max(6, from * 100)}%` }}
            animate={{ width: `${Math.max(6, progress * 100)}%` }}
            transition={{ duration: reduceMotion ? 0 : 0.6, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
        <span className="w-11 shrink-0 text-right font-body text-xs font-semibold tabular-nums text-[var(--ink-low)]">
          {index + 1}/{JOIN_STEPS.length}
        </span>
      </header>

      <motion.div
        className="flex flex-1 flex-col"
        initial={{ opacity: 0, x: reduceMotion ? 0 : 24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.38, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="mb-6 space-y-2">
          <h1 className="font-heading text-[2.1rem] font-black uppercase leading-[0.95] tracking-tight text-[var(--ink-hi)]">
            {title}
          </h1>
          <p className="font-body text-[0.95rem] leading-relaxed text-[var(--ink-mid)]">{subtitle}</p>
        </div>

        <div className="flex flex-1 flex-col">{children}</div>
      </motion.div>

      {footer ? <div className="mt-8">{footer}</div> : null}
    </main>
  );
}
