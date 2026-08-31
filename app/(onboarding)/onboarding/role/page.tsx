"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { AmbientVideo } from "@/components/media/AmbientVideo";
import { OnboardingHeader } from "@/components/onboarding/OnboardingHeader";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Role = "player" | "organizer";

const roles: Array<{
  id: Role;
  title: string;
  description: string;
  video: string;
  poster: string;
  mediaPosition?: string;
}> = [
  {
    id: "player",
    title: "Find my next game",
    description: "See open slots, join a squad, and get back on the court.",
    video: "/onboarding/media/footwork.mp4",
    poster: "/onboarding/media/footwork-poster.jpg",
    mediaPosition: "object-center",
  },
  {
    id: "organizer",
    title: "Run better games",
    description: "Publish matches, fill the roster, and manage matchday.",
    video: "/onboarding/media/match-crop.mp4",
    poster: "/onboarding/media/match-crop-poster.jpg",
    mediaPosition: "object-center",
  },
];

export default function RoleSelectionPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<Role | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [returnTo, setReturnTo] = useState<string | null>(null);

  useEffect(() => {
    const next = new URLSearchParams(window.location.search).get("next");
    setReturnTo(next);

    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        const loginNext = `/onboarding/role${next ? `?next=${encodeURIComponent(next)}` : ""}`;
        router.replace(`/login?next=${encodeURIComponent(loginNext)}`);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      if (profile?.role === "player" || profile?.role === "organizer") {
        setSelected(profile.role);
      }
    });
  }, [router]);

  async function handleConfirm() {
    if (!selected || saving) return;
    setSaving(true);
    setError(null);

    const supabase = createClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      setSaving(false);
      router.replace("/login?next=/onboarding/role");
      return;
    }

    const { data: updatedProfile, error: updateError } = await supabase
      .from("profiles")
      .update({ role: selected })
      .eq("id", data.user.id)
      .select("role")
      .single();

    if (updateError || updatedProfile?.role !== selected) {
      setSaving(false);
      setError(
        updatedProfile?.role
          ? "Your role is already set. You can switch it from your profile."
          : "We could not save your role. Try again."
      );
      return;
    }

    sessionStorage.setItem("selectedRole", selected);
    const params = new URLSearchParams();
    if (returnTo) params.set("next", returnTo);
    router.push(`/onboarding/profile${params.size ? `?${params.toString()}` : ""}`);
  }

  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col bg-[var(--bg-page)] px-5 py-6 rondo-phone-frame">
      <OnboardingHeader />

      <header className="pb-5 pt-7">
        <p className="mb-2 font-body text-[10px] font-black uppercase tracking-[0.2em] text-rondo-accent">
          1 of 2
        </p>
        <h1 className="rondo-hero-title max-w-[330px] text-[2.65rem] leading-[0.92] text-[var(--ink-hi)]">
          How will you use Rondo?
        </h1>
      </header>

      <div className="grid flex-1 gap-3">
        {roles.map((role) => {
          const isSelected = role.id === selected;
          return (
            <button
              key={role.id}
              type="button"
              onClick={() => setSelected(role.id)}
              aria-pressed={isSelected}
              className={cn(
                "group relative min-h-[205px] overflow-hidden rounded-3xl border text-left transition-[border-color,transform] duration-200 active:scale-[0.99]",
                isSelected ? "border-[var(--gold)]" : "border-[var(--stroke)]"
              )}
            >
              <AmbientVideo
                src={role.video}
                poster={role.poster}
                active={isSelected}
                sizes="(max-width: 480px) 100vw, 430px"
                fetchPriority={role.id === "player" ? "high" : "auto"}
                mediaClassName={cn(
                  "object-cover transition-transform duration-500 group-hover:scale-[1.02]",
                  role.mediaPosition
                )}
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.04)_15%,rgba(0,0,0,0.92)_100%)]" />

              <div
                className={cn(
                  "absolute right-4 top-4 grid size-8 place-items-center rounded-full border bg-[color-mix(in_oklch,var(--bg-night)_58%,transparent)] backdrop-blur-sm",
                  isSelected
                    ? "border-rondo-accent text-rondo-accent"
                    : "border-[color-mix(in_oklch,var(--night-ink)_30%,transparent)] text-transparent"
                )}
                aria-hidden
              >
                <Check size={17} strokeWidth={3} />
              </div>

              <div className="absolute inset-x-0 bottom-0 p-5">
                <h2 className="font-heading text-[1.65rem] font-black italic uppercase leading-none text-[var(--night-ink)]">
                  {role.title}
                </h2>
                <p className="mt-2 max-w-[315px] font-body text-xs font-medium leading-relaxed text-[color-mix(in_oklch,var(--night-ink)_68%,transparent)]">
                  {role.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {error && (
        <p className="mt-4 text-center font-body text-sm text-red-400" role="alert">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={handleConfirm}
        disabled={!selected || saving}
        className="rondo-btn rondo-btn-primary mt-5 disabled:opacity-40"
      >
        {saving ? "Saving role..." : "Continue"}
      </button>
    </main>
  );
}
