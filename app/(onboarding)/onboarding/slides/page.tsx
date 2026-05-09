"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const slides = [
  {
    icon: "🔒",
    iconBg: "bg-primary/20",
    title: "SECURE YOUR SPOT",
    subtitle: "Book your place in local games before they fill up",
  },
  {
    icon: "🗺️",
    iconBg: "bg-primary/20",
    title: "FIND GAMES NEAR YOU",
    subtitle: "Discover football games happening in your area",
  },
  {
    icon: "👥",
    iconBg: "bg-primary/20",
    title: "SEE WHO&apos;S PLAYING",
    subtitle: "Browse team rosters and find your perfect squad",
  },
];

export default function OnboardingSlidesPage() {
  const [current, setCurrent] = useState(0);
  const router = useRouter();

  function handleNext() {
    if (current < slides.length - 1) {
      setCurrent(current + 1);
    } else {
      router.push("/onboarding/role");
    }
  }

  const slide = slides[current];

  return (
    <div className="flex flex-col min-h-screen p-6 max-w-lg mx-auto w-full">
      {/* Skip Link */}
      <div className="flex justify-end mb-4">
        <Link href="/onboarding/role" className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
          SKIP
        </Link>
      </div>

      {/* Icon Container */}
      <div className="flex-1 flex items-center justify-center">
        <div className={`w-56 h-56 rounded-3xl ${slide.iconBg} border-2 border-primary/40 flex items-center justify-center backdrop-blur-sm`}>
          <span className="text-8xl drop-shadow-lg">{slide.icon}</span>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-8 pb-6">
        <div className="space-y-4 text-center">
          <h1 className="text-foreground font-black text-3xl tracking-tight leading-tight">{slide.title}</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">{slide.subtitle}</p>
        </div>

        {/* Progress Indicator */}
        <div className="flex justify-center gap-2">
          {slides.map((_, i) => (
            <div
              key={i}
              className={`rounded-full transition-all duration-300 ${
                i === current ? "w-8 h-2 bg-primary" : "w-2 h-2 bg-border"
              }`}
            />
          ))}
        </div>

        <Button
          onClick={handleNext}
          className="w-full h-12 bg-primary text-primary-foreground font-black uppercase tracking-wider text-sm hover:brightness-110"
        >
          {current === slides.length - 1 ? "Get Started" : "Next"}
        </Button>
      </div>
    </div>
  );
}
