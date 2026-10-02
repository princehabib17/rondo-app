"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { RondoBrand } from "@/components/brand/RondoBrand";
import { RondoButton, rondoFieldClass } from "@/components/rondo/primitives";
import { formatAuthError } from "@/lib/auth/format-auth-error";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError(
        /session|jwt|expired|not authenticated/i.test(updateError.message)
          ? "This reset link has expired. Request a new one from the log in screen."
          : formatAuthError(updateError.message)
      );
      return;
    }

    setSaved(true);
    setTimeout(() => router.push("/login"), 1200);
  }

  return (
    <>
      <div className="pt-2 mb-10">
        <RondoBrand kind="wordmark" surface="auto" className="h-9 w-36" />
      </div>

      <h1 className="rondo-hero-title text-4xl mb-2">New password</h1>
      <p className="font-body text-sm text-[var(--ink-low)] mb-8">Pick something you haven&apos;t used before.</p>

      {saved ? (
        <p className="rounded-[var(--r-md)] border border-[color-mix(in_oklch,var(--ok)_35%,var(--stroke))] bg-[color-mix(in_oklch,var(--ok)_8%,transparent)] p-4 text-sm text-[var(--ok)]" role="status">
          Password updated. Taking you to log in.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="new-password" className="font-body text-xs text-[var(--ink-mid)]">
              New password
            </label>
            <input
              id="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="new-password"
              className={rondoFieldClass}
              placeholder="At least 8 characters"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="confirm-password" className="font-body text-xs text-[var(--ink-mid)]">
              Confirm password
            </label>
            <input
              id="confirm-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              type="password"
              autoComplete="new-password"
              className={rondoFieldClass}
              placeholder="Type it again"
            />
          </div>

          {error && (
            <p className="text-sm text-[var(--live)]" role="alert">
              {error}
            </p>
          )}

          <RondoButton type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save new password"}
          </RondoButton>
        </form>
      )}
    </>
  );
}
