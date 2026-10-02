import Link from "next/link";
import { CaretRight, Lifebuoy, LockSimple, SealCheck, ShieldCheck, Wallet } from "@phosphor-icons/react/dist/ssr";
import type { Game, Profile } from "@/lib/supabase/types";
import {
  canPayLater,
  getJoinRuleLabel,
  getPaymentRuleLabel,
  getVisibilityLabel,
  usesWallet,
} from "@/lib/match/rules";

export function MatchRulesPanel({
  game,
  organizer,
  gamesHosted,
}: {
  game: Game;
  organizer?: Profile | null;
  gamesHosted: number;
}) {
  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h3 className="rondo-label text-[var(--ink-low)]">How it works</h3>
        <div className="divide-y divide-[var(--stroke)] overflow-hidden rounded-[var(--r-md)] border border-[var(--stroke)] bg-[var(--bg-surface)]">
          <RuleRow icon={<LockSimple size={18} aria-hidden />} label="Access" value={getVisibilityLabel(game)} />
          <RuleRow icon={<ShieldCheck size={18} aria-hidden />} label="Joining" value={getJoinRuleLabel(game)} />
          <RuleRow
            icon={<Wallet size={18} aria-hidden />}
            label="Payment"
            value={getPaymentRuleLabel(game)}
            note={
              usesWallet(game)
                ? canPayLater(game)
                  ? "Pay now to lock your spot, or reserve and pay before kickoff."
                  : "Your spot is confirmed the moment your wallet payment goes through."
                : undefined
            }
          />
        </div>
      </section>

      {organizer && (
        <section className="space-y-3">
          <h3 className="rondo-label text-[var(--ink-low)]">Organizer</h3>
          <Link
            href={`/organizers/${organizer.id}`}
            className="flex min-h-16 items-center gap-3 rounded-[var(--r-md)] border border-[var(--stroke)] bg-[var(--bg-surface)] px-4 py-3 transition-transform active:scale-[0.98]"
          >
            <span className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-[var(--r-pill)] border border-[var(--stroke)] bg-[var(--bg-inset)]">
              {organizer.avatar_url ? (
                <img src={organizer.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="font-heading text-lg font-bold text-[var(--ink-hi)]">
                  {(organizer.full_name ?? "O").slice(0, 1)}
                </span>
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5">
                <span className="truncate rondo-body font-bold text-[var(--ink-hi)]">{organizer.full_name ?? "Organizer"}</span>
                {organizer.organizer_verified && (
                  <SealCheck size={16} weight="fill" className="shrink-0 text-[var(--gold)]" aria-label="Verified organizer" />
                )}
              </span>
              <span className="block rondo-meta text-[var(--ink-low)]">
                {gamesHosted} match{gamesHosted === 1 ? "" : "es"} hosted on Rondo
              </span>
            </span>
            <CaretRight size={16} className="shrink-0 text-[var(--ink-low)]" aria-hidden />
          </Link>
          <Link
            href="/help/new?type=refund_request"
            className="inline-flex min-h-11 items-center gap-2 rondo-meta text-[var(--ink-low)] transition-colors hover:text-[var(--ink-hi)]"
          >
            <Lifebuoy size={16} aria-hidden />
            Refunds and disputes go through Rondo Help
          </Link>
        </section>
      )}
    </div>
  );
}

function RuleRow({
  icon,
  label,
  value,
  note,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div className="flex gap-3 px-4 py-3">
      <span className="mt-0.5 shrink-0 text-[var(--ink-low)]">{icon}</span>
      <div className="min-w-0">
        <p className="rondo-label text-[var(--ink-low)]">{label}</p>
        <p className="mt-0.5 rondo-body text-[var(--ink-hi)]">{value}</p>
        {note && <p className="mt-1 rondo-meta text-[var(--ink-low)]">{note}</p>}
      </div>
    </div>
  );
}
