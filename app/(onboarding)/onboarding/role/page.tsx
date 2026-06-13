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
    subtitle: "JOIN GAMES / ADD FRIENDS / HAVE FUN",
    image: "/roles/player.jpg",
  },
  {
    id: "organizer",
    title: "ORGANIZER",
    subtitle: "BE A HOST / AVOID FLAKES / BUILD COMMUNITIES",
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
    <div className="min-h-[100dvh] bg-black flex flex-col px-5 py-7 max-w-sm mx-auto rondo-phone-frame">
      <OnboardingHeader />

      <h1 className="rondo-hero-title text-3xl mt-9 mb-6 leading-none">
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
                "relative h-36 w-full overflow-hidden rounded-xl border text-left transition-all",
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
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/35 to-transparent" />
              <div className="relative z-10 flex h-full flex-col justify-end px-4 pb-4">
                <h2 className="rondo-hero-title text-3xl leading-none">
                  {role.title}
                </h2>
                <p className="font-body text-white/75 text-[9px] tracking-wide mt-2 max-w-[260px]">
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
        className="rondo-btn rondo-btn-primary mt-6 disabled:opacity-40"
      >
        Confirm Selection
      </button>
    </div>
  );
}
