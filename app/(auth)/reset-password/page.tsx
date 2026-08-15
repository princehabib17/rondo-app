"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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
      setError(updateError.message);
      return;
    }

    setSaved(true);
    setTimeout(() => router.push("/login"), 1200);
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-[var(--ink-hi)] font-bold text-2xl uppercase tracking-widest">Reset Password</h1>
        <p className="text-[var(--ink-low)] text-sm">Choose a new password for your account.</p>
      </div>

      {saved ? (
        <p className="text-[var(--ok)] text-sm text-center">Password updated. Redirecting to login...</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-[var(--ink-low)] text-xs uppercase tracking-wider">New Password</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="new-password"
              className="w-full bg-[var(--bg-inset)] border border-[var(--stroke)] text-[var(--ink-hi)] rounded-[var(--r-sm)] p-3 text-sm focus:border-[var(--gold)] focus:outline-none"
              placeholder="••••••••"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[var(--ink-low)] text-xs uppercase tracking-wider">Confirm Password</label>
            <input
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              type="password"
              autoComplete="new-password"
              className="w-full bg-[var(--bg-inset)] border border-[var(--stroke)] text-[var(--ink-hi)] rounded-[var(--r-sm)] p-3 text-sm focus:border-[var(--gold)] focus:outline-none"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-[var(--live)] text-sm text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[var(--gold)] text-[var(--gold-ink)] font-heading font-black uppercase tracking-widest text-sm py-4 rounded-[var(--r-md)] disabled:opacity-50"
          >
            {loading ? "Saving..." : "Update Password"}
          </button>
        </form>
      )}
    </div>
  );
}
