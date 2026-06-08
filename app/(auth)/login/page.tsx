"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { SocialLoginButtons } from "@/components/auth/SocialLoginButtons";
import { RondoButton } from "@/components/rondo/primitives";
import { rondoFieldClass } from "@/components/rondo/primitives";

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

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user && !data.user.is_anonymous) {
        const next = safeNext(new URLSearchParams(window.location.search).get("next"));
        router.replace(next ?? "/feed");
      }
    });
  }, [router]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

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

  const inputClass =
    "w-full bg-black/60 border border-white/20 text-white px-4 py-3.5 text-sm focus:outline-none focus:border-rondo-accent focus:bg-black/80 rounded-xl transition-colors";

  return (
    <>
      <div className="pt-2 mb-8">
        <Image src="/rondo-logo.png" alt="RONDO" width={40} height={40} priority />
      </div>

      <h1 className="font-heading text-white font-black italic text-4xl uppercase tracking-tight mb-2">
        Log in
      </h1>
      <p className="font-body text-white/50 text-sm mb-8">Welcome back to the pitch.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-2">
          <label className="font-body text-white/70 text-xs uppercase tracking-wider">Email</label>
          <input
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
          <label className="font-body text-white/70 text-xs uppercase tracking-wider">Password</label>
          <input
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

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-rondo-accent text-black font-heading font-black uppercase tracking-widest text-sm py-4 rounded-xl disabled:opacity-50 active:scale-[0.98] transition-transform"
        >
          {isSubmitting ? "Logging in..." : "Log In"}
        </button>
      </form>

      <p className="text-center text-white/55 text-sm mt-8">
        New to Rondo?{" "}
        <Link href="/signup" className="text-rondo-accent font-semibold hover:underline">
          Create account
        </Link>
      </p>

      <div className="mt-10">
        <SocialLoginButtons />
      </div>
    </>
  );
}
