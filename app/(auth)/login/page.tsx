"use client";

import { useState } from "react";
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

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

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
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });
    if (signInError) {
      setError(signInError.message);
      return;
    }
    router.push("/feed");
    router.refresh();
  }

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

        <RondoButton type="submit" variant="primary" disabled={isSubmitting} className="mt-2">
          {isSubmitting ? "Logging in…" : "Log in"}
        </RondoButton>
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
