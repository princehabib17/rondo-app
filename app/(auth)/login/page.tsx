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

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginForm) {
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/feed");
    router.refresh();
  }

  async function handleGoogleLogin() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  async function handleFacebookLogin() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "facebook",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <div className="space-y-6">
      {/* Logo */}
      <div className="flex justify-center">
        <div className="w-16 h-16 rounded-full border-2 border-rondo-yellow flex items-center justify-center">
          <span className="text-rondo-yellow font-bold text-xl tracking-widest">R</span>
        </div>
      </div>

      <h1 className="text-white font-bold text-2xl tracking-widest text-center uppercase">Login</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1">
          <Label className="text-muted-foreground text-xs uppercase tracking-wider">Email</Label>
          <Input
            {...register("email")}
            type="email"
            placeholder="your@email.com"
            className="bg-secondary border-border text-white placeholder:text-muted-foreground"
          />
          {errors.email && <p className="text-destructive text-xs">{errors.email.message}</p>}
        </div>

        <div className="space-y-1">
          <Label className="text-muted-foreground text-xs uppercase tracking-wider">Password</Label>
          <div className="relative">
            <Input
              {...register("password")}
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              className="bg-secondary border-border text-white placeholder:text-muted-foreground pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <p className="text-destructive text-xs">{errors.password.message}</p>}
        </div>

        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-muted-foreground text-xs hover:text-rondo-yellow">
            Forgot Password?
          </Link>
        </div>

        {error && <p className="text-destructive text-sm text-center">{error}</p>}

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-rondo-yellow text-rondo-black font-bold uppercase tracking-wider hover:brightness-90"
        >
          {isSubmitting ? "Logging in..." : "Log In"}
        </Button>
      </form>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-border" />
        <span className="text-muted-foreground text-xs">Or login using</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <div className="flex justify-center gap-4">
        <button
          onClick={handleGoogleLogin}
          className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-white hover:border-rondo-yellow transition font-bold text-sm"
        >
          G
        </button>
        <button
          onClick={handleFacebookLogin}
          className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-white hover:border-rondo-yellow transition font-bold text-sm"
        >
          f
        </button>
      </div>

      <p className="text-center text-muted-foreground text-sm">
        New to Rondo?{" "}
        <Link href="/signup" className="text-rondo-yellow hover:underline">
          Create New Account
        </Link>
      </p>
    </div>
  );
}
