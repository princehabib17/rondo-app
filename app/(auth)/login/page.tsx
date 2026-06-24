"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Phone } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { GuestScoutLinks } from "@/components/auth/GuestScoutLinks";
import { SocialLoginButtons } from "@/components/auth/SocialLoginButtons";
import { RondoButton, rondoFieldClass } from "@/components/rondo/primitives";
import { isLikelyPhoneNumber, normalizePhoneNumber } from "@/lib/auth/phone";

function safeNext(raw: string | null): string | null {
  if (!raw) return null;
  if (!raw.startsWith("/") || raw.startsWith("//")) return null;
  if (raw === "/login" || raw === "/signup") return null;
  return raw;
}

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"phone" | "email">("email");

  // Phone OTP state
  const [phone, setPhone] = useState("");

  // Email state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [nextParam, setNextParam] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user || data.user.is_anonymous) return;
      const next = safeNext(new URLSearchParams(window.location.search).get("next"));
      if (next) { router.replace(next); return; }
      supabase.from("profiles").select("role").eq("id", data.user.id).single()
        .then(({ data: profile }) => {
          router.replace(profile?.role ? "/feed" : "/onboarding/slides");
        });
    });
    setNextParam(new URLSearchParams(window.location.search).get("next"));
  }, [router]);

  function redirectAfterLogin() {
    const next = safeNext(new URLSearchParams(window.location.search).get("next"));
    if (next) { router.push(next); return; }
    const supabase = createClient();
    supabase.from("profiles").select("role").then(({ data }) => {
      router.push(data?.[0]?.role ? "/feed" : "/onboarding/slides");
    });
  }

  async function handlePhoneOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const normalizedPhone = normalizePhoneNumber(phone);
    if (!isLikelyPhoneNumber(normalizedPhone)) {
      setError("Enter a valid phone number with country code.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error: otpError } = await supabase.auth.signInWithOtp({ phone: normalizedPhone });
    setLoading(false);
    if (otpError) { setError(otpError.message); return; }
    const next = safeNext(new URLSearchParams(window.location.search).get("next"));
    const params = new URLSearchParams({ phone: normalizedPhone });
    if (next) params.set("next", next);
    router.push(`/otp?${params.toString()}`);
  }

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.trim()) { setError("Enter your email."); return; }
    if (!password) { setError("Enter your password."); return; }
    setLoading(true);
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (signInError) {
      setError(signInError.message === "Invalid login credentials"
        ? "Incorrect email or password."
        : signInError.message);
      return;
    }
    redirectAfterLogin();
  }

  return (
    <>
      <div className="pt-2 mb-10">
        <Image src="/rondo-logo.png" alt="RONDO" width={40} height={40} style={{ width: "auto", height: "auto" }} priority />
      </div>

      <h1 className="rondo-hero-title text-4xl mb-2">Log in</h1>
      <p className="font-body text-white/50 text-sm mb-6">Welcome back.</p>

      {/* Tab switcher */}
      <div className="flex rounded-xl border border-white/10 p-1 mb-6 bg-white/[0.03]">
        <button
          type="button"
          onClick={() => { setTab("email"); setError(null); }}
          className={`flex-1 rounded-lg py-2 text-xs font-black uppercase tracking-wider transition-colors ${
            tab === "email" ? "bg-rondo-accent text-black" : "text-white/45 hover:text-white/70"
          }`}
        >
          Email
        </button>
        <button
          type="button"
          onClick={() => { setTab("phone"); setError(null); }}
          className={`flex-1 rounded-lg py-2 text-xs font-black uppercase tracking-wider transition-colors ${
            tab === "phone" ? "bg-rondo-accent text-black" : "text-white/45 hover:text-white/70"
          }`}
        >
          Phone OTP
        </button>
      </div>

      {tab === "email" ? (
        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="font-body text-white/70 text-xs uppercase tracking-wider">Email</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35 text-sm font-medium select-none">@</span>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={`${rondoFieldClass} pl-11`}
              />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="font-body text-white/70 text-xs uppercase tracking-wider">Password</label>
              <Link href="/forgot-password" className="text-xs text-rondo-accent hover:underline">Forgot?</Link>
            </div>
            <div className="relative">
              <Lock size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`${rondoFieldClass} pl-11 pr-11`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/35 hover:text-white/70"
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>
          {error && <p className="text-red-400 text-sm text-center" role="alert">{error}</p>}
          <RondoButton type="submit" variant="primary" disabled={loading} className="mt-2">
            {loading ? "Logging in..." : "Log in"}
          </RondoButton>
        </form>
      ) : (
        <form onSubmit={handlePhoneOtp} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="phone" className="font-body text-white/70 text-xs uppercase tracking-wider">Phone number</label>
            <div className="relative">
              <Phone size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35" />
              <input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="+63 917 123 4567"
                className={`${rondoFieldClass} pl-11`}
              />
            </div>
          </div>
          {error && <p className="text-red-400 text-sm text-center" role="alert">{error}</p>}
          <RondoButton type="submit" variant="primary" disabled={loading} className="mt-2">
            {loading ? "Sending code..." : "Send OTP"}
          </RondoButton>
        </form>
      )}

      <p className="text-center text-white/55 text-sm mt-8">
        First time here?{" "}
        <Link
          href={`/signup${nextParam ? `?next=${encodeURIComponent(nextParam)}` : ""}`}
          className="text-rondo-accent font-semibold hover:underline"
        >
          Create account
        </Link>
      </p>
      <GuestScoutLinks />

      <div className="mt-10">
        <SocialLoginButtons />
      </div>
    </>
  );
}
