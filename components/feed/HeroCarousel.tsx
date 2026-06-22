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
      <div className="rondo-poster relative min-h-[27rem] overflow-hidden">
        <Image
          src={slide.image}
          alt=""
          fill
          className="object-cover"
          sizes="400px"
          priority
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,6,5,0.05),rgba(5,6,5,0.58)_46%,rgba(5,6,5,0.97)),radial-gradient(circle_at_22%_24%,rgba(255,241,109,0.14),transparent_34%)]" />

        <div className="absolute inset-0 z-10 flex flex-col justify-end p-5">
          <span className="mb-2 inline-flex self-start rounded-full border border-rondo-accent/35 bg-black/45 px-3 py-1 font-heading text-[10px] font-black uppercase tracking-[0.2em] text-rondo-accent">
            {slide.tag}
          </span>
          <h2 className="rondo-hero-title mb-3 text-[3.45rem] text-white drop-shadow-sm">
            {slide.title}
          </h2>
          <p className="font-body text-white/72 text-sm leading-5 mb-5 max-w-[285px]">
            {slide.description}
          </p>
          <Link
            href={slide.ctaHref}
            className="rondo-btn rondo-btn-primary min-h-[3.15rem] w-full text-[12px]"
          >
            {slide.ctaLabel}
            <ChevronRight size={14} strokeWidth={3} />
          </Link>
        </div>
      </div>

      <div className="flex justify-center gap-1.5 mt-3">
        {slides.map((item, i) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setCurrent(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === current ? "w-5 bg-rondo-accent" : "w-1.5 bg-rondo-accent/30"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
