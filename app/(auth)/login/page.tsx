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

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) router.replace("/feed");
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

  const inputClass =
    "w-full bg-black/60 border border-white/20 text-white px-4 py-3.5 text-sm focus:outline-none focus:border-rondo-accent focus:bg-black/80 rounded-xl transition-colors";

  return (
    <>
      <div className="pt-2 mb-10">
        <Image src="/rondo-logo.png" alt="RONDO" width={48} height={48} priority />
      </div>

      <h1 className="font-heading text-white font-black italic text-5xl tracking-tight mb-10">LOGIN</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-2">
          <label className="font-heading text-white text-sm">Email</label>
          <input
            {...register("email")}
            type="email"
            autoComplete="email"
            placeholder=""
            className={`${inputClass} font-body`}
          />
          {errors.email && <p className="text-red-400 text-xs font-body">{errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="font-heading text-white text-sm">Password</label>
          <input
            {...register("password")}
            type="password"
            autoComplete="current-password"
            className={`${inputClass} font-body`}
          />
          {errors.password && <p className="text-red-400 text-xs font-body">{errors.password.message}</p>}
        </div>

        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-white text-sm hover:text-rondo-accent">
            Forgot Password?
          </Link>
        </div>

        {error && <p className="text-red-400 text-sm text-center">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-rondo-accent text-black font-heading font-black uppercase tracking-widest text-sm py-4 rounded-xl disabled:opacity-50 active:scale-[0.98] transition-transform"
        >
          {isSubmitting ? "Logging in..." : "Log In"}
        </button>
      </form>

      <p className="text-center text-white text-sm mt-8">
        New to Rondo?{" "}
        <Link href="/signup" className="text-rondo-accent font-semibold">
          Create New Account
        </Link>
      </p>

      <div className="mt-10">
        <SocialLoginButtons />
      </div>
    </>
  );
}
