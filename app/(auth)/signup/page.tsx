"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Phone, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getOnboardingPath, getRoleHome } from "@/lib/auth/destination";
import { ContinueAsGuestLink } from "@/components/auth/ContinueAsGuestLink";
import { RondoBrand } from "@/components/brand/RondoBrand";
import { SocialLoginButtons } from "@/components/auth/SocialLoginButtons";
import { RondoButton, rondoFieldClass } from "@/components/rondo/primitives";
import { formatAuthError } from "@/lib/auth/format-auth-error";
import { getUserWithTimeout } from "@/lib/auth/get-user-with-timeout";
import { isLikelyPhoneNumber, normalizePhoneNumber } from "@/lib/auth/phone";

function signupDestination(raw: string | null): string {
  return getOnboardingPath(raw);
}

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [nextParam, setNextParam] = useState<string | null>(null);

  useEffect(() => {
    const rawNext = new URLSearchParams(window.location.search).get("next");
    setNextParam(rawNext);
    getUserWithTimeout().then(({ data }) => {
      if (!data.user || data.user.is_anonymous) return;
      const supabase = createClient();
      supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single()
        .then(({ data: profile }) => {
          router.replace(profile?.role ? getRoleHome(profile.role) : signupDestination(rawNext));
        });
    });
  }, [router]);

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
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

      const next = signupDestination(new URLSearchParams(window.location.search).get("next"));
      router.replace(next);
      router.refresh();
      return;
    }

    setSending(false);
    const next = signupDestination(new URLSearchParams(window.location.search).get("next"));
    const params = new URLSearchParams({ phone: normalizedPhone, next });
    router.push(`/otp?${params.toString()}`);
  }

  return (
    <>
      <div className="pt-2 mb-8">
        <RondoBrand kind="wordmark" surface="auto" className="h-9 w-36" fetchPriority="high" />
      </div>

      <h1 className="rondo-hero-title text-4xl mb-2">Join Rondo</h1>
      <p className="font-body text-[var(--ink-low)] text-sm mb-8">
        Create your account with your phone number. No password.
      </p>

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
              className={`${rondoFieldClass} pl-11`}
            />
          </div>
        </div>

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

        {error && (
          <p className="text-[var(--live)] text-sm text-center" role="alert">
            {error}
          </p>
        )}

        <RondoButton type="submit" variant="secondary" disabled={sending} className="mt-2">
          {sending ? "Sending code..." : "Get OTP"}
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
        <SocialLoginButtons onboarding />
      </div>
    </>
  );
}
