"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Phone, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getSafeRedirectPath } from "@/lib/auth/safe-redirect";
import { ContinueAsGuestLink } from "@/components/auth/ContinueAsGuestLink";
import { SocialLoginButtons } from "@/components/auth/SocialLoginButtons";
import { RondoButton, rondoFieldClass } from "@/components/rondo/primitives";
import { isLikelyPhoneNumber, normalizePhoneNumber } from "@/lib/auth/phone";

function safeSignupNext(raw: string | null): string {
  const next = getSafeRedirectPath(raw, "/onboarding/slides");
  return next === "/login" || next === "/signup" ? "/onboarding/slides" : next;
}

export default function SignupPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"email" | "phone">("email");

  // Shared
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [nextParam, setNextParam] = useState<string | null>(null);

  // Email state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // Phone state
  const [phone, setPhone] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user || data.user.is_anonymous) return;
      supabase.from("profiles").select("role").eq("id", data.user.id).single()
        .then(({ data: profile }) => {
          router.replace(profile?.role ? "/feed" : "/onboarding/slides");
        });
    });
    setNextParam(new URLSearchParams(window.location.search).get("next"));
  }, [router]);

  async function handleEmailSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (fullName.trim().length < 2) { setError("Enter your full name."); return; }
    if (!email.trim()) { setError("Enter your email."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setLoading(true);
    const supabase = createClient();
    const { error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: fullName.trim() } },
    });
    setLoading(false);
    if (signUpError) {
      if (signUpError.message.toLowerCase().includes("already registered")) {
        setError("An account with this email already exists. Log in instead.");
      } else {
        setError(signUpError.message);
      }
      return;
    }
    // If Supabase auto-confirms (dev mode), sign them in immediately
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData.session) {
      router.push(safeSignupNext(nextParam));
    } else {
      setEmailSent(true);
    }
  }

  async function handlePhoneOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (fullName.trim().length < 2) { setError("Enter your full name."); return; }
    const normalizedPhone = normalizePhoneNumber(phone);
    if (!isLikelyPhoneNumber(normalizedPhone)) {
      setError("Enter a valid phone number with country code.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error: otpError } = await supabase.auth.signInWithOtp({
      phone: normalizedPhone,
      options: { data: { full_name: fullName.trim(), phone: normalizedPhone } },
    });
    setLoading(false);
    if (otpError) { setError(otpError.message); return; }
    const next = safeSignupNext(nextParam);
    router.push(`/otp?${new URLSearchParams({ phone: normalizedPhone, next }).toString()}`);
  }

  if (emailSent) {
    return (
      <>
        <div className="pt-2 mb-10">
          <Image src="/rondo-logo.png" alt="RONDO" width={40} height={40} style={{ width: "auto", height: "auto" }} priority />
        </div>
        <h1 className="rondo-hero-title text-4xl mb-4">Check your email</h1>
        <p className="font-body text-white/55 text-sm leading-relaxed">
          We sent a confirmation link to <span className="text-white font-semibold">{email}</span>.
          Click it to activate your account, then come back and log in.
        </p>
        <div className="mt-8">
          <Link href="/login" className="block">
            <RondoButton type="button" variant="primary">Go to login</RondoButton>
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="pt-2 mb-8">
        <Image src="/rondo-logo.png" alt="RONDO" width={40} height={40} className="object-contain" style={{ width: "auto", height: "auto" }} />
      </div>

      <h1 className="rondo-hero-title text-4xl mb-2">Join Rondo</h1>
      <p className="font-body text-white/50 text-sm mb-6">Create your account.</p>

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

      {/* Full name — shared */}
      <div className="space-y-2 mb-4">
        <label htmlFor="fullName" className="font-body text-white/70 text-xs uppercase tracking-wider">Full name</label>
        <div className="relative">
          <UserRound size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35" />
          <input
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Juan dela Cruz"
            className={`${rondoFieldClass} pl-11`}
          />
        </div>
      </div>

      {tab === "email" ? (
        <form onSubmit={handleEmailSignup} className="space-y-4">
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
            <label htmlFor="password" className="font-body text-white/70 text-xs uppercase tracking-wider">Password</label>
            <div className="relative">
              <Lock size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
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
          <RondoButton type="submit" variant="secondary" disabled={loading} className="mt-2">
            {loading ? "Creating account..." : "Create account"}
          </RondoButton>
        </form>
      ) : (
        <form onSubmit={handlePhoneOtp} className="space-y-4">
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
          <RondoButton type="submit" variant="secondary" disabled={loading} className="mt-2">
            {loading ? "Sending code..." : "Get OTP"}
          </RondoButton>
        </form>
      )}

      <p className="text-center text-white/55 text-sm mt-8">
        Already have an account?{" "}
        <Link
          href={`/login${nextParam ? `?next=${encodeURIComponent(nextParam)}` : ""}`}
          className="text-rondo-accent font-semibold hover:underline"
        >
          Log in
        </Link>
      </p>
      <ContinueAsGuestLink />

      <div className="mt-8">
        <SocialLoginButtons />
      </div>
    </>
  );
}
