"use client";

import { useRef, useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

function OTPForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendCooldown]);

  function handleChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) inputs.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  }

  async function handleSubmit() {
    const token = otp.join("");
    if (token.length < 6) {
      setError("Enter all 6 digits");
      return;
    }
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/onboarding/slides");
  }

  async function handleResend() {
    if (resendCooldown > 0) return;
    const supabase = createClient();
    await supabase.auth.resend({ type: "signup", email });
    setResendCooldown(60);
  }

  return (
    <div className="space-y-8">
      {/* Logo */}
      <div className="flex justify-center">
        <div className="w-20 h-20 rounded-2xl border-2 border-primary flex items-center justify-center bg-primary/5">
          <span className="text-primary font-black text-3xl tracking-widest">R</span>
        </div>
      </div>

      {/* Header */}
      <div className="space-y-3 text-center">
        <h1 className="text-3xl font-black tracking-tight text-foreground">ENTER OTP</h1>
        <p className="text-sm text-muted-foreground">
          We sent a code to <span className="font-semibold text-foreground">{email}</span>
        </p>
      </div>

      {/* OTP Input Fields */}
      <div className="flex gap-2 justify-center">
        {otp.map((digit, i) => (
          <input
            key={i}
            ref={(el) => {
              inputs.current[i] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            className="w-14 h-16 text-center text-foreground text-2xl font-bold bg-secondary border-2 border-border rounded-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            placeholder="0"
          />
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-destructive text-sm font-medium text-center bg-destructive/10 rounded-lg p-3">
          {error}
        </p>
      )}

      {/* Submit Button */}
      <Button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full h-12 bg-primary text-primary-foreground font-black uppercase tracking-wider text-sm hover:brightness-110 disabled:opacity-50"
      >
        {loading ? "Verifying..." : "Continue"}
      </Button>

      {/* Resend OTP */}
      <div className="text-center space-y-1">
        <p className="text-muted-foreground text-xs">Didn&apos;t receive code?</p>
        <button
          onClick={handleResend}
          disabled={resendCooldown > 0}
          className="text-sm font-semibold text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend OTP"}
        </button>
      </div>
    </div>
  );
}

export default function OTPPage() {
  return (
    <Suspense>
      <OTPForm />
    </Suspense>
  );
}
