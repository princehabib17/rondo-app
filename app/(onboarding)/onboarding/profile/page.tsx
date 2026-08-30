"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { OnboardingHeader } from "@/components/onboarding/OnboardingHeader";
import { rondoFieldClass } from "@/components/rondo/primitives";
import { getPostOnboardingDestination } from "@/lib/auth/destination";
import { createClient } from "@/lib/supabase/client";

const essentialsSchema = z.object({
  full_name: z.string().trim().min(2, "Tell us what to call you."),
  preferred_areas: z.string().trim().min(2, "Add at least one area."),
  position: z.string().optional(),
  skill_level: z.string().optional(),
  game_preference: z.string().optional(),
});

type EssentialsForm = z.infer<typeof essentialsSchema>;
type Role = "player" | "organizer";

const labelClass = "rondo-label text-[color-mix(in_oklch,var(--night-ink)_62%,transparent)]";

export default function EssentialsSetupPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [returnTo, setReturnTo] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<EssentialsForm>({
    resolver: zodResolver(essentialsSchema),
    defaultValues: {
      full_name: "",
      preferred_areas: "",
      position: "",
      skill_level: "",
      game_preference: "",
    },
  });

  useEffect(() => {
    const next = new URLSearchParams(window.location.search).get("next");
    setReturnTo(next);

    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        const current = `/onboarding/profile${next ? `?next=${encodeURIComponent(next)}` : ""}`;
        router.replace(`/login?next=${encodeURIComponent(current)}`);
        return;
      }

      setUserId(data.user.id);
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, role, preferred_areas, position, skill_level, game_preference")
        .eq("id", data.user.id)
        .single();

      const storedRole = sessionStorage.getItem("selectedRole");
      const resolvedRole =
        profile?.role === "player" || profile?.role === "organizer"
          ? profile.role
          : storedRole === "player" || storedRole === "organizer"
            ? storedRole
            : null;

      if (!resolvedRole) {
        router.replace(`/onboarding/role${next ? `?next=${encodeURIComponent(next)}` : ""}`);
        return;
      }

      setRole(resolvedRole);
      reset({
        full_name: profile?.full_name ?? data.user.user_metadata?.full_name ?? "",
        preferred_areas: profile?.preferred_areas ?? "",
        position: profile?.position ?? "",
        skill_level: profile?.skill_level ?? "",
        game_preference: profile?.game_preference ?? "",
      });
    });
  }, [reset, router]);

  async function onSubmit(values: EssentialsForm) {
    if (!userId || !role) return;
    setPageError(null);

    if (role === "player" && !values.position) {
      setError("position", { message: "Choose where you usually play." });
      return;
    }
    if (role === "player" && !values.skill_level) {
      setError("skill_level", { message: "Choose your current level." });
      return;
    }
    if (role === "organizer" && !values.game_preference) {
      setError("game_preference", { message: "Choose the games you usually run." });
      return;
    }

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        full_name: values.full_name.trim(),
        preferred_areas: values.preferred_areas.trim(),
        role,
        ...(role === "player"
          ? {
              position: values.position,
              skill_level: values.skill_level,
            }
          : {
              game_preference: values.game_preference,
            }),
      })
      .eq("id", userId);

    if (updateError) {
      setPageError("We could not save your setup. Try again.");
      return;
    }

    sessionStorage.removeItem("selectedRole");
    router.replace(getPostOnboardingDestination(returnTo, role));
    router.refresh();
  }

  const isOrganizer = role === "organizer";
  const background = isOrganizer ? "/feed/hero-night-court.png" : "/onboarding/player-action.jpg";

  return (
    <main className="relative mx-auto min-h-[100dvh] w-full max-w-md overflow-hidden bg-[var(--bg-page)] rondo-phone-frame">
      <Image
        src={background}
        alt=""
        fill
        priority
        sizes="(max-width: 480px) 100vw, 430px"
        quality={75}
        className="object-cover"
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.42)_0%,rgba(0,0,0,0.76)_32%,rgba(8,9,7,0.98)_69%)]" />

      <div className="relative flex min-h-[100dvh] flex-col px-5 py-6">
        <OnboardingHeader />

        <header className="pb-6 pt-10">
          <p className="mb-2 font-body text-[10px] font-black uppercase tracking-[0.2em] text-rondo-accent">
            2 of 2
          </p>
          <h1 className="rondo-hero-title max-w-[350px] text-[2.8rem] leading-[0.92] text-[var(--night-ink)]">
            {isOrganizer ? "Set up your matchday" : "Make games fit you"}
          </h1>
          <p className="mt-3 max-w-[320px] font-body text-sm leading-relaxed text-[color-mix(in_oklch,var(--night-ink)_66%,transparent)]">
            {isOrganizer
              ? "Players will see these details when they find your games."
              : "Three quick details make the feed more useful from your first visit."}
          </p>
        </header>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mt-auto rounded-3xl border border-[color-mix(in_oklch,var(--night-ink)_14%,transparent)] bg-[color-mix(in_oklch,var(--bg-night)_76%,transparent)] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl"
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="full_name" className={labelClass}>
                {isOrganizer ? "Organizer name" : "Your name"}
              </label>
              <input
                id="full_name"
                {...register("full_name")}
                autoComplete="name"
                className={rondoFieldClass}
              />
              {errors.full_name && (
                <p className="rondo-meta text-red-400">{errors.full_name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="preferred_areas" className={labelClass}>
                {isOrganizer ? "Where you host" : "Where you want to play"}
              </label>
              <input
                id="preferred_areas"
                {...register("preferred_areas")}
                placeholder="BGC, Makati, Ortigas"
                className={rondoFieldClass}
              />
              {errors.preferred_areas && (
                <p className="rondo-meta text-red-400">{errors.preferred_areas.message}</p>
              )}
            </div>

            {isOrganizer ? (
              <div className="space-y-2">
                <label htmlFor="game_preference" className={labelClass}>
                  Games you usually run
                </label>
                <select id="game_preference" {...register("game_preference")} className={rondoFieldClass}>
                  <option value="">Choose one</option>
                  <option value="football">Football</option>
                  <option value="futsal">Futsal</option>
                  <option value="both">Football and futsal</option>
                </select>
                {errors.game_preference && (
                  <p className="rondo-meta text-red-400">{errors.game_preference.message}</p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label htmlFor="position" className={labelClass}>
                    Position
                  </label>
                  <select id="position" {...register("position")} className={rondoFieldClass}>
                    <option value="">Choose</option>
                    <option value="goalkeeper">Goalkeeper</option>
                    <option value="defender">Defender</option>
                    <option value="midfielder">Midfielder</option>
                    <option value="forward">Forward</option>
                    <option value="any">Anywhere</option>
                  </select>
                  {errors.position && <p className="rondo-meta text-red-400">{errors.position.message}</p>}
                </div>
                <div className="space-y-2">
                  <label htmlFor="skill_level" className={labelClass}>
                    Level
                  </label>
                  <select id="skill_level" {...register("skill_level")} className={rondoFieldClass}>
                    <option value="">Choose</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                    <option value="pro">Pro</option>
                  </select>
                  {errors.skill_level && (
                    <p className="rondo-meta text-red-400">{errors.skill_level.message}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {pageError && (
            <p className="mt-4 text-center font-body text-sm text-red-400" role="alert">
              {pageError}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !role}
            className="rondo-btn rondo-btn-primary mt-5 disabled:opacity-45"
          >
            {isSubmitting ? "Saving setup..." : isOrganizer ? "Open organizer home" : "Find a game"}
          </button>
        </form>
      </div>
    </main>
  );
}
