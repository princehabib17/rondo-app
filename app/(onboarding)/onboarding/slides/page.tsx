"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RondoBrand } from "@/components/brand/RondoBrand";
import { RondoButton } from "@/components/rondo/primitives";

const SLIDES = [
  {
    eyebrow: "Meet your community",
    title: "Meet players who match your level",
    image: "/onboarding/media/footwork-poster.jpg",
    alt: "Players warming up on the pitch",
  },
  {
    eyebrow: "Games near you",
    title: "Find open slots across the city",
    image: "/feed/hero-soccer.jpg",
    alt: "Football match in progress",
  },
  {
    eyebrow: "Host & organize easily",
    title: "Create, join, and chat in seconds",
    image: "/onboarding/media/footwork-poster.jpg",
    alt: "Squad organizing a match",
  },
] as const;

export default function OnboardingSlidesPage() {
  const router = useRouter();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % SLIDES.length);
    }, 4200);
    return () => window.clearInterval(id);
  }, []);

  const slide = SLIDES[index];

  return (
    <main className="relative mx-auto flex min-h-[100dvh] w-full max-w-md flex-col bg-[var(--bg-page)] px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] text-[var(--ink-hi)]">
      <div className="mb-6 flex justify-center pt-2">
        <RondoBrand kind="wordmark" surface="auto" className="h-9 w-36" fetchPriority="high" />
      </div>

      <div className="relative mx-auto aspect-[4/5] w-full max-w-sm overflow-hidden rounded-[1.75rem] bg-[var(--bg-inset)]">
        <Image
          key={slide.image + index}
          src={slide.image}
          alt={slide.alt}
          fill
          className="object-cover"
          sizes="400px"
          priority
        />
      </div>

      <div className="mt-8 space-y-2 text-center">
        <p className="font-body text-sm text-[var(--ink-mid)]">{slide.eyebrow}</p>
        <h1 className="font-heading text-[1.85rem] font-bold leading-tight tracking-tight text-[var(--ink-hi)]">
          {slide.title}
        </h1>
      </div>

      <div className="mt-6 flex justify-center gap-2" aria-label="Slide progress">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => setIndex(i)}
            className={`h-2 w-2 rounded-full transition-colors ${
              i === index ? "bg-[var(--ink-hi)]" : "bg-[var(--stroke)]"
            }`}
          />
        ))}
      </div>

      <div className="mt-auto space-y-4 pt-10">
        <RondoButton
          type="button"
          variant="primary"
          onClick={() => router.push("/onboarding/username")}
        >
          Get Started
        </RondoButton>
        <p className="text-center font-body text-sm text-[var(--ink-mid)]">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-[var(--ink-hi)] underline underline-offset-4">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
