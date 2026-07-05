"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getSafeRedirectPath } from "@/lib/auth/safe-redirect";
import { ONBOARDING_START_PATH, getRoleHomePath } from "@/lib/auth/role-routing";

function OtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phone = searchParams.get("phone") ?? "";
  const requestedNext = searchParams.get("next");
  const next = getSafeRedirectPath(requestedNext, ONBOARDING_START_PATH);
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
      setError(resendError.message);
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
      setError(verifyError?.message ?? "Could not verify code.");
      return;
    }

    const metadata = data.user.user_metadata ?? {};
    await supabase.from("profiles").upsert({
      id: data.user.id,
      email: data.user.email ?? null,
      phone,
      full_name: metadata.full_name ?? null,
      avatar_url: metadata.avatar_url ?? null,
    });

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    const destination = profile?.role
      ? requestedNext && !next.startsWith("/onboarding")
        ? next
        : getRoleHomePath(profile.role)
      : ONBOARDING_START_PATH;

    router.push(destination);
    router.refresh();
  }

  return (
    <div className="space-y-8 text-center">
      <div className="pt-2">
        <Image
          src="/rondo-logo.png"
          alt="RONDO"
          width={48}
          height={48}
          priority
          className="mx-auto object-contain"
        />
      </div>

      <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
        <ShieldCheck size={36} className="text-primary" />
      </div>

      <div className="space-y-2">
        <h1 className="rondo-hero-title text-4xl">Enter OTP</h1>
        <p className="text-muted-foreground text-sm">We sent a code to</p>
        <p className="text-white font-semibold text-sm">{phone || "your phone"}</p>
      </div>

      <form onSubmit={handleVerify} className="space-y-4">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={8}
          placeholder="1 2 3 4 5 6"
          className="w-full bg-white/[0.045] border border-white/18 rounded-xl px-4 py-4 text-center text-2xl font-heading text-white tracking-[0.35em] outline-none focus:border-rondo-accent/70"
        />

        {error && <p className="text-red-400 text-sm">{error}</p>}
        {resent && <p className="text-primary text-sm font-medium">Code resent.</p>}

        <button
          type="submit"
          disabled={!canVerify || verifying}
          className="w-full bg-rondo-accent text-black font-heading font-black uppercase tracking-widest text-sm py-4 rounded-xl disabled:opacity-40 active:scale-[0.98] transition-all"
        >
          {verifying ? "Verifying..." : "Continue"}
        </button>
      </form>

      <div className="space-y-3">
        <button
          type="button"
          onClick={handleResend}
          disabled={cooldown > 0 || !phone}
          className="text-rondo-accent text-sm font-semibold disabled:text-white/35"
        >
          {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
        </button>
        <Link href="/login" className="block text-muted-foreground text-sm hover:text-white transition-colors">
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
