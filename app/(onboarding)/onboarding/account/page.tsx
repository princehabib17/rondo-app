"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { JoinShell } from "@/components/onboarding/JoinShell";
import { SocialLoginButtons } from "@/components/auth/SocialLoginButtons";
import { RondoButton, rondoFieldClass } from "@/components/rondo/primitives";
import { createClient } from "@/lib/supabase/client";
import { signupWithEmail } from "@/lib/auth/signup-with-email";
import { applyOnboardingDraft } from "@/lib/onboarding/apply-draft";
import { joinBackPath, readOnboardingDraft } from "@/lib/onboarding/draft";

export default function OnboardingAccountPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [username, setUsername] = useState("");

  useEffect(() => {
    const draft = readOnboardingDraft();
    if (!draft.username) {
      router.replace("/onboarding/username");
      return;
    }
    setUsername(draft.username);
  }, [router]);

  async function createAccount(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSending(true);
    const draft = readOnboardingDraft();
    const supabase = createClient();
    const result = await signupWithEmail({
      supabase,
      fullName: draft.username,
      username: draft.username,
      email,
      password,
    });
    if (!result.ok) {
      setSending(false);
      setError(result.error);
      return;
    }
    if (result.needsEmailConfirmation) {
      setSending(false);
      setError("Check your email to confirm, then log in.");
      return;
    }
    const { data } = await supabase.auth.getUser();
    if (data.user?.id) {
      await applyOnboardingDraft(data.user.id, draft);
    }
    setSending(false);
    router.replace("/feed");
    router.refresh();
  }

  return (
    <JoinShell
      step="account"
      backHref={joinBackPath("account")}
      title="Create your account"
      subtitle="Save your profile and start playing."
      footer={null}
    >
      <form onSubmit={createAccount} className="space-y-5">
        {username ? (
          <p className="rounded-[var(--r-md)] bg-[var(--bg-inset)] px-4 py-3 font-body text-sm text-[var(--ink-mid)]">
            Signing up as <span className="font-bold text-[var(--ink-hi)]">@{username}</span>
          </p>
        ) : null}

        <div className="space-y-2">
          <label htmlFor="email" className="font-body text-xs text-[var(--ink-mid)]">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            className={rondoFieldClass}
            required
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="password" className="font-body text-xs text-[var(--ink-mid)]">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            className={rondoFieldClass}
            minLength={8}
            required
          />
        </div>

        {error && (
          <p className="text-center text-sm text-[var(--live)]" role="alert">
            {error}
          </p>
        )}

        <RondoButton type="submit" variant="primary" disabled={sending}>
          {sending ? "Creating account…" : "Create account"}
        </RondoButton>
      </form>

      <div className="mt-8">
        <SocialLoginButtons redirectTo="/onboarding/finish" />
      </div>

      <p className="mt-6 text-center font-body text-xs text-[var(--ink-low)]">
        By continuing, you agree to our{" "}
        <span className="text-[var(--ink-mid)] underline">Terms of Service</span> and{" "}
        <span className="text-[var(--ink-mid)] underline">Privacy Policy</span>.
      </p>
    </JoinShell>
  );
}
