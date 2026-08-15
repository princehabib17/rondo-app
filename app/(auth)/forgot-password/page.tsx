"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });
    setLoading(false);
    setSent(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-center">
        <div className="w-16 h-16 rounded-full border-2 border-[var(--gold)] flex items-center justify-center">
          <span className="text-[var(--gold)] font-bold text-xl">R</span>
        </div>
      </div>

      <div className="space-y-2 text-center">
        <h1 className="text-[var(--ink-hi)] font-bold text-2xl uppercase tracking-widest">Forgot Password</h1>
        <p className="text-[var(--ink-low)] text-sm">Enter your email to receive a reset link</p>
      </div>

      {sent ? (
        <div className="text-center space-y-4">
          <p className="text-[var(--gold)]">Check your inbox for the reset link.</p>
          <Link href="/login" className="text-[var(--ink-low)] hover:text-[var(--ink-hi)] text-sm">Back to Login</Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label className="text-[var(--ink-low)] text-xs uppercase tracking-wider">Email</Label>
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="your@email.com"
              className="bg-[var(--bg-inset)] border-[var(--stroke)] text-[var(--ink-hi)]"
            />
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-[var(--gold)] text-rondo-black font-bold uppercase tracking-wider hover:brightness-90"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </Button>
          <p className="text-center">
            <Link href="/login" className="text-[var(--ink-low)] text-sm hover:text-[var(--gold)]">Back to Login</Link>
          </p>
        </form>
      )}
    </div>
  );
}
