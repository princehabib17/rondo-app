"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { OnboardingHeader } from "@/components/onboarding/OnboardingHeader";
import { RondoButton } from "@/components/rondo/primitives";

const slides = [
  { image: "/onboarding/secure.png", title: "Secure your spot", body: "Reserve and pay before kick-off." },
  { image: "/onboarding/map.png", title: "Find games near you", body: "Open the map and join nearby runs." },
  { image: "/onboarding/players.png", title: "See who's playing", body: "Check rosters before you commit." },
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
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-sm flex-col px-5 py-7 rondo-phone-frame">
      <OnboardingHeader />

      <div className="mb-4 mt-4 flex gap-1.5">
        {slides.map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i <= current ? "bg-[var(--gold)]" : "bg-[var(--bg-inset)]"
            }`}
          />
        ))}
      </div>

      <div className="flex flex-1 items-center justify-center py-8">
        <Image
          src={slide.image}
          alt=""
          width={300}
          height={300}
          className="h-auto w-full max-w-[240px] object-contain"
          priority
        />
      </div>

      <div className="space-y-5 pb-5">
        <div className="space-y-2 text-center">
          <h1 className="rondo-hero-title text-[1.9rem] leading-none text-[var(--ink-hi)]">{slide.title}</h1>
          <p className="rondo-body text-[var(--ink-mid)]">{slide.body}</p>
        </div>

        <RondoButton onClick={handleNext} variant="primary">
          {isLast ? "Continue" : "Next"}
        </RondoButton>
      </div>
    </div>
  );
}
