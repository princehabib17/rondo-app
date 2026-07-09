"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useMotionValue, AnimatePresence } from "motion/react";
import { ArrowRight, MapPin, Trophy } from "@phosphor-icons/react";
import type { CarouselSlide } from "@/lib/feed/carousel-slides";
import { bouncy, snappy } from "@/components/motion/springs";

interface HeroCarouselProps {
  slides: CarouselSlide[];
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
        className="relative min-h-[25rem] overflow-hidden rounded-[var(--r-lg)] border border-[var(--stroke)] bg-[var(--bg-page)] select-none"
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
            <Image
              src={slide.image}
              alt=""
              fill
              className="object-cover opacity-50 saturate-75"
              sizes="400px"
              quality={90}
              priority={current === 0}
            />
          </motion.div>
        </AnimatePresence>
        <div className="absolute inset-0 rondo-map-shell opacity-55 mix-blend-screen" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,color-mix(in_oklch,var(--bg-page)_35%,transparent)_0%,var(--bg-page)_76%)]" />

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

        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="rounded-[var(--r-md)] border border-[color-mix(in_oklch,var(--gold)_32%,transparent)] bg-[color-mix(in_oklch,var(--bg-page)_72%,transparent)] px-3 py-2 backdrop-blur-md">
              <span className="rondo-label text-[var(--gold)]">{slide.tag}</span>
              <p className="rondo-meta mt-1 text-[var(--ink-low)]">Tap, book, play</p>
            </div>
            <div className="grid h-16 w-16 place-items-center rounded-full border border-[var(--stroke)] bg-[color-mix(in_oklch,var(--bg-page)_68%,transparent)] backdrop-blur-md">
              {current % 2 === 0 ? (
                <MapPin size={28} weight="duotone" className="text-[var(--gold)]" aria-hidden />
              ) : (
                <Trophy size={28} weight="duotone" className="text-[var(--gold)]" aria-hidden />
              )}
            </div>
          </div>

          <motion.div
            key={`content-${current}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...bouncy, delay: 0.05 }}
            className="space-y-4"
          >
            <h2 className="max-w-[18rem] font-heading text-[3.25rem] font-black uppercase leading-[0.82] tracking-[-0.035em] text-[var(--ink-hi)]">
              {slide.title}
            </h2>
            <p className="max-w-[17rem] rondo-body text-[var(--ink-mid)]">
              {slide.description}
            </p>
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
