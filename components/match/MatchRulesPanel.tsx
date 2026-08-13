import Link from "next/link";
import { HelpCircle, Lock, Shield, Wallet } from "lucide-react";
import type { Game, Profile } from "@/lib/supabase/types";
import { GameBadges } from "@/components/feed/GameBadges";
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
    <div className="space-y-4">
      <GameBadges game={game} showStatus />

      <div className="rondo-surface p-4 space-y-3 text-sm">
        <RuleRow icon={<Lock size={14} />} label="Access" value={getVisibilityLabel(game)} />
        <RuleRow icon={<Shield size={14} />} label="Join" value={getJoinRuleLabel(game)} />
        <RuleRow
          icon={<Wallet size={14} />}
          label="Payment"
          value={getPaymentRuleLabel(game)}
        />
        {usesWallet(game) && (
          <p className="text-[var(--ink-low)] text-xs leading-relaxed">
            {canPayLater(game)
              ? "Pay now to secure your spot, or reserve and pay later if the organizer allows it."
              : "You must pay through your Rondo Wallet to reserve a spot."}
          </p>
        )}
      </div>

      {organizer && (
        <div className="rondo-surface p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-[var(--r-md)] bg-[var(--bg-inset)] border border-[var(--stroke)] flex items-center justify-center overflow-hidden shrink-0">
            {organizer.avatar_url ? (
              <img src={organizer.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-[var(--gold)] font-black text-sm">
                {(organizer.full_name ?? "O").slice(0, 1)}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[var(--ink-low)] text-[10px] uppercase tracking-wider">Organizer</p>
            <p className="text-[var(--ink-hi)] font-bold text-sm truncate">{organizer.full_name ?? "Organizer"}</p>
            <p className="text-[var(--ink-low)] text-xs mt-0.5">
              {gamesHosted} match{gamesHosted === 1 ? "" : "es"} hosted
              {organizer.organizer_verified ? " · Verified" : ""}
            </p>
          </div>
        </div>
      )}

      <Link
        href="/help"
        className="flex items-center gap-2 text-[var(--ink-low)] hover:text-[var(--gold)] text-xs font-semibold transition-colors"
      >
        <HelpCircle size={14} />
        Refunds & disputes — contact Help
      </Link>
    </div>
  );
}

function RuleRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-3">
      <span className="text-[var(--gold)] shrink-0 mt-0.5">{icon}</span>
      <div>
        <p className="text-[var(--ink-low)] text-[10px] uppercase tracking-wider">{label}</p>
        <p className="text-[var(--ink-hi)] text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}
