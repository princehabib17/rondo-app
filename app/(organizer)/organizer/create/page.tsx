"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Building2, ClipboardList, Trophy } from "lucide-react";

export default function CreateHubPage() {
  const router = useRouter();

  return (
    <div className="min-h-[100dvh] rondo-page pb-12">
      <header className="sticky top-0 rondo-glass-nav border-b border-[var(--stroke)] z-40 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--ink-hi)] hover:text-[var(--gold)] transition-colors"
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--gold)]">
            Rondo
          </p>
          <h1 className="rondo-hero-title text-2xl">Create</h1>
        </div>
      </header>

      <div className="px-4 pt-6 max-w-lg mx-auto space-y-3">
        <p className="text-[var(--ink-low)] text-sm font-medium mb-6">What are you building today?</p>

        {/* Create Match card */}
        <Link
          href="/organizer/create/match"
          className="group block overflow-hidden rounded-2xl border border-[var(--stroke)] bg-[var(--bg-surface)] transition-all hover:border-[var(--gold)]/40 active:scale-[0.99]"
        >
          <div className="relative h-36 overflow-hidden bg-[radial-gradient(circle_at_18%_28%,color-mix(in_oklch,var(--gold)_22%,transparent),transparent_48%),linear-gradient(135deg,var(--bg-surface),var(--bg-page))]">
            <div className="absolute inset-0 flex items-center px-5">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--gold-dim)] text-[var(--gold)] ring-1 ring-[var(--gold)]/20">
                <ClipboardList size={28} />
              </div>
            </div>
            <ClipboardList
              size={120}
              className="absolute -right-6 -bottom-4 text-[var(--ink-hi)] opacity-[0.04] group-hover:opacity-[0.07] transition-opacity"
            />
          </div>
          <div className="px-5 py-4 flex items-center justify-between gap-3">
            <div>
              <p className="font-heading text-xl font-black uppercase italic text-[var(--ink-hi)] leading-tight">
                Create Match
              </p>
              <p className="text-sm text-[var(--ink-low)] mt-0.5">
                Cover, venue, teams, payment — all in one flow.
              </p>
            </div>
            <span className="text-[var(--gold)] text-2xl font-black leading-none shrink-0">→</span>
          </div>
        </Link>

        {/* Build Tournament card */}
        <Link
          href="/organizer/tournaments/create"
          className="group block overflow-hidden rounded-2xl border border-[var(--stroke)] bg-[var(--bg-surface)] transition-all hover:border-[var(--gold)]/40 active:scale-[0.99]"
        >
          <div className="relative h-36 overflow-hidden bg-[radial-gradient(circle_at_82%_22%,color-mix(in_oklch,var(--gold)_16%,transparent),transparent_46%),linear-gradient(135deg,var(--bg-surface),var(--bg-page))]">
            <div className="absolute inset-0 flex items-center px-5">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--gold-dim)] text-[var(--gold)] ring-1 ring-[var(--gold)]/20">
                <Trophy size={28} />
              </div>
            </div>
            <Trophy
              size={120}
              className="absolute -right-6 -bottom-4 text-[var(--ink-hi)] opacity-[0.04] group-hover:opacity-[0.07] transition-opacity"
            />
          </div>
          <div className="px-5 py-4 flex items-center justify-between gap-3">
            <div>
              <p className="font-heading text-xl font-black uppercase italic text-[var(--ink-hi)] leading-tight">
                Build Tournament
              </p>
              <p className="text-sm text-[var(--ink-low)] mt-0.5">
                Brackets, leagues, entry fees, and prize pool.
              </p>
            </div>
            <span className="text-[var(--gold)] text-2xl font-black leading-none shrink-0">→</span>
          </div>
        </Link>

        {/* Organization card */}
        <Link
          href="/organizer/organizations"
          className="group block overflow-hidden rounded-2xl border border-[var(--stroke)] bg-[var(--bg-surface)] transition-all hover:border-[var(--stroke)] active:scale-[0.99]"
        >
          <div className="relative h-36 overflow-hidden bg-[radial-gradient(circle_at_50%_50%,color-mix(in_oklch,var(--ink-hi)_7%,transparent),transparent_55%),linear-gradient(135deg,var(--bg-surface),var(--bg-page))]">
            <div className="absolute inset-0 flex items-center px-5">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--bg-inset)] text-[var(--ink-mid)] ring-1 ring-[var(--stroke)]">
                <Building2 size={28} />
              </div>
            </div>
            <Building2
              size={120}
              className="absolute -right-6 -bottom-4 text-[var(--ink-hi)] opacity-[0.035] group-hover:opacity-[0.07] transition-opacity"
            />
          </div>
          <div className="px-5 py-4 flex items-center justify-between gap-3">
            <div>
              <p className="font-heading text-xl font-black uppercase italic text-[var(--ink-hi)] leading-tight">
                Organization
              </p>
              <p className="text-sm text-[var(--ink-low)] mt-0.5">
                Manage your brand, admins, and membership.
              </p>
            </div>
            <span className="text-[var(--ink-low)] text-2xl font-black leading-none shrink-0">→</span>
          </div>
        </Link>
      </div>
    </div>
  );
}
