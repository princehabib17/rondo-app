"use client";
export const dynamic = "force-dynamic";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
    <div className="space-y-8">
      {/* Logo & Branding */}
      <div className="text-center space-y-3">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-2xl border-2 border-primary flex items-center justify-center bg-primary/5">
            <span className="text-primary font-black text-3xl tracking-widest">R</span>
          </div>
        </div>
        <h1 className="text-3xl font-black tracking-tight text-foreground">CREATE ACCOUNT</h1>
        <p className="text-sm text-muted-foreground">Join the community. Start playing.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Full Name Field */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-foreground/70">Full Name</Label>
          <Input 
            {...register("fullName")} 
            placeholder="Juan dela Cruz" 
            className="h-12 bg-secondary border-border text-foreground placeholder:text-muted-foreground text-base"
          />
          {errors.fullName && <p className="text-destructive text-xs font-medium">{errors.fullName.message}</p>}
        </div>

        {/* Email Field */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-foreground/70">Email Address</Label>
          <Input 
            {...register("email")} 
            type="email" 
            placeholder="you@example.com" 
            className="h-12 bg-secondary border-border text-foreground placeholder:text-muted-foreground text-base"
          />
          {errors.email && <p className="text-destructive text-xs font-medium">{errors.email.message}</p>}
        </div>

        {/* Password Field */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-foreground/70">Password</Label>
          <div className="relative">
            <Input
              {...register("password")}
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              className="h-12 bg-secondary border-border text-foreground placeholder:text-muted-foreground pr-10 text-base"
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)} 
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && <p className="text-destructive text-xs font-medium">{errors.password.message}</p>}
        </div>

        {/* Confirm Password Field */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-foreground/70">Confirm Password</Label>
          <Input 
            {...register("confirmPassword")} 
            type="password" 
            placeholder="••••••••" 
            className="h-12 bg-secondary border-border text-foreground placeholder:text-muted-foreground text-base"
          />
          {errors.confirmPassword && <p className="text-destructive text-xs font-medium">{errors.confirmPassword.message}</p>}
        </div>

        {/* Error Message */}
        {error && <p className="text-destructive text-sm font-medium text-center bg-destructive/10 rounded-lg p-3">{error}</p>}

        {/* Submit Button */}
        <Button 
          type="submit" 
          disabled={isSubmitting} 
          className="w-full h-12 bg-primary text-primary-foreground font-black uppercase tracking-wider text-sm hover:brightness-110 disabled:opacity-50"
        >
          {isSubmitting ? "Creating..." : "Create Account"}
        </Button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs font-semibold text-muted-foreground uppercase">Or Continue With</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Social Login Buttons */}
      <div className="flex gap-3 justify-center">
        <button 
          onClick={handleGoogleSignup} 
          className="w-12 h-12 rounded-lg border-2 border-border flex items-center justify-center text-foreground hover:border-primary hover:bg-primary/5 transition-all font-bold"
          aria-label="Continue with Google"
        >
          G
        </button>
        <button 
          onClick={handleFacebookSignup} 
          className="w-12 h-12 rounded-lg border-2 border-border flex items-center justify-center text-foreground hover:border-primary hover:bg-primary/5 transition-all font-bold"
          aria-label="Continue with Facebook"
        >
          f
        </button>
      </div>

      {/* Login Link */}
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Log In
        </Link>
      </p>
    </div>
  );
}
