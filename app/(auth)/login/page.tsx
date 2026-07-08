"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Phone } from "lucide-react";
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
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [nextParam, setNextParam] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user || data.user.is_anonymous) return;
      const next = safeNext(new URLSearchParams(window.location.search).get("next"));
      if (next) {
        router.replace(next);
        return;
      }
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
    if (!isLikelyPhoneNumber(normalizedPhone)) {
      setError("Enter a valid phone number with country code.");
      return;
    }

    setSending(true);
    const supabase = createClient();
    const { error: otpError } = await supabase.auth.signInWithOtp({
      phone: normalizedPhone,
    });

    if (otpError) {
      const fallback = await fetch("/api/auth/phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: normalizedPhone }),
      });
      const fallbackJson = await fallback.json().catch(() => ({}));
      if (!fallback.ok || !fallbackJson.email || !fallbackJson.password) {
        setSending(false);
        setError(fallbackJson.error ?? otpError.message);
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: fallbackJson.email as string,
        password: fallbackJson.password as string,
      });
      setSending(false);
      if (signInError) {
        setError(signInError.message);
        return;
      }

      const next = safeNext(new URLSearchParams(window.location.search).get("next"));
      router.push(next ?? "/feed");
      router.refresh();
      return;
    }

    setSending(false);
    const next = safeNext(new URLSearchParams(window.location.search).get("next"));
    const params = new URLSearchParams({ phone: normalizedPhone });
    if (next) params.set("next", next);
    router.push(`/otp?${params.toString()}`);
  }

  return (
    <>
      <div className="pt-2 mb-10">
        <Image
          src="/rondo-logo.png"
          alt="RONDO"
          width={40}
          height={40}
          style={{ width: "auto", height: "auto" }}
          priority
        />
      </div>

      <h1 className="rondo-hero-title text-4xl mb-2">Log in</h1>
      <p className="font-body text-white/50 text-sm mb-8">
        Enter your phone number. We will send a one-time code.
      </p>

      <form onSubmit={sendOtp} className="space-y-5">
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

        <RondoButton type="submit" variant="primary" disabled={sending} className="mt-2">
          {sending ? "Sending code..." : "Send OTP"}
        </RondoButton>
      </form>

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
