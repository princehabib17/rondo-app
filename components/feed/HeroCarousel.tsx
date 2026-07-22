"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useMotionValue, AnimatePresence } from "motion/react";
import { ArrowRight } from "@phosphor-icons/react";
import type { CarouselSlide } from "@/lib/feed/carousel-slides";
import { bouncy, snappy } from "@/components/motion/springs";

interface HeroCarouselProps {
  slides: CarouselSlide[];
}

const THEME_BACKGROUND: Record<CarouselSlide["theme"], string> = {
  court: "",
  gold: "bg-[linear-gradient(135deg,color-mix(in_oklch,var(--gold)_38%,var(--bg-page))_0%,color-mix(in_oklch,var(--gold)_16%,var(--bg-page))_55%,var(--bg-page)_100%)]",
  dusk: "bg-[linear-gradient(135deg,color-mix(in_oklch,oklch(45%_0.09_290)_55%,var(--bg-page))_0%,color-mix(in_oklch,oklch(45%_0.09_290)_20%,var(--bg-page))_55%,var(--bg-page)_100%)]",
};

function SlideBackground({ slide, priority }: { slide: CarouselSlide; priority: boolean }) {
  if (slide.image) {
    return (
      <>
        <Image
          src={slide.image}
          alt=""
          fill
          className="object-cover"
          sizes="400px"
          quality={90}
          priority={priority}
        />
        {slide.theme === "court" && (
          <div className="absolute inset-0 rondo-map-shell opacity-35 mix-blend-screen" />
        )}
      </>
    );
  }

  return (
    <div className={`absolute inset-0 ${THEME_BACKGROUND[slide.theme]}`}>
      <div
        className={`absolute -top-16 right-[-4rem] h-64 w-64 rounded-full blur-3xl ${
          slide.theme === "gold"
            ? "bg-[color-mix(in_oklch,var(--gold)_55%,transparent)]"
            : "bg-[color-mix(in_oklch,oklch(65%_0.12_250)_60%,transparent)]"
        }`}
      />
      <div className="absolute inset-0 rondo-map-shell opacity-25 mix-blend-screen" />
    </div>
  );
}

export function HeroCarousel({ slides }: HeroCarouselProps) {
  const [current, setCurrent] = useState(0);
  const [dragging, setDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);

  // Auto-advance
  useEffect(() => {
    if (slides.length <= 1 || dragging) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length, dragging]);

  function handleDragEnd(_: unknown, info: { offset: { x: number }; velocity: { x: number } }) {
    const threshold = 40;
    const vThreshold = 300;
    const { offset, velocity } = info;

    if (offset.x < -threshold || velocity.x < -vThreshold) {
      setCurrent((prev) => Math.min(prev + 1, slides.length - 1));
    } else if (offset.x > threshold || velocity.x > vThreshold) {
      setCurrent((prev) => Math.max(prev - 1, 0));
    }
    x.set(0);
    setDragging(false);
  }

  const slide = slides[current];

  return (
    <section className="px-4 pt-4">
      <div
        ref={containerRef}
        className="relative min-h-[19rem] overflow-hidden rounded-[var(--r-lg)] border border-[var(--stroke)] bg-[var(--bg-page)] select-none"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={current}
            className="absolute inset-0"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={bouncy}
          >
            <SlideBackground slide={slide} priority={current === 0} />
          </motion.div>
        </AnimatePresence>
        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_45%,color-mix(in_oklch,var(--bg-page)_88%,transparent)_100%)]" />

        {/* Drag layer */}
        <motion.div
          className="absolute inset-0 cursor-grab active:cursor-grabbing"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.15}
          style={{ x }}
          onDragStart={() => setDragging(true)}
          onDragEnd={handleDragEnd}
        />

        <div className="pointer-events-none absolute inset-0 flex flex-col justify-end p-5">
          <motion.div
            key={`content-${current}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...bouncy, delay: 0.05 }}
            className="space-y-4"
          >
            <h2 className="max-w-[18rem] font-heading text-[2.6rem] font-black uppercase leading-[0.9] tracking-[-0.03em] text-[var(--ink-hi)]">
              {slide.title}
            </h2>
            <Link
              href={slide.ctaHref}
              className="pointer-events-auto inline-flex min-h-12 items-center gap-2 rounded-[var(--r-pill)] bg-[var(--gold)] px-5 font-heading text-sm font-black uppercase tracking-wide text-[var(--gold-ink)]"
            >
              {slide.ctaLabel}
              <ArrowRight size={16} weight="bold" />
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Indicator pills with spring width */}
      <div className="flex justify-center gap-1.5 mt-3">
        {slides.map((item, i) => (
          <motion.button
            key={item.id}
            type="button"
            onClick={() => setCurrent(i)}
            aria-label={`Go to slide ${i + 1}`}
            animate={{ width: i === current ? 20 : 6 }}
            transition={snappy}
            className="h-1.5 rounded-full bg-rondo-accent"
            style={{ opacity: i === current ? 1 : 0.3 }}
          />
        ))}
      </div>
    </section>
  );
}
