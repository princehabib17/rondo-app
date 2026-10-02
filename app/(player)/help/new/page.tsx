"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { pushInAppNotification } from "@/lib/notifications";
import { PageHeader } from "@/components/layout/PageHeader";
import { RondoButton } from "@/components/rondo/primitives";
import { HELP_TOPICS, type HelpTopic } from "@/lib/help/topics";
import { cn } from "@/lib/utils";

function isTopic(value: string | null): value is HelpTopic {
  return HELP_TOPICS.some((topic) => topic.value === value);
}

function NewHelpTicketForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialType = searchParams.get("type");
  const [type, setType] = useState<HelpTopic>(isTopic(initialType) ? initialType : "payment_issue");
  const [description, setDescription] = useState("");
  const [refundRequested, setRefundRequested] = useState(initialType === "refund_request");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim() || saving) return;
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      router.push("/login?next=/help/new");
      return;
    }
    const { data, error: insertError } = await supabase
      .from("support_tickets")
      .insert({
        user_id: userData.user.id,
        type,
        description: description.trim(),
        refund_requested: refundRequested,
        status: refundRequested ? "refund_pending" : "open",
      })
      .select("id")
      .single();
    if (insertError || !data) {
      setSaving(false);
      setError("Couldn't send that. Check your connection and try again.");
      return;
    }
    await pushInAppNotification({
      userId: userData.user.id,
      type: "ticket_created",
      title: "We got your ticket",
      body: "Support will reply here, usually within a day.",
      link: `/help/${data.id}`,
    });
    router.replace(`/help/${data.id}`);
  }

  return (
    <form onSubmit={handleSubmit} className="min-h-[100dvh] rondo-page">
      <PageHeader title="New ticket" back fallbackHref="/help" />

      <div className="mx-auto max-w-lg space-y-8 px-4 py-6">
        <section>
          <h2 className="mb-3 rondo-label text-[var(--ink-low)]">What&apos;s it about?</h2>
          <div className="flex flex-wrap gap-2">
            {HELP_TOPICS.map((topic) => (
              <button
                key={topic.value}
                type="button"
                data-active={type === topic.value}
                onClick={() => {
                  setType(topic.value);
                  if (topic.value === "refund_request") setRefundRequested(true);
                }}
                className="rondo-chip min-h-10 normal-case tracking-normal text-[0.8125rem]"
              >
                {topic.label}
              </button>
            ))}
          </div>
          <p className="mt-3 rondo-meta text-[var(--ink-low)]">
            {HELP_TOPICS.find((topic) => topic.value === type)?.hint}
          </p>
        </section>

        <section className="space-y-2">
          <label htmlFor="help-description" className="rondo-label text-[var(--ink-low)]">
            Tell us what happened
          </label>
          <textarea
            id="help-description"
            value={description}
            onChange={(e) => setDescription(e.target.value.slice(0, 4000))}
            required
            rows={6}
            className="w-full resize-none rounded-[var(--r-sm)] border border-transparent bg-[var(--bg-inset)] p-4 rondo-body text-[var(--ink-hi)] placeholder:text-[var(--ink-low)] focus:border-[var(--gold)] focus:outline-none"
            placeholder="Which match, when, and what went wrong. Screenshots help, so mention if you have them."
          />
          <p className="text-right rondo-meta tabular-nums text-[var(--ink-low)]">{description.length}/4000</p>
        </section>

        <button
          type="button"
          role="switch"
          aria-checked={refundRequested}
          onClick={() => setRefundRequested((v) => !v)}
          className="flex w-full items-center gap-4 rounded-[var(--r-md)] border border-[var(--stroke)] bg-[var(--bg-surface)] p-4 text-left"
        >
          <span className="min-w-0 flex-1">
            <span className="block rondo-body font-bold text-[var(--ink-hi)]">I&apos;d like a refund</span>
            <span className="block rondo-meta text-[var(--ink-low)]">Approved refunds land in your Rondo wallet.</span>
          </span>
          <span
            aria-hidden
            className={cn(
              "relative h-7 w-12 shrink-0 rounded-[var(--r-pill)] transition-colors duration-200",
              refundRequested ? "bg-[var(--gold)]" : "bg-[var(--bg-inset)]"
            )}
          >
            <span
              className={cn(
                "absolute top-1 size-5 rounded-[var(--r-pill)] transition-transform duration-200",
                refundRequested ? "translate-x-6 bg-[var(--gold-ink)]" : "translate-x-1 bg-[var(--ink-low)]"
              )}
            />
          </span>
        </button>

        {error && (
          <p className="rondo-meta text-[var(--live)]" role="alert">
            {error}
          </p>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 rondo-sticky-action pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto max-w-lg px-4 py-3">
          <RondoButton type="submit" disabled={saving || !description.trim()}>
            {saving ? "Sending..." : "Send to support"}
          </RondoButton>
        </div>
      </div>
    </form>
  );
}

export default function NewHelpTicketPage() {
  return (
    <Suspense fallback={<div className="min-h-[100dvh] rondo-page" />}>
      <NewHelpTicketForm />
    </Suspense>
  );
}
