"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { SocialLoginButtons } from "@/components/auth/SocialLoginButtons";

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
    const { data: signUpData, error } = await supabase.auth.signUp({
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
    // If Supabase has "Confirm email" disabled, a session is returned immediately
    // and no OTP email is sent — skip the OTP screen.
    if (signUpData.session) {
      router.push("/onboarding/slides");
      router.refresh();
      return;
    }
    router.push(`/otp?email=${encodeURIComponent(data.email)}`);
  }

  const inputClass =
    "w-full bg-black/60 border border-white/20 text-white px-4 py-3.5 text-sm placeholder:text-white/30 focus:outline-none focus:border-rondo-accent focus:bg-black/80 rounded-xl transition-colors";

  return (
    <>
      <div className="pt-2 mb-10">
        <Image src="/rondo-logo.png" alt="RONDO" width={48} height={48} className="object-contain" />
      </div>

      <h1 className="text-white font-black italic text-4xl tracking-tight mb-8">CREATE ACCOUNT</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-2">
          <label className="text-white text-sm font-medium">Full name</label>
          <input {...register("fullName")} placeholder="Juan dela Cruz" className={inputClass} />
          {errors.fullName && <p className="text-destructive text-xs">{errors.fullName.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-white text-sm font-medium">Email</label>
          <input {...register("email")} type="email" placeholder="you@email.com" className={inputClass} />
          {errors.email && <p className="text-destructive text-xs">{errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-white text-sm font-medium">Password</label>
          <div className="relative">
            <input
              {...register("password")}
              type={showPassword ? "text" : "password"}
              className={inputClass}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && <p className="text-destructive text-xs">{errors.password.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-white text-sm font-medium">Confirm password</label>
          <input {...register("confirmPassword")} type="password" className={inputClass} />
          {errors.confirmPassword && (
            <p className="text-destructive text-xs">{errors.confirmPassword.message}</p>
          )}
        </div>

        {error && <p className="text-destructive text-sm text-center">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-rondo-accent text-black font-heading font-black uppercase tracking-widest text-sm py-4 rounded-xl disabled:opacity-50 active:scale-[0.98] transition-all"
        >
          {isSubmitting ? "Creating..." : "Create Account"}
        </button>
      </form>

      <p className="text-center text-white text-sm mt-8">
        Already have an account?{" "}
        <Link href="/login" className="text-rondo-accent font-semibold hover:underline">
          Log In
        </Link>
      </p>

      <div className="mt-8">
        <SocialLoginButtons />
      </div>
    </>
  );
}
