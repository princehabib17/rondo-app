"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useMotionValue, useTransform, AnimatePresence } from "motion/react";
import { ChevronRight } from "lucide-react";
import type { CarouselSlide } from "@/lib/feed/carousel-slides";
import { snappy, bouncy } from "@/components/motion/springs";

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
        className="relative h-52 rounded-2xl overflow-hidden bg-secondary select-none"
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
              className="object-cover"
              sizes="400px"
              quality={90}
              priority={current === 0}
            />
          </motion.div>
        </AnimatePresence>

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

        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/20 pointer-events-none" />

        <div className="absolute inset-0 flex flex-col justify-end p-5 pointer-events-none">
          <motion.div
            key={`content-${current}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...bouncy, delay: 0.05 }}
          >
            <span className="font-heading text-rondo-accent text-[10px] font-black uppercase tracking-[0.2em] mb-1 block">
              {slide.tag}
            </span>
            <h2 className="font-heading text-white font-black italic text-2xl uppercase leading-none mb-1.5">
              {slide.title}
            </h2>
            <p className="font-body text-white/75 text-xs leading-relaxed mb-4 max-w-[260px]">
              {slide.description}
            </p>
          </motion.div>
          <Link
            href={slide.ctaHref}
            className="inline-flex items-center gap-2 self-start bg-rondo-accent text-black font-heading font-black text-xs uppercase tracking-wider px-4 py-2.5 rounded-lg pointer-events-auto"
          >
            {slide.ctaLabel}
            <ChevronRight size={14} strokeWidth={3} />
          </Link>
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
