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
        <div className="w-16 h-16 rounded-full border-2 border-rondo-yellow flex items-center justify-center">
          <span className="text-rondo-yellow font-bold text-xl">R</span>
        </div>
      </div>

      <div className="space-y-2 text-center">
        <h1 className="text-white font-bold text-2xl uppercase tracking-widest">Forgot Password</h1>
        <p className="text-muted-foreground text-sm">Enter your email to receive a reset link</p>
      </div>

      {sent ? (
        <div className="text-center space-y-4">
          <p className="text-rondo-yellow">Check your inbox for the reset link.</p>
          <Link href="/login" className="text-muted-foreground hover:text-white text-sm">Back to Login</Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label className="text-muted-foreground text-xs uppercase tracking-wider">Email</Label>
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="your@email.com"
              className="bg-secondary border-border text-white"
            />
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-rondo-yellow text-rondo-black font-bold uppercase tracking-wider hover:brightness-90"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </Button>
          <p className="text-center">
            <Link href="/login" className="text-muted-foreground text-sm hover:text-rondo-yellow">Back to Login</Link>
          </p>
        </form>
      )}
    </div>
  );
}
