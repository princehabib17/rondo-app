"use client";
export const dynamic = "force-dynamic";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Apple, Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ContinueAsGuest } from "@/components/auth/ContinueAsGuest";
import { RondoMark } from "@/components/auth/RondoMark";

const signupSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});
type SignupForm = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
  });

  async function onSubmit(data: SignupForm) {
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: { full_name: data.fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setError(error.message);
      return;
    }
    router.push(`/otp?email=${encodeURIComponent(data.email)}`);
  }

  async function handleGoogleSignup() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  async function handleFacebookSignup() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "facebook",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <div className="flex min-h-[calc(100dvh-6rem)] flex-col">
      <div className="pt-2">
        <RondoMark className="origin-top-left scale-[0.64] items-start" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-auto space-y-6 pb-10">
        <h1 className="font-black italic text-6xl leading-none tracking-[-0.06em] text-white">
          CREATE
          <br />
          ACCOUNT
        </h1>

        <div className="space-y-3">
          <label className="text-xl font-semibold text-white">Full Name</label>
          <input
            {...register("fullName")}
            className="h-14 w-full rounded-2xl border-2 border-white/90 bg-transparent px-5 text-lg text-white outline-none transition focus:border-[#fff98a]"
          />
          {errors.fullName && <p className="text-sm font-medium text-red-400">{errors.fullName.message}</p>}
        </div>

        <div className="space-y-3">
          <label className="text-xl font-semibold text-white">Email Address</label>
          <input
            {...register("email")}
            type="email"
            className="h-14 w-full rounded-2xl border-2 border-white/90 bg-transparent px-5 text-lg text-white outline-none transition focus:border-[#fff98a]"
          />
          {errors.email && <p className="text-sm font-medium text-red-400">{errors.email.message}</p>}
        </div>

        <div className="space-y-3">
          <label className="text-xl font-semibold text-white">Password</label>
          <div className="relative">
            <input
              {...register("password")}
              type={showPassword ? "text" : "password"}
              className="h-14 w-full rounded-2xl border-2 border-white/90 bg-transparent px-5 pr-12 text-lg text-white outline-none transition focus:border-[#fff98a]"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 transition hover:text-white"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {errors.password && <p className="text-sm font-medium text-red-400">{errors.password.message}</p>}
        </div>

        <div className="space-y-3">
          <label className="text-xl font-semibold text-white">Confirm Password</label>
          <input
            {...register("confirmPassword")}
            type="password"
            className="h-14 w-full rounded-2xl border-2 border-white/90 bg-transparent px-5 text-lg text-white outline-none transition focus:border-[#fff98a]"
          />
          {errors.confirmPassword && <p className="text-sm font-medium text-red-400">{errors.confirmPassword.message}</p>}
        </div>

        {error && <p className="rounded-lg bg-red-500/10 p-3 text-center text-sm font-medium text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="h-16 w-full rounded-xl bg-[#fff98a] text-xl font-black uppercase tracking-tight text-black transition hover:brightness-95 disabled:opacity-50"
        >
          {isSubmitting ? "Creating..." : "Create Account"}
        </button>

        <p className="pt-3 text-center text-xl text-white">
          Already have an account?{" "}
          <Link href="/login" className="font-bold text-[#fff98a]">
            Log In
          </Link>
        </p>

        <p className="pt-4 text-center text-xl text-white">Or Sign Up Using</p>

        <div className="flex justify-center gap-8 pt-5">
          <button type="button" className="flex h-16 w-16 items-center justify-center rounded-md bg-white text-black transition hover:scale-105" aria-label="Continue with Apple">
            <Apple size={38} fill="currentColor" />
          </button>
          <button type="button" onClick={handleGoogleSignup} className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-4xl font-black text-black transition hover:scale-105" aria-label="Continue with Google">
            G
          </button>
          <button type="button" onClick={handleFacebookSignup} className="flex h-16 w-16 items-center justify-center rounded-full bg-[#4163a8] pb-1 text-5xl font-black text-white transition hover:scale-105" aria-label="Continue with Facebook">
            f
          </button>
        </div>

        <ContinueAsGuest className="w-full pt-3 text-center text-lg font-black uppercase tracking-tight text-white transition hover:text-[#fff98a]" />
      </form>
    </div>
  );
}
