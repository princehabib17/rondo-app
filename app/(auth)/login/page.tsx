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
import { formatAuthError } from "@/lib/auth/format-auth-error";

type LoginMode = "phone" | "email";

function safeNext(raw: string | null): string | null {
  if (!raw) return null;
  if (!raw.startsWith("/") || raw.startsWith("//")) return null;
  if (raw === "/login" || raw === "/signup") return null;
  return raw;
}

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<LoginMode>("phone");
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

    if (mode === "email") {
      if (!email.trim() || password.length < 8) {
        setError("Enter your email and password.");
        return;
      }

      setSending(true);
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      setSending(false);

      if (signInError) {
        setError(formatAuthError(signInError.message));
        return;
      }

      const next = safeNext(new URLSearchParams(window.location.search).get("next"));
      if (next) {
        router.replace(next);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", (await supabase.auth.getUser()).data.user?.id ?? "")
        .single();
      router.replace(profile?.role ? "/feed" : "/onboarding/slides");
      return;
    }

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

      const next = safeNext(new URLSearchParams(window.location.search).get("next"));
      router.replace(next ?? "/feed");
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
        Sign in with phone OTP, email, or social.
      </p>

      <div className="grid grid-cols-2 gap-2 mb-6">
        <button
          type="button"
          onClick={() => setMode("phone")}
          className={`rounded-lg py-2 text-xs font-semibold uppercase tracking-wider ${
            mode === "phone" ? "bg-rondo-accent text-black" : "bg-white/5 text-white/60"
          }`}
        >
          Phone
        </button>
        <button
          type="button"
          onClick={() => setMode("email")}
          className={`rounded-lg py-2 text-xs font-semibold uppercase tracking-wider ${
            mode === "email" ? "bg-rondo-accent text-black" : "bg-white/5 text-white/60"
          }`}
        >
          Email
        </button>
      </div>

      <form onSubmit={sendOtp} className="space-y-5">
        {mode === "phone" ? (
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
        ) : (
          <>
            <div className="space-y-2">
              <label htmlFor="email" className="font-body text-white/70 text-xs uppercase tracking-wider">
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
              <label htmlFor="password" className="font-body text-white/70 text-xs uppercase tracking-wider">
                Password
              </label>
              <input
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                autoComplete="current-password"
                placeholder="Your password"
                className={rondoFieldClass}
              />
            </div>
          </>
        )}

        {error && (
          <p className="text-red-400 text-sm text-center" role="alert">
            {error}
          </p>
        )}

        <RondoButton type="submit" variant="primary" disabled={sending} className="mt-2">
          {sending ? "Signing in..." : mode === "phone" ? "Send OTP" : "Log in"}
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
