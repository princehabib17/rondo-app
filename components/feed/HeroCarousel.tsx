"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { CarouselSlide } from "@/lib/feed/carousel-slides";

interface HeroCarouselProps {
  slides: CarouselSlide[];
}

export function HeroCarousel({ slides }: HeroCarouselProps) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const slide = slides[current];

  return (
    <section className="px-4 pt-4">
      <div className="relative h-52 rounded-2xl overflow-hidden bg-[#1c1c1c]">
        <Image
          src={slide.image}
          alt=""
          fill
          className="object-cover"
          sizes="400px"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/20" />

        <div className="absolute inset-0 flex flex-col justify-end p-5">
          <span className="font-heading text-rondo-accent text-[10px] font-black uppercase tracking-[0.2em] mb-1">
            {slide.tag}
          </span>
          <h2 className="font-heading text-white font-black italic text-2xl uppercase leading-none mb-1.5">
            {slide.title}
          </h2>
          <p className="font-body text-white/75 text-xs leading-relaxed mb-4 max-w-[260px]">
            {slide.description}
          </p>
          <Link
            href={slide.ctaHref}
            className="inline-flex items-center gap-2 self-start bg-rondo-accent text-black font-heading font-black text-xs uppercase tracking-wider px-4 py-2.5 rounded-lg"
          >
            {slide.ctaLabel}
            <ChevronRight size={14} strokeWidth={3} />
          </Link>
        </div>
      </div>

      <div className="flex justify-center gap-2 mt-3">
        {slides.map((item, i) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setCurrent(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`rounded-full transition-all ${
              i === current ? "w-2.5 h-2.5 bg-rondo-accent" : "w-2 h-2 bg-rondo-accent/30"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
