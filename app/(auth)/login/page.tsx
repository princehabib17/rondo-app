"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { ContinueAsGuestLink } from "@/components/auth/ContinueAsGuestLink";
import { SocialLoginButtons } from "@/components/auth/SocialLoginButtons";
import { RondoButton, rondoFieldClass } from "@/components/rondo/primitives";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
type LoginForm = z.infer<typeof loginSchema>;

function safeNext(raw: string | null): string | null {
  if (!raw) return null;
  if (!raw.startsWith("/") || raw.startsWith("//")) return null;
  if (raw === "/login" || raw === "/signup") return null;
  return raw;
}

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [nextParam, setNextParam] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user || data.user.is_anonymous) return;
      const next = safeNext(new URLSearchParams(window.location.search).get("next"));
      if (next) {
        router.replace(next);
        return;
      }
      supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single()
        .then(({ data: profile }) => {
          router.replace(profile?.role ? "/feed" : "/onboarding/slides");
        });
    });
  }, [router]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    setNextParam(new URLSearchParams(window.location.search).get("next"));
  }, []);

  async function onSubmit(data: LoginForm) {
    setError(null);
    const supabase = createClient();
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });
    if (signInError) {
      setError(signInError.message);
      return;
    }
    const next = safeNext(new URLSearchParams(window.location.search).get("next"));
    if (next) {
      router.push(next);
      router.refresh();
      return;
    }
    const userId = signInData.user?.id;
    if (userId) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();
      router.push(profile?.role ? "/feed" : "/onboarding/slides");
    } else {
      router.push("/feed");
    }
    router.refresh();
  }

  return (
    <>
      <div className="pt-2 mb-10">
        <Image
          src="/rondo-logo.png"
          alt="RONDO"
          width={40}
          height={40}
          style={{ width: "auto", height: "auto" }}
          priority
        />
      </div>

      <h1 className="rondo-hero-title text-4xl mb-2">Log in</h1>
      <p className="font-body text-white/50 text-sm mb-8">Welcome back to the pitch.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="email" className="font-body text-white/70 text-xs uppercase tracking-wider">
            Email
          </label>
          <input
            id="email"
            {...register("email")}
            type="email"
            autoComplete="email"
            className={rondoFieldClass}
          />
          {errors.email && (
            <p className="text-red-400 text-xs font-body">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="font-body text-white/70 text-xs uppercase tracking-wider">
            Password
          </label>
          <input
            id="password"
            {...register("password")}
            type="password"
            autoComplete="current-password"
            className={rondoFieldClass}
          />
          {errors.password && (
            <p className="text-red-400 text-xs font-body">{errors.password.message}</p>
          )}
        </div>

        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-white/60 text-sm hover:text-rondo-accent">
            Forgot password?
          </Link>
        </div>

        {error && (
          <p className="text-red-400 text-sm text-center" role="alert">
            {error}
          </p>
        )}

        <RondoButton type="submit" variant="primary" disabled={isSubmitting} className="mt-2">
          {isSubmitting ? "Logging in..." : "Log in"}
        </RondoButton>
      </form>

      <p className="text-center text-white/55 text-sm mt-8">
        New to Rondo?{" "}
        <Link
          href={`/signup${nextParam ? `?next=${encodeURIComponent(nextParam)}` : ""}`}
          className="text-rondo-accent font-semibold hover:underline"
        >
          Create account
        </Link>
      </p>
      <ContinueAsGuestLink />

      <div className="mt-10">
        <SocialLoginButtons />
      </div>
    </>
  );
}
