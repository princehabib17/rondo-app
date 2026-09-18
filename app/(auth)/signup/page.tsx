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
import { AUTH_UNREACHABLE_MESSAGE, withAuthTimeout } from "@/lib/auth/auth-timeout";
import { getUserWithTimeout } from "@/lib/auth/get-user-with-timeout";
import { isLikelyPhoneNumber, normalizePhoneNumber, PHONE_PLACEHOLDER } from "@/lib/auth/phone";
import { signupWithEmail } from "@/lib/auth/signup-with-email";
import { normalizeUsername, usernameValidationError } from "@/lib/auth/username";

type SignupMode = "phone" | "email";

function signupDestination(raw: string | null): string {
  return getOnboardingPath(raw);
}

export default function SignupPage() {
  const router = useRouter();
  const [mode, setMode] = useState<SignupMode>("email");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (mode === "email") {
      setSending(true);
      const supabase = createClient();
      const result = await signupWithEmail({
        supabase,
        fullName,
        username,
        email,
        password,
      });
      setSending(false);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      if (result.needsEmailConfirmation) {
        setInfo("Account created. Check your email to confirm, then log in.");
        return;
      }

      const next = signupDestination(new URLSearchParams(window.location.search).get("next"));
      router.replace(next);
      router.refresh();
      return;
    }

    const normalizedPhone = normalizePhoneNumber(phone);
    if (fullName.trim().length < 2) {
      setError("Enter your name.");
      return;
    }
    const phoneUsernameError = usernameValidationError(username);
    if (phoneUsernameError) {
      setError(phoneUsernameError);
      return;
    }
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
          options: {
            data: {
              full_name: fullName.trim(),
              phone: normalizedPhone,
              username: normalizeUsername(username),
            },
          },
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
      setSending(false);
      setError(formatAuthError(otpError.message));
      setMode("email");
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
        {mode === "email"
          ? "Create your account with email and password."
          : "Create your account with your phone number. No password."}
      </p>

      <div className="mb-6 grid grid-cols-2 gap-2 rounded-[var(--r-sm)] bg-[var(--bg-inset)] p-1">
        <button
          type="button"
          onClick={() => {
            setMode("email");
            setError(null);
            setInfo(null);
          }}
          className={`rounded-[calc(var(--r-sm)-2px)] py-2 text-sm font-semibold ${
            mode === "email"
              ? "bg-[var(--bg-surface)] text-[var(--ink-hi)] shadow-[0_1px_0_color-mix(in_oklch,var(--ink-hi)_8%,transparent)]"
              : "text-[var(--ink-mid)]"
          }`}
        >
          Email
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("phone");
            setError(null);
            setInfo(null);
          }}
          className={`rounded-[calc(var(--r-sm)-2px)] py-2 text-sm font-semibold ${
            mode === "phone"
              ? "bg-[var(--bg-surface)] text-[var(--ink-hi)] shadow-[0_1px_0_color-mix(in_oklch,var(--ink-hi)_8%,transparent)]"
              : "text-[var(--ink-mid)]"
          }`}
        >
          Phone
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="fullName" className="font-body text-xs text-[var(--ink-mid)]">
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

        <div className="space-y-2">
          <label htmlFor="username" className="font-body text-xs text-[var(--ink-mid)]">
            Username
          </label>
          <input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            placeholder="juan_dc"
            spellCheck={false}
            className={rondoFieldClass}
          />
          <p className="font-body text-[11px] text-[var(--ink-low)]">
            Letters, numbers, underscores. You can sign in with this.
          </p>
        </div>

        {mode === "email" ? (
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
                autoComplete="new-password"
                placeholder="At least 8 characters"
                className={rondoFieldClass}
              />
            </div>
          </>
        ) : (
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
        )}

        {error && (
          <p className="text-[var(--live)] text-sm text-center" role="alert">
            {error}
          </p>
        )}
        {info && (
          <p className="text-[var(--ink-mid)] text-sm text-center" role="status">
            {info}
          </p>
        )}

        <RondoButton type="submit" variant="primary" disabled={sending} className="mt-2">
          {sending
            ? mode === "email"
              ? "Creating account..."
              : "Sending code..."
            : mode === "email"
              ? "Create account"
              : "Get code"}
        </RondoButton>
      </form>

      <p className="text-center text-[var(--ink-mid)] text-sm mt-8">
        Already have an account?{" "}
        <Link
          href={`/login${nextParam ? `?next=${encodeURIComponent(nextParam)}` : ""}`}
          className="font-semibold text-[var(--ink-hi)] underline decoration-[var(--stroke)] underline-offset-4 hover:decoration-[var(--ink-hi)]"
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
