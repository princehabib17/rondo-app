"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { OnboardingHeader } from "@/components/onboarding/OnboardingHeader";

type Role = "player" | "organizer";

const roles: {
  id: Role;
  title: string;
  subtitle: string;
  image: string;
}[] = [
  {
    id: "player",
    title: "PLAYER",
    subtitle: "JOIN GAMES • ADD FRIENDS • HAVE FUN",
    image: "/roles/player.jpg",
  },
  {
    id: "organizer",
    title: "ORGANIZER",
    subtitle: "BE A HOST • AVOID FLAKES • BUILD COMMUNITIES",
    image: "/roles/organizer.jpg",
  },
];

export default function RoleSelectionPage() {
  const [selected, setSelected] = useState<Role | null>(null);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.replace("/login");
    });
  }, [router]);

  function handleConfirm() {
    if (!selected) return;
    sessionStorage.setItem("selectedRole", selected);
    router.push("/onboarding/profile");
  }

  return (
    <div className="min-h-screen bg-black flex flex-col px-6 py-8 max-w-lg mx-auto">
      <OnboardingHeader />

      <h1 className="font-heading text-white font-black italic text-3xl uppercase text-center mt-8 mb-6 leading-none">
        Choose Your Role
      </h1>

      <div className="flex-1 flex flex-col gap-4">
        {roles.map((role) => {
          const isSelected = selected === role.id;
          return (
            <button
              key={role.id}
              type="button"
              onClick={() => setSelected(role.id)}
              className={cn(
                "relative h-44 w-full overflow-hidden rounded-2xl border-2 text-left transition-all",
                isSelected ? "border-rondo-accent" : "border-transparent"
              )}
            >
              <Image
                src={role.image}
                alt=""
                fill
                className="object-cover"
                sizes="400px"
              />
              <div className="absolute inset-0 bg-black/55" />
              <div className="relative z-10 flex h-full flex-col items-center justify-center px-4 text-center">
                <h2 className="font-heading text-white font-black italic text-4xl uppercase leading-none">
                  {role.title}
                </h2>
                <p className="font-body text-white/90 text-[11px] tracking-wide mt-3 max-w-[260px]">
                  {role.subtitle}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={handleConfirm}
        disabled={!selected}
        className="mt-6 w-full bg-rondo-accent text-black font-heading font-black uppercase tracking-widest text-sm py-4 rounded-xl disabled:opacity-40"
      >
        Confirm Selection
      </button>
    </div>
  );
}
