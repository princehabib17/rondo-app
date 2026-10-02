"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { snappy } from "@/components/motion/springs";
import { cn } from "@/lib/utils";

const SEGMENTS = [
  { href: "/my-games", label: "My matches" },
  { href: "/tournaments", label: "Tournaments" },
] as const;

/** Segmented control shared by the two screens under the Matches tab. */
export function MatchesSwitcher() {
  const pathname = usePathname();

  return (
    <nav aria-label="Matches" className="grid grid-cols-2 gap-1 rounded-[var(--r-pill)] bg-[var(--bg-inset)] p-1">
      {SEGMENTS.map((segment) => {
        const active = pathname === segment.href;
        return (
          <Link
            key={segment.href}
            href={segment.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative flex h-9 items-center justify-center rounded-[var(--r-pill)] rondo-meta font-bold transition-colors",
              active ? "text-[var(--ink-hi)]" : "text-[var(--ink-low)] hover:text-[var(--ink-mid)]"
            )}
          >
            {active && (
              <motion.span
                layoutId="matches-switcher"
                transition={snappy}
                className="absolute inset-0 rounded-[var(--r-pill)] border border-[var(--stroke)] bg-[var(--bg-surface)]"
              />
            )}
            <span className="relative">{segment.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
