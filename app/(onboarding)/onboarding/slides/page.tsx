"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { OnboardingHeader } from "@/components/onboarding/OnboardingHeader";

const slides = [
  { image: "/onboarding/secure.png", title: "SECURE YOUR SPOT" },
  { image: "/onboarding/map.png", title: "FIND GAMES NEAR YOU" },
  { image: "/onboarding/players.png", title: "SEE WHO'S PLAYING" },
];

export default function OnboardingSlidesPage() {
  const [current, setCurrent] = useState(0);
  const router = useRouter();
  const slide = slides[current];
  const isLast = current === slides.length - 1;

  function handleNext() {
    if (isLast) {
      router.push("/onboarding/role");
    } else {
      setCurrent(current + 1);
    }
  }

  return (
    <div className="min-h-screen bg-black flex flex-col px-6 py-8 max-w-lg mx-auto">
      <OnboardingHeader />

      <div className="flex-1 flex items-center justify-center py-6">
        <Image
          src={slide.image}
          alt=""
          width={300}
          height={300}
          className="object-contain w-full max-w-[300px] h-auto"
          priority
        />
      </div>

      <div className="pb-6 space-y-8">
        <h1 className="font-heading text-white font-black italic text-[2rem] leading-none text-center uppercase">
          {slide.title}
        </h1>

        <div className="flex justify-center gap-2.5">
          {slides.map((_, i) => (
            <div
              key={i}
              className={`rounded-full transition-all ${
                i === current
                  ? "w-2.5 h-2.5 bg-rondo-accent"
                  : "w-2 h-2 bg-rondo-accent/35"
              }`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={handleNext}
          className="w-full bg-rondo-accent text-black font-heading font-black uppercase tracking-widest text-sm py-4 rounded-xl"
        >
          NEXT
        </button>
      </div>
    </div>
  );
}
