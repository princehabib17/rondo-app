"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Building2, ClipboardList, Trophy } from "lucide-react";

export default function CreateHubPage() {
  const router = useRouter();

  return (
    <div className="min-h-[100dvh] bg-[#050505] pb-12">
      <header className="sticky top-0 bg-background/90 backdrop-blur-md border-b border-white/10 z-40 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center text-white hover:text-rondo-yellow transition-colors"
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-rondo-yellow">
            Rondo
          </p>
          <h1 className="rondo-hero-title text-2xl">Create</h1>
        </div>
      </header>

      <div className="px-4 pt-6 max-w-lg mx-auto space-y-3">
        <p className="text-white/40 text-sm font-medium mb-6">What are you building today?</p>

        {/* Create Match card */}
        <Link
          href="/organizer/create/match"
          className="group block overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] transition-all hover:border-rondo-yellow/40 active:scale-[0.99]"
        >
          <div className="relative h-36 overflow-hidden bg-[radial-gradient(circle_at_18%_28%,rgba(233,255,58,0.22),transparent_48%),linear-gradient(135deg,#161606,#050505)]">
            <div className="absolute inset-0 flex items-center px-5">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rondo-yellow/15 text-rondo-yellow ring-1 ring-rondo-yellow/20">
                <ClipboardList size={28} />
              </div>
            </div>
            <ClipboardList
              size={120}
              className="absolute -right-6 -bottom-4 text-white opacity-[0.04] group-hover:opacity-[0.07] transition-opacity"
            />
          </div>
          <div className="px-5 py-4 flex items-center justify-between gap-3">
            <div>
              <p className="font-heading text-xl font-black uppercase italic text-white leading-tight">
                Create Match
              </p>
              <p className="text-sm text-white/45 mt-0.5">
                Cover, venue, teams, payment — all in one flow.
              </p>
            </div>
            <span className="text-rondo-yellow text-2xl font-black leading-none shrink-0">→</span>
          </div>
        </Link>

        {/* Build Tournament card */}
        <Link
          href="/organizer/tournaments/create"
          className="group block overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] transition-all hover:border-rondo-accent/40 active:scale-[0.99]"
        >
          <div className="relative h-36 overflow-hidden bg-[radial-gradient(circle_at_82%_22%,rgba(245,197,24,0.16),transparent_46%),linear-gradient(135deg,#111,#060606)]">
            <div className="absolute inset-0 flex items-center px-5">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rondo-accent/15 text-rondo-accent ring-1 ring-rondo-accent/20">
                <Trophy size={28} />
              </div>
            </div>
            <Trophy
              size={120}
              className="absolute -right-6 -bottom-4 text-white opacity-[0.04] group-hover:opacity-[0.07] transition-opacity"
            />
          </div>
          <div className="px-5 py-4 flex items-center justify-between gap-3">
            <div>
              <p className="font-heading text-xl font-black uppercase italic text-white leading-tight">
                Build Tournament
              </p>
              <p className="text-sm text-white/45 mt-0.5">
                Brackets, leagues, entry fees, and prize pool.
              </p>
            </div>
            <span className="text-rondo-accent text-2xl font-black leading-none shrink-0">→</span>
          </div>
        </Link>

        {/* Organization card */}
        <Link
          href="/organizer/organizations"
          className="group block overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] transition-all hover:border-white/25 active:scale-[0.99]"
        >
          <div className="relative h-36 overflow-hidden bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.07),transparent_55%),linear-gradient(135deg,#101010,#050505)]">
            <div className="absolute inset-0 flex items-center px-5">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/8 text-white/55 ring-1 ring-white/10">
                <Building2 size={28} />
              </div>
            </div>
            <Building2
              size={120}
              className="absolute -right-6 -bottom-4 text-white opacity-[0.035] group-hover:opacity-[0.07] transition-opacity"
            />
          </div>
          <div className="px-5 py-4 flex items-center justify-between gap-3">
            <div>
              <p className="font-heading text-xl font-black uppercase italic text-white leading-tight">
                Organization
              </p>
              <p className="text-sm text-white/45 mt-0.5">
                Manage your brand, admins, and membership.
              </p>
            </div>
            <span className="text-white/35 text-2xl font-black leading-none shrink-0">→</span>
          </div>
        </Link>
      </div>
    </div>
  );
}
