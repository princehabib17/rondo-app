"use client";

import { motion } from "motion/react";
import { snappy } from "@/components/motion/springs";
import { cn } from "@/lib/utils";

type Option<T extends string> = { value: T; label: string };

/** Pill segmented control for switching views inside one screen. */
export function SegmentedTabs<T extends string>({
  options,
  value,
  onChange,
  layoutId,
  className,
}: {
  options: readonly Option<T>[];
  value: T;
  onChange: (value: T) => void;
  layoutId: string;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      className={cn("grid gap-1 rounded-[var(--r-pill)] bg-[var(--bg-inset)] p-1", className)}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "relative flex h-9 items-center justify-center rounded-[var(--r-pill)] rondo-meta font-bold transition-colors",
              active ? "text-[var(--ink-hi)]" : "text-[var(--ink-low)] hover:text-[var(--ink-mid)]"
            )}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                transition={snappy}
                className="absolute inset-0 rounded-[var(--r-pill)] border border-[var(--stroke)] bg-[var(--bg-surface)]"
              />
            )}
            <span className="relative">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
