"use client";

import { useState } from "react";
import Link from "next/link";
import { EnvelopeSimple } from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import { RondoBrand } from "@/components/brand/RondoBrand";
import { RondoButton, rondoFieldClass } from "@/components/rondo/primitives";
import { isValidEmail } from "@/lib/auth/email";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = email.trim();
    if (!isValidEmail(value)) {
      setError("Enter the email you signed up with.");
      return;
    }
    setError(null);
    setLoading(true);
    const supabase = createClient();
    // Always show the same confirmation, so this screen can't be used to
    // check which emails have accounts.
    await supabase.auth
      .resetPasswordForEmail(value, {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      })
      .catch(() => null);
    setLoading(false);
    setSent(true);
  }

  return (
    <>
      <div className="pt-2 mb-10">
        <RondoBrand kind="wordmark" surface="auto" className="h-9 w-36" />
      </div>

      {sent ? (
        <div className="space-y-6">
          <span className="grid size-14 place-items-center rounded-[var(--r-pill)] bg-[var(--gold-dim)] text-[var(--gold)]">
            <EnvelopeSimple size={28} weight="duotone" aria-hidden />
          </span>
          <div>
            <h1 className="rondo-hero-title text-4xl mb-2">Check your inbox</h1>
            <p className="font-body text-sm text-[var(--ink-low)]">
              If <span className="font-semibold text-[var(--ink-hi)]">{email.trim()}</span> has a Rondo
              account, a reset link is on its way. It expires in an hour.
            </p>
          </div>
          <RondoButton href="/login" variant="secondary">
            Back to log in
          </RondoButton>
        </div>
      ) : (
        <>
          <h1 className="rondo-hero-title text-4xl mb-2">Reset password</h1>
          <p className="font-body text-sm text-[var(--ink-low)] mb-8">
            We&apos;ll email you a link to choose a new one.
          </p>
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div className="space-y-2">
              <label htmlFor="reset-email" className="font-body text-xs text-[var(--ink-mid)]">
                Email
              </label>
              <input
                id="reset-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="you@email.com"
                className={rondoFieldClass}
              />
            </div>
            {error && (
              <p className="text-sm text-[var(--live)]" role="alert">
                {error}
              </p>
            )}
            <RondoButton type="submit" disabled={loading}>
              {loading ? "Sending..." : "Send reset link"}
            </RondoButton>
          </form>
          <p className="mt-8 text-center text-sm text-[var(--ink-mid)]">
            Remembered it?{" "}
            <Link
              href="/login"
              className="font-semibold text-[var(--ink-hi)] underline decoration-[var(--stroke)] underline-offset-4 hover:decoration-[var(--ink-hi)]"
            >
              Log in
            </Link>
          </p>
        </>
      )}
    </>
  );
}
