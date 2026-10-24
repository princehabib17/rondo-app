"use client";

import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { CheckCircle } from "@phosphor-icons/react";

/** Large 3D asset floating over soft gold rings, with a success pill once granted. */
export function PermissionHero({
  src,
  alt,
  enabled,
  enabledTitle,
  enabledBody,
}: {
  src: string;
  alt: string;
  enabled: boolean;
  enabledTitle: string;
  enabledBody: string;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8">
      <div className="relative flex h-[19rem] w-[19rem] items-center justify-center">
        {[1, 0.74, 0.5].map((size, i) => (
          <motion.span
            key={size}
            aria-hidden
            className="absolute rounded-full border border-[color-mix(in_oklch,var(--gold)_18%,transparent)]"
            style={{
              width: `${size * 100}%`,
              height: `${size * 100}%`,
              background: `radial-gradient(circle, color-mix(in oklch, var(--gold) ${6 + i * 4}%, transparent) 0%, transparent 72%)`,
            }}
            animate={
              reduceMotion || !enabled
                ? { scale: 1, opacity: 1 }
                : { scale: [1, 1.05, 1], opacity: [1, 0.7, 1] }
            }
            transition={{ duration: 2.4, repeat: enabled && !reduceMotion ? Infinity : 0, delay: i * 0.25 }}
          />
        ))}
        <motion.div
          className="relative h-48 w-48 drop-shadow-[0_24px_30px_rgba(0,0,0,0.55)]"
          initial={{ opacity: 0, y: reduceMotion ? 0 : 18, scale: reduceMotion ? 1 : 0.9 }}
          animate={
            reduceMotion
              ? { opacity: 1, y: 0, scale: 1 }
              : { opacity: 1, y: [0, -10, 0], scale: 1 }
          }
          transition={{
            opacity: { duration: 0.4 },
            scale: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
            y: reduceMotion ? { duration: 0 } : { duration: 3.2, repeat: Infinity, ease: "easeInOut" },
          }}
        >
          <Image src={src} alt={alt} fill priority sizes="192px" className="object-contain" />
        </motion.div>
      </div>

      <AnimatePresence>
        {enabled && (
          <motion.div
            role="status"
            initial={{ opacity: 0, y: reduceMotion ? 0 : 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 26 }}
            className="flex w-full items-center gap-3 rounded-full border border-[var(--stroke)] bg-[var(--bg-surface)] py-2.5 pl-2.5 pr-5 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.6)]"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_oklch,var(--ok)_16%,transparent)]">
              <CheckCircle size={26} weight="fill" className="text-[var(--ok)]" />
            </span>
            <span className="min-w-0">
              <span className="block font-body text-[0.95rem] font-bold text-[var(--ink-hi)]">{enabledTitle}</span>
              <span className="block truncate font-body text-xs text-[var(--ink-mid)]">{enabledBody}</span>
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
