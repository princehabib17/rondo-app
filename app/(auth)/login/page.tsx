"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Phone } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { GuestScoutLinks } from "@/components/auth/GuestScoutLinks";
import { SocialLoginButtons } from "@/components/auth/SocialLoginButtons";
import { RondoBrand } from "@/components/brand/RondoBrand";
import { PasskeySignInButton } from "@/components/auth/PasskeySignInButton";
import { RondoButton, rondoFieldClass } from "@/components/rondo/primitives";
import { isLikelyPhoneNumber, normalizePhoneNumber, PHONE_PLACEHOLDER } from "@/lib/auth/phone";
import { formatAuthError } from "@/lib/auth/format-auth-error";
import { AUTH_TIMEOUT_MS, AUTH_UNREACHABLE_MESSAGE, withAuthTimeout } from "@/lib/auth/auth-timeout";
import { getUserWithTimeout } from "@/lib/auth/get-user-with-timeout";
import {
  getOnboardingPath,
  getPostOnboardingDestination,
} from "@/lib/auth/destination";

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
    getUserWithTimeout().then(({ data }) => {
      if (!data.user || data.user.is_anonymous) return;
      const next = safeNext(new URLSearchParams(window.location.search).get("next"));
      const supabase = createClient();
      supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single()
        .then(({ data: profile }) => {
          router.replace(
            profile?.role
              ? getPostOnboardingDestination(next, profile.role)
              : getOnboardingPath(next)
          );
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
      try {
        const { error: signInError } = await withAuthTimeout(
          supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          })
        );
        setSending(false);

        if (signInError) {
          setError(formatAuthError(signInError.message));
          return;
        }
      } catch (authError) {
        setSending(false);
        setError(
          formatAuthError(authError instanceof Error ? authError.message : AUTH_UNREACHABLE_MESSAGE)
        );
        return;
      }

      const next = safeNext(new URLSearchParams(window.location.search).get("next"));
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", (await supabase.auth.getUser()).data.user?.id ?? "")
        .single();
      router.replace(
        profile?.role
          ? getPostOnboardingDestination(next, profile.role)
          : getOnboardingPath(next)
      );
      return;
    }

    const normalizedPhone = normalizePhoneNumber(phone);
    if (!isLikelyPhoneNumber(normalizedPhone)) {
      setError("Enter a valid phone number with country code.");
      return;
    }

    setSending(true);
    const supabase = createClient();
    let otpError: { message: string } | null = null;
    try {
      const result = await withAuthTimeout(
        supabase.auth.signInWithOtp({
          phone: normalizedPhone,
        })
      );
      otpError = result.error;
    } catch (authError) {
      setSending(false);
      setError(
        formatAuthError(authError instanceof Error ? authError.message : AUTH_UNREACHABLE_MESSAGE)
      );
      return;
    }

    if (otpError) {
      const fallback = await fetch("/api/auth/phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: normalizedPhone }),
        signal: AbortSignal.timeout(AUTH_TIMEOUT_MS),
      }).catch(() => null);
      const fallbackJson = fallback ? await fallback.json().catch(() => ({})) : {};
      if (!fallback?.ok || !fallbackJson.email || !fallbackJson.password) {
        setSending(false);
        setError(formatAuthError((fallbackJson.error as string | undefined) ?? otpError.message));
        return;
      }

      try {
        const { error: signInError } = await withAuthTimeout(
          supabase.auth.signInWithPassword({
            email: fallbackJson.email as string,
            password: fallbackJson.password as string,
          })
        );
        setSending(false);
        if (signInError) {
          setError(formatAuthError(signInError.message));
          return;
        }
      } catch (authError) {
        setSending(false);
        setError(
          formatAuthError(authError instanceof Error ? authError.message : AUTH_UNREACHABLE_MESSAGE)
        );
        return;
      }

      const next = safeNext(new URLSearchParams(window.location.search).get("next"));
      const { data: authData } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", authData.user?.id ?? "")
        .single();
      router.replace(
        profile?.role
          ? getPostOnboardingDestination(next, profile.role)
          : getOnboardingPath(next)
      );
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
        <RondoBrand kind="wordmark" surface="auto" className="h-9 w-36" fetchPriority="high" />
      </div>

      <h1 className="rondo-hero-title text-4xl mb-2">Log in</h1>
      <p className="font-body text-[var(--ink-low)] text-sm mb-8">
        Sign in with passkey, phone OTP, email, or social.
      </p>

      <div className="mb-6">
        <PasskeySignInButton
          disabled={sending}
          onError={setError}
          onSuccess={async (userId) => {
            const next = safeNext(new URLSearchParams(window.location.search).get("next"));
            const supabase = createClient();
            const { data: profile } = await supabase
              .from("profiles")
              .select("role")
              .eq("id", userId)
              .single();
            router.replace(
              profile?.role
                ? getPostOnboardingDestination(next, profile.role)
                : getOnboardingPath(next)
            );
            router.refresh();
          }}
        />
      </div>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center" aria-hidden>
          <div className="w-full border-t border-[var(--stroke)]" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-[var(--bg-page,#0a0a0a)] px-3 text-xs text-[var(--ink-low)]">
            Or continue with
          </span>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-2 rounded-[var(--r-sm)] bg-[var(--bg-inset)] p-1">
        <button
          type="button"
          onClick={() => setMode("phone")}
          className={`rounded-[calc(var(--r-sm)-2px)] py-2 text-sm font-semibold ${
            mode === "phone"
              ? "bg-[var(--bg-surface)] text-[var(--ink-hi)] shadow-[0_1px_0_color-mix(in_oklch,var(--ink-hi)_8%,transparent)]"
              : "text-[var(--ink-mid)]"
          }`}
        >
          Phone
        </button>
        <button
          type="button"
          onClick={() => setMode("email")}
          className={`rounded-[calc(var(--r-sm)-2px)] py-2 text-sm font-semibold ${
            mode === "email"
              ? "bg-[var(--bg-surface)] text-[var(--ink-hi)] shadow-[0_1px_0_color-mix(in_oklch,var(--ink-hi)_8%,transparent)]"
              : "text-[var(--ink-mid)]"
          }`}
        >
          Email
        </button>
      </div>

      <form onSubmit={sendOtp} className="space-y-5">
        {mode === "phone" ? (
        <div className="space-y-2">
          <label htmlFor="phone" className="font-body text-xs text-[var(--ink-mid)]">
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
              placeholder={PHONE_PLACEHOLDER}
              className={`${rondoFieldClass} pl-11`}
            />
          </div>
        </div>
        ) : (
          <>
            <div className="space-y-2">
              <label htmlFor="email" className="font-body text-xs text-[var(--ink-mid)]">
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
              <label htmlFor="password" className="font-body text-xs text-[var(--ink-mid)]">
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
          <p className="text-[var(--live)] text-sm text-center" role="alert">
            {error}
          </p>
        )}

        <RondoButton type="submit" variant="primary" disabled={sending} className="mt-2">
          {sending ? "Signing in..." : mode === "phone" ? "Send code" : "Log in"}
        </RondoButton>
      </form>

      <p className="text-center text-[var(--ink-mid)] text-sm mt-8">
        First time here?{" "}
        <Link
          href={`/signup${nextParam ? `?next=${encodeURIComponent(nextParam)}` : ""}`}
          className="font-semibold text-[var(--ink-hi)] underline decoration-[var(--stroke)] underline-offset-4 hover:decoration-[var(--ink-hi)]"
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
