"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { CarouselSlide } from "@/lib/feed/carousel-slides";

interface HeroCarouselProps {
  slides: CarouselSlide[];
}

export function HeroCarousel({ slides }: HeroCarouselProps) {
  const [current, setCurrent] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      advance((c: number) => (c + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  function advance(next: (c: number) => number) {
    if (transitioning) return;
    setCurrent((c) => {
      const n = next(c);
      setPrev(c);
      setTransitioning(true);
      setTimeout(() => {
        setPrev(null);
        setTransitioning(false);
      }, 600);
      return n;
    });
  }

  function goTo(i: number) {
    if (i === current || transitioning) return;
    setPrev(current);
    setTransitioning(true);
    setTimeout(() => {
      setPrev(null);
      setTransitioning(false);
    }, 600);
    setCurrent(i);
  }

  const slide = slides[current];

  return (
    <section className="px-4 pt-3">
      <div className="relative h-64 rounded-2xl overflow-hidden bg-[#111] select-none">

        {/* Outgoing slide */}
        {prev !== null && (
          <div
            className="absolute inset-0 z-10"
            style={{
              opacity: transitioning ? 0 : 1,
              transition: "opacity 600ms cubic-bezier(0.23,1,0.32,1)",
            }}
          >
            <Image
              src={slides[prev].image}
              alt=""
              fill
              className="object-cover"
              sizes="400px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/15" />
          </div>
        )}

        {/* Active slide */}
        <div
          className="absolute inset-0 z-20"
          style={{
            opacity: transitioning ? 1 : 1,
            transform: transitioning ? "scale(1)" : "scale(1)",
            transition: "opacity 600ms cubic-bezier(0.23,1,0.32,1)",
          }}
        >
          <Image
            src={slide.image}
            alt=""
            fill
            className="object-cover"
            sizes="400px"
            priority
          />
          {/* Richer gradient: sides + bottom */}
          <div className="absolute inset-0" style={{
            background: "linear-gradient(to top, #000 0%, rgba(0,0,0,0.65) 40%, rgba(0,0,0,0.1) 70%, transparent 100%)"
          }} />
          <div className="absolute inset-0" style={{
            background: "linear-gradient(to right, rgba(0,0,0,0.5) 0%, transparent 60%)"
          }} />
        </div>

        {/* Slide number indicator */}
        <div className="absolute top-3.5 right-3.5 z-30">
          <span className="font-heading text-white/40 text-[10px] font-black uppercase tracking-widest">
            {String(current + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
          </span>
        </div>

        {/* Content */}
        <div
          className="absolute inset-0 z-30 flex flex-col justify-end p-5"
          key={current}
          style={{ animation: "rondoSlideUp 500ms cubic-bezier(0.23,1,0.32,1) both" }}
        >
          <span className="rondo-kicker text-rondo-accent mb-2">
            {slide.tag}
          </span>
          <h2 className="rondo-hero-title text-white text-[2rem] mb-3 max-w-[240px]">
            {slide.title}
          </h2>
          <p className="font-body text-white/65 text-xs leading-relaxed mb-4 max-w-[230px]">
            {slide.description}
          </p>
          <Link
            href={slide.ctaHref}
            className="inline-flex items-center gap-2 self-start bg-rondo-accent text-black font-heading font-black text-[11px] uppercase tracking-widest px-4 py-2.5 rounded-lg active:scale-[0.97] transition-transform"
          >
            {slide.ctaLabel}
            <ArrowRight size={13} strokeWidth={2.5} />
          </Link>
        </div>
      </div>

      {/* Dot indicators */}
      <div className="flex items-center gap-2 mt-3 px-0.5">
        {slides.map((item, i) => (
          <button
            key={item.id}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`h-[3px] rounded-full transition-all duration-500 ${
              i === current
                ? "w-8 bg-rondo-accent"
                : "w-[10px] bg-white/20 hover:bg-white/35"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
