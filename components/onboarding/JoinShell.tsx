"use client";

import Link from "next/link";
import { CaretLeft } from "@phosphor-icons/react";
import { joinProgress, type JoinStepId } from "@/lib/onboarding/draft";

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
  const progress = joinProgress(step);

  return (
    <main className="relative mx-auto flex min-h-[100dvh] w-full max-w-md flex-col bg-[var(--bg-page)] px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] text-[var(--ink-hi)]">
      <header className="mb-8 flex items-center gap-3">
        <Link
          href={backHref}
          aria-label="Back"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[var(--stroke)] bg-[var(--bg-surface)] text-[var(--ink-hi)]"
        >
          <CaretLeft size={20} weight="bold" />
        </Link>
        <div
          className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--bg-inset)]"
          role="progressbar"
          aria-valuenow={Math.round(progress * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-[var(--ink-hi)] transition-[width] duration-300 ease-out"
            style={{ width: `${Math.max(8, progress * 100)}%` }}
          />
        </div>
      </header>

      <div className="mb-6 space-y-2">
        <h1 className="font-heading text-3xl font-bold tracking-tight text-[var(--ink-hi)]">{title}</h1>
        <p className="font-body text-sm text-[var(--ink-mid)]">{subtitle}</p>
      </div>

      <div className="flex-1">{children}</div>

      {footer ? <div className="mt-8">{footer}</div> : null}
    </main>
  );
}
