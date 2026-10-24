"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { CheckCircle, CircleNotch, Check, User, XCircle } from "@phosphor-icons/react";
import { JoinShell } from "@/components/onboarding/JoinShell";
import { RondoButton } from "@/components/rondo/primitives";
import {
  joinBackPath,
  joinNextPath,
  readOnboardingDraft,
  writeOnboardingDraft,
} from "@/lib/onboarding/draft";
import {
  isValidUsername,
  normalizeUsername,
  sanitizeUsernameInput,
  suggestUsernames,
  usernameRuleStates,
  usernameValidationError,
  USERNAME_MAX_LENGTH,
} from "@/lib/auth/username";
import { cn } from "@/lib/utils";

type Status = "idle" | "checking" | "available" | "taken" | "invalid";

async function checkAvailable(name: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/auth/username-available?u=${encodeURIComponent(name)}`);
    const json = (await res.json()) as { available?: boolean };
    return Boolean(json.available);
  } catch {
    return true;
  }
}

export default function OnboardingUsernamePage() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const inputRef = useRef<HTMLInputElement>(null);
  const [username, setUsername] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [avatar, setAvatar] = useState<string | null>(null);

  useEffect(() => {
    const draft = readOnboardingDraft();
    setUsername(draft.username);
    setAvatar(draft.avatarDataUrl);
    inputRef.current?.focus();
  }, []);

  const normalized = normalizeUsername(username);
  const rules = usernameRuleStates(username);
  const formatError = username ? usernameValidationError(username) : null;

  useEffect(() => {
    setSuggestions([]);
    if (!normalized) {
      setStatus("idle");
      return;
    }
    if (!isValidUsername(normalized)) {
      setStatus("invalid");
      return;
    }
    setStatus("checking");
    let cancelled = false;
    const t = window.setTimeout(async () => {
      const ok = await checkAvailable(normalized);
      if (cancelled) return;
      setStatus(ok ? "available" : "taken");
      if (!ok) {
        const candidates = suggestUsernames(normalized);
        const results = await Promise.all(candidates.map(async (c) => [c, await checkAvailable(c)] as const));
        if (!cancelled) setSuggestions(results.filter(([, free]) => free).map(([c]) => c).slice(0, 3));
      }
    }, 350);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [normalized]);

  const canNext = useMemo(() => status === "available", [status]);

  function continueNext() {
    if (!canNext) return;
    writeOnboardingDraft({ username: normalized });
    router.push(joinNextPath("username"));
  }

  const message =
    status === "taken"
      ? "That one's taken. Try one of these:"
      : status === "available"
        ? "Nice — it's yours if you want it."
        : status === "checking"
          ? "Checking…"
          : status === "invalid"
            ? formatError
            : "This is the name on every team sheet.";

  return (
    <JoinShell
      step="username"
      backHref={joinBackPath("username")}
      title="Pick your player name"
      subtitle="This is how teammates find you, tag you, and see you on the team sheet."
      footer={
        <RondoButton type="button" variant="primary" disabled={!canNext} onClick={continueNext}>
          Next
        </RondoButton>
      }
    >
      <div className="space-y-5">
        <label
          className={cn(
            "flex h-16 items-center gap-2 rounded-[var(--r-md)] border-2 bg-[var(--bg-inset)] px-4 transition-[border-color,box-shadow] duration-200 focus-within:shadow-[0_0_0_4px_color-mix(in_oklch,var(--gold)_18%,transparent)]",
            status === "taken" || status === "invalid"
              ? "border-[var(--live)]"
              : status === "available"
                ? "border-[var(--ok)]"
                : "border-transparent focus-within:border-[var(--gold)]"
          )}
        >
          <span className="font-heading text-2xl font-black text-[var(--gold)]">@</span>
          <input
            ref={inputRef}
            value={username}
            onChange={(e) => setUsername(sanitizeUsernameInput(e.target.value))}
            onKeyDown={(e) => e.key === "Enter" && continueNext()}
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={USERNAME_MAX_LENGTH}
            placeholder="yourname"
            aria-label="Username"
            className="h-full min-w-0 flex-1 bg-transparent font-heading text-2xl font-bold tracking-tight text-[var(--ink-hi)] placeholder:text-[var(--ink-low)] focus:outline-none"
          />
          <span className="flex h-7 w-7 items-center justify-center" aria-hidden>
            {status === "checking" && <CircleNotch size={22} className="animate-spin text-[var(--ink-mid)]" />}
            {status === "available" && <CheckCircle size={26} weight="fill" className="text-[var(--ok)]" />}
            {(status === "taken" || status === "invalid") && (
              <XCircle size={26} weight="fill" className="text-[var(--live)]" />
            )}
          </span>
        </label>

        <div className="flex items-start justify-between gap-3" aria-live="polite">
          <p
            className={cn(
              "font-body text-sm",
              status === "taken" || status === "invalid"
                ? "text-[var(--live)]"
                : status === "available"
                  ? "text-[var(--ok)]"
                  : "text-[var(--ink-low)]"
            )}
          >
            {message}
          </p>
          <p className="shrink-0 font-body text-xs tabular-nums text-[var(--ink-low)]">
            {normalized.length}/{USERNAME_MAX_LENGTH}
          </p>
        </div>

        <AnimatePresence>
          {suggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: reduceMotion ? 0 : -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-wrap gap-2"
            >
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setUsername(s)}
                  className="rounded-full border border-[color-mix(in_oklch,var(--gold)_45%,var(--stroke))] bg-[var(--gold-dim)] px-4 py-2 font-body text-sm font-bold text-[var(--gold)] transition-transform active:scale-95"
                >
                  @{s}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <ul className="flex flex-wrap gap-2" aria-label="Username rules">
          {rules.map((rule) => (
            <li
              key={rule.id}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 font-body text-xs font-semibold transition-colors",
                rule.met
                  ? "bg-[color-mix(in_oklch,var(--ok)_16%,transparent)] text-[var(--ok)]"
                  : "bg-[var(--bg-inset)] text-[var(--ink-low)]"
              )}
            >
              {rule.met && <Check size={12} weight="bold" />}
              {rule.label}
            </li>
          ))}
        </ul>

        <div className="pt-3">
          <p className="mb-2 font-body text-[0.7rem] font-bold uppercase tracking-[0.16em] text-[var(--ink-low)]">
            On the team sheet
          </p>
          <div className="flex items-center gap-4 rounded-[var(--r-md)] border border-[var(--stroke)] bg-[linear-gradient(135deg,var(--bg-surface),color-mix(in_oklch,var(--gold)_8%,var(--bg-surface)))] p-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[var(--gold)] bg-[var(--bg-inset)]">
              {avatar ? (
                 
                <img src={avatar} alt="" className="h-full w-full object-cover" />
              ) : (
                <User size={28} weight="fill" className="text-[var(--ink-low)]" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-heading text-xl font-black tracking-tight text-[var(--ink-hi)]">
                @{normalized || "yourname"}
              </p>
              <p className="font-body text-xs text-[var(--ink-mid)]">New player · Rondo</p>
            </div>
            <span className="rounded-full bg-[var(--gold)] px-2.5 py-1 font-heading text-xs font-black text-[var(--gold-ink)]">
              #10
            </span>
          </div>
        </div>
      </div>
    </JoinShell>
  );
}
