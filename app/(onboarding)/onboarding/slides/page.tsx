"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { OnboardingHeader } from "@/components/onboarding/OnboardingHeader";

const slides = [
  { image: "/onboarding/secure.png", title: "SECURE YOUR SPOT" },
  { image: "/onboarding/map.png", title: "FIND GAMES NEAR YOU" },
  { image: "/onboarding/players.png", title: "SEE WHO'S PLAYING" },
];

export default function OnboardingSlidesPage() {
  const [current, setCurrent] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.replace("/login");
    });
  }, [router]);

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
    <div className="min-h-[100dvh] bg-black flex flex-col px-5 py-7 max-w-sm mx-auto rondo-phone-frame">
      <OnboardingHeader />

      <div className="flex-1 flex items-center justify-center py-8">
        <Image
          src={slide.image}
          alt=""
          width={300}
          height={300}
          className="object-contain w-full max-w-[240px] h-auto drop-shadow-[0_20px_45px_rgba(246,224,55,0.12)]"
          priority
        />
      </div>

      <div className="pb-5 space-y-7">
        <h1 className="rondo-hero-title text-[1.9rem] leading-none text-center">
          {slide.title}
        </h1>

        <div className="flex justify-center gap-2.5">
          {slides.map((_, i) => (
            <div
              key={i}
              className={`rounded-full transition-all ${
                i === current
                  ? "w-2 h-2 bg-rondo-accent"
                  : "w-1.5 h-1.5 bg-rondo-accent/35"
              }`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={handleNext}
          className="rondo-btn rondo-btn-primary"
        >
          NEXT
        </button>
      </div>
    </div>
  );
}
