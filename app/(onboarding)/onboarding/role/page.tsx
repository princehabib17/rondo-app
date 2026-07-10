"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { OnboardingHeader } from "@/components/onboarding/OnboardingHeader";
import { RondoButton } from "@/components/rondo/primitives";

type Role = "player" | "organizer";

const roles: {
  id: Role;
  title: string;
  subtitle: string;
  image: string;
}[] = [
  {
    id: "player",
    title: "Player",
    subtitle: "Join games, add friends, and show up ready.",
    image: "/roles/player.jpg",
  },
  {
    id: "organizer",
    title: "Organizer",
    subtitle: "Host matches, collect payments, build your community.",
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
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-sm flex-col px-5 py-7 rondo-phone-frame">
      <OnboardingHeader />

      <div className="mb-4 mt-4 flex gap-1.5">
        <div className="h-1 flex-1 rounded-full bg-[var(--gold)]" />
        <div className="h-1 flex-1 rounded-full bg-[var(--gold)]" />
        <div className="h-1 flex-1 rounded-full bg-[var(--bg-inset)]" />
      </div>

      <h1 className="rondo-hero-title mb-6 mt-2 text-3xl leading-none text-[var(--ink-hi)]">Choose your role</h1>

      <div className="flex flex-1 flex-col gap-4">
        {roles.map((role) => {
          const isSelected = selected === role.id;
          return (
            <button
              key={role.id}
              type="button"
              onClick={() => setSelected(role.id)}
              className={cn(
                "relative h-36 w-full overflow-hidden rounded-[var(--r-md)] border text-left transition-all",
                isSelected
                  ? "border-[var(--gold)]"
                  : "border-[var(--stroke)]"
              )}
            >
              <Image src={role.image} alt="" fill className="object-cover" sizes="400px" />
              <div className="absolute inset-0 bg-[linear-gradient(90deg,color-mix(in_oklch,var(--bg-page)_88%,transparent)_0%,color-mix(in_oklch,var(--bg-page)_35%,transparent)_55%,transparent_100%)]" />
              <div className="relative z-10 flex h-full flex-col justify-end px-4 pb-4">
                <h2 className="font-heading text-3xl font-black uppercase leading-none text-[var(--ink-hi)]">
                  {role.title}
                </h2>
                <p className="rondo-meta mt-2 max-w-[260px] text-[var(--ink-mid)]">{role.subtitle}</p>
              </div>
            </button>
          );
        })}
      </div>

      <RondoButton onClick={handleConfirm} disabled={!selected} variant="primary" className="mt-6">
        Confirm selection
      </RondoButton>
    </div>
  );
}
