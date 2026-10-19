"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { JoinShell } from "@/components/onboarding/JoinShell";
import { RondoButton, rondoFieldClass } from "@/components/rondo/primitives";
import {
  joinBackPath,
  joinNextPath,
  readOnboardingDraft,
  writeOnboardingDraft,
} from "@/lib/onboarding/draft";
import {
  isValidUsername,
  normalizeUsername,
  usernameValidationError,
} from "@/lib/auth/username";

export default function OnboardingUsernamePage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [available, setAvailable] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    setUsername(readOnboardingDraft().username);
  }, []);

  const normalized = normalizeUsername(username);
  const formatError = username ? usernameValidationError(username) : null;
  const lenOk = normalized.length >= 3 && normalized.length <= 20;
  const noSpaces = !/\s/.test(username);
  const charsOk = /^[a-z0-9_]*$/i.test(username);

  useEffect(() => {
    if (!isValidUsername(normalized)) {
      setAvailable(null);
      return;
    }
    setChecking(true);
    const t = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/auth/username-available?u=${encodeURIComponent(normalized)}`);
        const json = (await res.json()) as { available?: boolean };
        setAvailable(Boolean(json.available));
      } catch {
        setAvailable(true);
      } finally {
        setChecking(false);
      }
    }, 350);
    return () => window.clearTimeout(t);
  }, [normalized]);

  const canNext = useMemo(
    () => isValidUsername(normalized) && available === true && !checking,
    [normalized, available, checking]
  );

  function continueNext() {
    if (!canNext) return;
    writeOnboardingDraft({ username: normalized });
    router.push(joinNextPath("username"));
  }

  return (
    <JoinShell
      step="username"
      backHref={joinBackPath("username")}
      title="Choose your username"
      subtitle="This is how other players will find and recognize you."
      footer={
        <RondoButton type="button" variant="primary" disabled={!canNext} onClick={continueNext}>
          Next
        </RondoButton>
      }
    >
      <div className="space-y-3">
        <div
          className={`flex items-center gap-1 rounded-[var(--r-md)] border px-4 ${
            available === false
              ? "border-[var(--live)] bg-[color-mix(in_oklch,var(--live)_10%,transparent)]"
              : available === true
                ? "border-[var(--ok)] bg-[color-mix(in_oklch,var(--ok)_10%,transparent)]"
                : "border-[var(--stroke)] bg-[var(--bg-inset)]"
          }`}
        >
          <span className="font-body text-[var(--ink-mid)]">@</span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            spellCheck={false}
            maxLength={20}
            placeholder="username"
            className={`${rondoFieldClass} border-0 bg-transparent px-0 shadow-none focus:ring-0`}
          />
        </div>

        <div className="flex items-start justify-between gap-3">
          <p
            className={`font-body text-xs ${
              available === false
                ? "text-[var(--live)]"
                : available === true
                  ? "text-[var(--ok)]"
                  : "text-[var(--ink-low)]"
            }`}
          >
            {available === false
              ? "Username is already taken."
              : available === true
                ? "Username is available."
                : formatError ?? "No spaces. Letters, numbers, underscores."}
          </p>
          <p className="shrink-0 font-body text-xs text-[var(--ink-low)]">
            {normalized.length}/20
          </p>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {[
            { ok: lenOk, label: "3-20 characters" },
            { ok: noSpaces, label: "No spaces" },
            { ok: charsOk, label: "Letters and numbers" },
          ].map((chip) => (
            <span
              key={chip.label}
              className={`rounded-full px-3 py-1 font-body text-xs font-semibold ${
                chip.ok
                  ? "bg-[color-mix(in_oklch,var(--ok)_18%,transparent)] text-[var(--ok)]"
                  : "bg-[var(--bg-inset)] text-[var(--ink-low)]"
              }`}
            >
              {chip.label}
            </span>
          ))}
        </div>
      </div>
    </JoinShell>
  );
}
