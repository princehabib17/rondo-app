"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Phone, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getSafeRedirectPath } from "@/lib/auth/safe-redirect";
import { ContinueAsGuestLink } from "@/components/auth/ContinueAsGuestLink";
import { SocialLoginButtons } from "@/components/auth/SocialLoginButtons";
import { RondoButton, rondoFieldClass } from "@/components/rondo/primitives";
import { formatAuthError } from "@/lib/auth/format-auth-error";
import { isLikelyPhoneNumber, normalizePhoneNumber } from "@/lib/auth/phone";
import { isGuestUser } from "@/lib/auth/is-guest";

type SignupMode = "phone" | "email";

function safeSignupNext(raw: string | null): string {
  const next = getSafeRedirectPath(raw, "/onboarding/slides");
  return next === "/login" || next === "/signup" ? "/onboarding/slides" : next;
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default function SignupPage() {
  const router = useRouter();
  const [mode, setMode] = useState<SignupMode>("phone");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [nextParam, setNextParam] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user || isGuestUser(data.user)) return;
      supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single()
        .then(({ data: profile }) => {
          router.replace(profile?.role ? "/feed" : "/onboarding/slides");
        });
    });
    setNextParam(new URLSearchParams(window.location.search).get("next"));
  }, [router]);

  async function finishSignup(next: string) {
    router.replace(next === "/onboarding/slides" ? "/onboarding/slides" : next);
    router.refresh();
  }

  async function signupWithEmail() {
    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (trimmedName.length < 2) {
      setError("Enter your name.");
      return;
    }
    if (!isValidEmail(trimmedEmail)) {
      setError("Enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setSending(true);
    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
      options: {
        data: { full_name: trimmedName },
      },
    });

    if (!signUpError && data.session) {
      setSending(false);
      await finishSignup(safeSignupNext(new URLSearchParams(window.location.search).get("next")));
      return;
    }

    // Auto-confirm via service role when client signup needs email verification
    // or when signUp is blocked for existing-session edge cases.
    const fallback = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: trimmedEmail,
        password,
        fullName: trimmedName,
      }),
    });
    const fallbackJson = await fallback.json().catch(() => ({}));

    if (fallback.ok) {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });
      setSending(false);
      if (signInError) {
        setError(formatAuthError(signInError.message));
        return;
      }
      await finishSignup(safeSignupNext(new URLSearchParams(window.location.search).get("next")));
      return;
    }

    // Client signup created the user but email confirmation is required
    if (!signUpError && data.user && !data.session) {
      setSending(false);
      setInfo("Account created. Check your email to confirm, then log in.");
      return;
    }

    setSending(false);
    const message =
      (fallbackJson.error as string | undefined) ??
      signUpError?.message ??
      "Could not create account.";
    setError(formatAuthError(message));
  }

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (mode === "email") {
      await signupWithEmail();
      return;
    }

    const normalizedPhone = normalizePhoneNumber(phone);
    if (fullName.trim().length < 2) {
      setError("Enter your name.");
      return;
    }
    if (!isLikelyPhoneNumber(normalizedPhone)) {
      setError("Enter a valid phone number with country code.");
      return;
    }

    setSending(true);
    const supabase = createClient();
    const { error: otpError } = await supabase.auth.signInWithOtp({
      phone: normalizedPhone,
      options: {
        data: { full_name: fullName.trim(), phone: normalizedPhone },
      },
    });

    if (otpError) {
      const fallback = await fetch("/api/auth/phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: normalizedPhone, fullName: fullName.trim() }),
      });
      const fallbackJson = await fallback.json().catch(() => ({}));
      if (!fallback.ok || !fallbackJson.email || !fallbackJson.password) {
        setSending(false);
        setError(formatAuthError((fallbackJson.error as string | undefined) ?? otpError.message));
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: fallbackJson.email as string,
        password: fallbackJson.password as string,
      });
      setSending(false);
      if (signInError) {
        setError(formatAuthError(signInError.message));
        return;
      }

      const next = safeSignupNext(new URLSearchParams(window.location.search).get("next"));
      router.replace(next === "/onboarding/slides" ? "/feed" : next);
      router.refresh();
      return;
    }

    setSending(false);
    const next = safeSignupNext(new URLSearchParams(window.location.search).get("next"));
    const params = new URLSearchParams({ phone: normalizedPhone, next });
    router.push(`/otp?${params.toString()}`);
  }

  return (
    <>
      <div className="pt-2 mb-8">
        <Image
          src="/rondo-logo.png"
          alt="RONDO"
          width={40}
          height={40}
          className="object-contain"
          style={{ width: "auto", height: "auto" }}
        />
      </div>

      <h1 className="rondo-hero-title text-4xl mb-2">Join Rondo</h1>
      <p className="font-body text-[var(--ink-low)] text-sm mb-8">
        {mode === "phone"
          ? "Create your account with your phone number. No password."
          : "Optional: create an account with email and password."}
      </p>

      <div className="grid grid-cols-2 gap-2 mb-6">
        <button
          type="button"
          onClick={() => {
            setMode("phone");
            setError(null);
            setInfo(null);
          }}
          className={`rounded-[var(--r-sm)] py-2 text-xs font-semibold uppercase tracking-wider ${
            mode === "phone" ? "bg-[var(--gold)] text-[var(--gold-ink)]" : "bg-[var(--bg-inset)] text-[var(--ink-mid)]"
          }`}
        >
          Phone
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("email");
            setError(null);
            setInfo(null);
          }}
          className={`rounded-[var(--r-sm)] py-2 text-xs font-semibold uppercase tracking-wider ${
            mode === "email" ? "bg-[var(--gold)] text-[var(--gold-ink)]" : "bg-[var(--bg-inset)] text-[var(--ink-mid)]"
          }`}
        >
          Email
        </button>
      </div>

      <form onSubmit={sendOtp} className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="fullName" className="font-body text-[var(--ink-mid)] text-xs uppercase tracking-wider">
            Full name
          </label>
          <div className="relative">
            <UserRound size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--ink-low)]" />
            <input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Juan dela Cruz"
              autoComplete="name"
              className={`${rondoFieldClass} pl-11`}
            />
          </div>
        </div>

        {mode === "phone" ? (
          <div className="space-y-2">
            <label htmlFor="phone" className="font-body text-[var(--ink-mid)] text-xs uppercase tracking-wider">
              Phone number
            </label>
            <div className="relative">
              <Phone size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--ink-low)]" />
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
        ) : (
          <>
            <div className="space-y-2">
              <label htmlFor="email" className="font-body text-[var(--ink-mid)] text-xs uppercase tracking-wider">
                Email
              </label>
              <input
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                autoComplete="email"
                placeholder="you@email.com"
                className={rondoFieldClass}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="font-body text-[var(--ink-mid)] text-xs uppercase tracking-wider">
                Password
              </label>
              <input
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                autoComplete="new-password"
                placeholder="At least 8 characters"
                className={rondoFieldClass}
              />
            </div>
          </>
        )}

        {error && (
          <p className="text-[var(--live)] text-sm text-center" role="alert">
            {error}
          </p>
        )}
        {info && (
          <p className="text-[var(--ok)] text-sm text-center" role="status">
            {info}{" "}
            <Link href="/login" className="text-[var(--gold)] font-semibold hover:underline">
              Log in
            </Link>
          </p>
        )}

        <RondoButton type="submit" variant="secondary" disabled={sending} className="mt-2">
          {sending
            ? mode === "phone"
              ? "Sending code..."
              : "Creating account..."
            : mode === "phone"
              ? "Get OTP"
              : "Create account"}
        </RondoButton>
      </form>

      <p className="text-center text-[var(--ink-mid)] text-sm mt-8">
        Already have an account?{" "}
        <Link
          href={`/login${nextParam ? `?next=${encodeURIComponent(nextParam)}` : ""}`}
          className="text-[var(--gold)] font-semibold hover:underline"
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
