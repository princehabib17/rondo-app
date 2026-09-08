"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ShieldCheck } from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import { RondoBrand } from "@/components/brand/RondoBrand";
import { getSafeRedirectPath } from "@/lib/auth/safe-redirect";
import {
  getOnboardingPath,
  getPostOnboardingDestination,
} from "@/lib/auth/destination";
import { formatAuthError } from "@/lib/auth/format-auth-error";

function OtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phone = searchParams.get("phone") ?? "";
  const next = getSafeRedirectPath(searchParams.get("next"), "/onboarding/slides");
  const [code, setCode] = useState("");
  const [cooldown, setCooldown] = useState(60);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  const canVerify = useMemo(() => code.replace(/\D/g, "").length >= 4, [code]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function handleResend() {
    if (cooldown > 0 || !phone) return;
    setError(null);
    const supabase = createClient();
    const { error: resendError } = await supabase.auth.signInWithOtp({ phone });
    if (resendError) {
      setError(formatAuthError(resendError.message));
      return;
    }
    setCooldown(60);
    setResent(true);
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!phone || !canVerify) return;
    setError(null);
    setVerifying(true);
    const supabase = createClient();
    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      phone,
      token: code.replace(/\D/g, ""),
      type: "sms",
    });

    if (verifyError || !data.user) {
      setVerifying(false);
      setError(formatAuthError(verifyError?.message ?? "Could not verify code."));
      return;
    }

    const metadata = data.user.user_metadata ?? {};
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    await supabase.from("profiles").upsert({
      id: data.user.id,
      email: data.user.email ?? null,
      phone,
      ...(metadata.full_name ? { full_name: metadata.full_name } : {}),
      ...(metadata.avatar_url ? { avatar_url: metadata.avatar_url } : {}),
    });

    router.push(
      profile?.role
        ? getPostOnboardingDestination(next, profile.role)
        : getOnboardingPath(next)
    );
    router.refresh();
  }

  return (
    <div className="space-y-8 text-center">
      <div className="pt-2">
        <RondoBrand
          kind="wordmark"
          surface="auto"
          className="mx-auto h-10 w-40"
          fetchPriority="high"
        />
      </div>

      <div className="w-20 h-20 rounded-[var(--r-pill)] bg-[var(--gold-dim)] border border-[var(--gold)] flex items-center justify-center mx-auto">
        <ShieldCheck size={36} weight="duotone" className="text-[var(--gold)]" />
      </div>

      <div className="space-y-2">
        <h1 className="rondo-display text-[var(--ink-hi)]">Enter code</h1>
        {phone ? (
          <>
            <p className="rondo-meta text-[var(--ink-low)]">We sent a code to</p>
            <p className="rondo-body font-bold text-[var(--ink-hi)]">{phone}</p>
          </>
        ) : (
          <>
            <p className="rondo-meta text-[var(--ink-low)]">No phone number on this screen.</p>
            <Link href="/signup" className="rondo-body font-bold text-[var(--gold)]">
              Get a code first
            </Link>
          </>
        )}
      </div>

      <form onSubmit={handleVerify} className="space-y-4">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={8}
          placeholder=""
          aria-label="Login code"
          className="h-14 w-full rounded-[var(--r-sm)] border border-transparent bg-[var(--bg-inset)] px-4 text-center font-heading text-3xl font-bold tracking-[0.28em] text-[var(--ink-hi)] outline-none focus:border-[var(--gold)]"
        />

        {error && <p className="rondo-meta text-[var(--live)]">{error}</p>}
        {resent && <p className="rondo-meta font-bold text-[var(--gold)]">Code resent.</p>}

        <button
          type="submit"
          disabled={!canVerify || verifying}
          className="rondo-btn rondo-btn-primary disabled:opacity-40"
        >
          {verifying ? "Verifying..." : "Continue"}
        </button>
      </form>

      <div className="space-y-3">
        <button
          type="button"
          onClick={handleResend}
          disabled={cooldown > 0 || !phone}
          className="rondo-meta font-bold text-[var(--gold)] disabled:text-[var(--ink-low)]"
        >
          {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
        </button>
        <Link href="/login" className="block rondo-meta text-[var(--ink-low)] transition-colors hover:text-[var(--ink-hi)]">
          Use another number
        </Link>
      </div>
    </div>
  );
}

export default function OtpPage() {
  return (
    <Suspense>
      <OtpContent />
    </Suspense>
  );
}
