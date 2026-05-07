"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const slides = [
  {
    icon: "🔒",
    iconBg: "from-yellow-600 to-yellow-400",
    title: "SECURE YOUR SPOT",
    subtitle: "Book your place in local games before they fill up",
  },
  {
    icon: "🗺️",
    iconBg: "from-green-700 to-green-500",
    title: "FIND GAMES NEAR YOU",
    subtitle: "Discover football games happening in your area",
  },
  {
    icon: "👥",
    iconBg: "from-blue-700 to-blue-500",
    title: "SEE WHO'S PLAYING",
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
    <div className="flex flex-col min-h-screen p-6">
      {/* Skip */}
      <div className="flex justify-end">
        <Link href="/onboarding/role" className="text-muted-foreground text-sm hover:text-white">
          Skip
        </Link>
      </div>

      {/* Icon */}
      <div className="flex-1 flex items-center justify-center">
        <div className={`w-48 h-48 rounded-2xl bg-gradient-to-br ${slide.iconBg} flex items-center justify-center shadow-2xl`}>
          <span className="text-7xl">{slide.icon}</span>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-6 pb-8">
        <div className="space-y-3 text-center">
          <h1 className="text-white font-bold text-3xl tracking-wider uppercase">{slide.title}</h1>
          <p className="text-muted-foreground text-base">{slide.subtitle}</p>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-2">
          {slides.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === current ? "w-6 bg-rondo-yellow" : "w-1.5 bg-border"
              }`}
            />
          ))}
        </div>

        <Button
          onClick={handleNext}
          className="w-full bg-rondo-yellow text-rondo-black font-bold uppercase tracking-wider text-base py-6 hover:brightness-90"
        >
          {current === slides.length - 1 ? "Get Started" : "Next"}
        </Button>
      </div>
    </div>
  );
}
