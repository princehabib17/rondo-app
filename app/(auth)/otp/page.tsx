"use client";
export const dynamic = "force-dynamic";

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
      <div className="flex justify-center">
        <div className="w-16 h-16 rounded-full border-2 border-rondo-yellow flex items-center justify-center">
          <span className="text-rondo-yellow font-bold text-xl">R</span>
        </div>
      </div>

      <div className="space-y-2">
        <h1 className="text-white font-bold text-2xl tracking-widest uppercase">Enter OTP</h1>
        <p className="text-muted-foreground text-sm">
          Enter the one time pin sent to your email
        </p>
      </div>

      <div className="flex gap-3 justify-center">
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
            className="w-12 h-14 text-center text-white text-xl font-bold bg-secondary border border-border rounded-lg focus:border-rondo-yellow focus:outline-none"
          />
        ))}
      </div>

      {error && <p className="text-destructive text-sm text-center">{error}</p>}

      <Button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-rondo-yellow text-rondo-black font-bold uppercase tracking-wider hover:brightness-90"
      >
        {loading ? "Verifying..." : "Continue"}
      </Button>

      <p className="text-center text-muted-foreground text-sm">
        Didn&apos;t receive code?{" "}
        <button
          onClick={handleResend}
          disabled={resendCooldown > 0}
          className="text-rondo-yellow hover:underline disabled:opacity-50"
        >
          {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend OTP"}
        </button>
      </p>
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
