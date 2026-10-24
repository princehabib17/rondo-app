"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion, type PanInfo } from "motion/react";
import { ArrowLeft, ArrowRight } from "@phosphor-icons/react";
import { RondoBrand } from "@/components/brand/RondoBrand";
import { cn } from "@/lib/utils";

const SLIDES = [
  {
    eyebrow: "01 — Your level",
    title: "Find your level",
    body: "Tell us how you play once. Every game you join is matched to it.",
    image: "/onboarding/slides/level.webp",
    alt: "Gold boots and a ball on a floodlit pitch",
  },
  {
    eyebrow: "02 — Near you",
    title: "Find players near you",
    body: "Open games across the city tonight, one tap from a spot on the pitch.",
    image: "/onboarding/slides/nearby.webp",
    alt: "Rooftop pitch under floodlights with the city skyline behind",
  },
  {
    eyebrow: "03 — Compete",
    title: "Win tournaments",
    body: "Join a squad, climb the bracket, and lift the cup.",
    image: "/onboarding/slides/tournaments.webp",
    alt: "Gold trophy on the pitch under stadium lights",
  },
] as const;

const SWIPE_DISTANCE = 60;
const SWIPE_VELOCITY = 400;

export default function OnboardingSlidesPage() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [[index, direction], setPage] = useState<[number, number]>([0, 0]);
  const isLast = index === SLIDES.length - 1;
  const slide = SLIDES[index];

  const goTo = useCallback((next: number) => {
    setPage(([current]) => {
      const clamped = Math.max(0, Math.min(SLIDES.length - 1, next));
      return clamped === current ? [current, 0] : [clamped, clamped > current ? 1 : -1];
    });
  }, []);

  const finish = useCallback(() => router.push("/onboarding/username"), [router]);

  const next = useCallback(() => {
    if (isLast) finish();
    else goTo(index + 1);
  }, [finish, goTo, index, isLast]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") goTo(index - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goTo, index, next]);

  function onDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.x < -SWIPE_DISTANCE || info.velocity.x < -SWIPE_VELOCITY) goTo(index + 1);
    else if (info.offset.x > SWIPE_DISTANCE || info.velocity.x > SWIPE_VELOCITY) goTo(index - 1);
  }

  const distance = reduceMotion ? 0 : 56;

  return (
    <main className="relative mx-auto flex min-h-[100dvh] w-full max-w-md flex-col overflow-hidden bg-[var(--bg-page)] px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] text-[var(--ink-hi)]">
      <header className="flex h-12 items-center justify-between">
        <span className="w-14" aria-hidden />
        <RondoBrand kind="wordmark" surface="auto" className="h-8 w-32" fetchPriority="high" />
        <button
          type="button"
          onClick={finish}
          className="w-14 text-right font-body text-sm font-semibold text-[var(--ink-mid)] transition-colors hover:text-[var(--ink-hi)]"
        >
          Skip
        </button>
      </header>

      <motion.div
        className="relative mx-auto mt-5 aspect-[4/5] w-full max-w-sm cursor-grab touch-pan-y overflow-hidden rounded-[1.75rem] bg-[var(--bg-inset)] shadow-[0_24px_60px_-20px_color-mix(in_oklch,var(--gold)_35%,transparent)] active:cursor-grabbing"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.18}
        onDragEnd={onDragEnd}
        aria-roledescription="carousel"
        aria-label={`Slide ${index + 1} of ${SLIDES.length}`}
      >
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={slide.image}
            custom={direction}
            className="absolute inset-0"
            initial={{ opacity: 0, x: direction * distance, scale: reduceMotion ? 1 : 1.06 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -direction * distance, scale: reduceMotion ? 1 : 0.98 }}
            transition={{ duration: reduceMotion ? 0 : 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <Image
              src={slide.image}
              alt={slide.alt}
              fill
              draggable={false}
              className="pointer-events-none select-none object-cover"
              sizes="(max-width: 448px) 100vw, 384px"
              priority={index === 0}
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_55%,color-mix(in_oklch,var(--bg-page)_70%,transparent)_100%)]" />
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Preload the other slides so swiping never shows a blank card. */}
      <div className="hidden" aria-hidden>
        {SLIDES.filter((_, i) => i !== index).map((s) => (
          <Image key={s.image} src={s.image} alt="" width={10} height={10} sizes="384px" />
        ))}
      </div>

      <div className="relative mt-8 min-h-[9.5rem] text-center" aria-live="polite">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={slide.title}
            initial={{ opacity: 0, y: reduceMotion ? 0 : 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduceMotion ? 0 : -8 }}
            transition={{ duration: reduceMotion ? 0 : 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-3"
          >
            <p className="font-body text-xs font-bold uppercase tracking-[0.18em] text-[var(--gold)]">
              {slide.eyebrow}
            </p>
            <h1 className="font-heading text-[2.6rem] font-black uppercase leading-[0.95] tracking-tight text-[var(--ink-hi)]">
              {slide.title}
            </h1>
            <p className="mx-auto max-w-[30ch] font-body text-[0.95rem] leading-relaxed text-[var(--ink-mid)]">
              {slide.body}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-4 flex justify-center gap-2" role="tablist" aria-label="Slides">
        {SLIDES.map((s, i) => (
          <button
            key={s.title}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-label={`Go to slide ${i + 1}: ${s.title}`}
            onClick={() => goTo(i)}
            className="flex h-6 items-center"
          >
            <motion.span
              className={cn("block h-2 rounded-full", i === index ? "bg-[var(--gold)]" : "bg-[var(--stroke)]")}
              animate={{ width: i === index ? 28 : 8 }}
              transition={{ duration: reduceMotion ? 0 : 0.3, ease: [0.22, 1, 0.36, 1] }}
            />
          </button>
        ))}
      </div>

      <div className="mt-auto space-y-4 pt-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => goTo(index - 1)}
            disabled={index === 0}
            aria-label="Previous slide"
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-[var(--stroke)] bg-[var(--bg-surface)] text-[var(--ink-hi)] transition-opacity disabled:opacity-30"
          >
            <ArrowLeft size={22} weight="bold" />
          </button>
          <button
            type="button"
            onClick={next}
            className="flex h-14 flex-1 items-center justify-center gap-2 rounded-full bg-[var(--gold)] font-body text-base font-bold text-[var(--gold-ink)] transition-transform active:scale-[0.98]"
          >
            {isLast ? "Get Started" : "Next"}
            <ArrowRight size={20} weight="bold" />
          </button>
        </div>
        <p className="text-center font-body text-sm text-[var(--ink-mid)]">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-[var(--gold)] underline-offset-4 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
