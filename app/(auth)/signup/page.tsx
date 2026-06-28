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

function safeSignupNext(raw: string | null): string {
  const next = getSafeRedirectPath(raw, "/onboarding/slides");
  return next === "/login" || next === "/signup" ? "/onboarding/slides" : next;
}

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [nextParam, setNextParam] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user || data.user.is_anonymous) return;
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
    setSending(false);

    if (otpError) {
      setError(formatAuthError(otpError.message));
      return;
    }

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
      <p className="font-body text-white/50 text-sm mb-8">
        Create your account with your phone number. No password.
      </p>

      <form onSubmit={sendOtp} className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="fullName" className="font-body text-white/70 text-xs uppercase tracking-wider">
            Full name
          </label>
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

        <div className="space-y-2">
          <label htmlFor="phone" className="font-body text-white/70 text-xs uppercase tracking-wider">
            Phone number
          </label>
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

        {error && (
          <p className="text-red-400 text-sm text-center" role="alert">
            {error}
          </p>
        )}

        <RondoButton type="submit" variant="secondary" disabled={sending} className="mt-2">
          {sending ? "Sending code..." : "Get OTP"}
        </RondoButton>
      </form>

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
