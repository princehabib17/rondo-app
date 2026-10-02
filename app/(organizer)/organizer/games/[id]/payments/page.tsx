"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/layout/PageHeader";
import { PlayerAvatar } from "@/components/game/PlayerAvatar";
import { formatPrice } from "@/lib/utils/format";
import { cn } from "@/lib/utils";
import type { PaymentStatus, Profile } from "@/lib/supabase/types";

interface PaymentEntry {
  id: string;
  payment_status: PaymentStatus;
  profile: Pick<Profile, "id" | "full_name" | "avatar_url" | "nationality"> | null;
}

type Bucket = "paid" | "owed" | "review" | "out";

const BUCKET: Record<PaymentStatus, Bucket> = {
  paid: "paid",
  approved: "paid",
  venue: "owed",
  pending: "owed",
  pending_payment: "owed",
  reserved: "owed",
  pending_approval: "review",
  refund_requested: "review",
  refunded: "out",
  rejected: "out",
  cancelled: "out",
  no_show: "out",
};

const STATUS_LABEL: Record<PaymentStatus, string> = {
  paid: "Paid",
  approved: "Approved",
  venue: "Pays at venue",
  pending: "Not paid yet",
  pending_payment: "Not paid yet",
  reserved: "Spot held",
  pending_approval: "Waiting for your approval",
  refund_requested: "Asked for a refund",
  refunded: "Refunded",
  rejected: "Declined",
  cancelled: "Left the match",
  no_show: "No-show",
};

const GROUPS: { key: Bucket; title: string }[] = [
  { key: "review", title: "Needs you" },
  { key: "owed", title: "Still to collect" },
  { key: "paid", title: "Paid" },
  { key: "out", title: "Not playing" },
];

export default function OrganizerGamePaymentsPage() {
  const { id } = useParams<{ id: string }>();
  const [entries, setEntries] = useState<PaymentEntry[]>([]);
  const [pricePerPlayer, setPricePerPlayer] = useState(0);
  const [title, setTitle] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const [{ data: game }, { data: players }] = await Promise.all([
        supabase.from("games").select("title, price_per_player").eq("id", id).single(),
        supabase
          .from("game_players")
          .select("id, payment_status, profile:profiles(id, full_name, avatar_url, nationality)")
          .eq("game_id", id)
          .order("joined_at", { ascending: true }),
      ]);
      setTitle(game?.title ?? null);
      setPricePerPlayer(game?.price_per_player ?? 0);
      setEntries((players as unknown as PaymentEntry[] | null) ?? []);
      setLoading(false);
    }
    load();
  }, [id]);

  const grouped = useMemo(() => {
    const map: Record<Bucket, PaymentEntry[]> = { paid: [], owed: [], review: [], out: [] };
    for (const entry of entries) map[BUCKET[entry.payment_status] ?? "owed"].push(entry);
    return map;
  }, [entries]);

  const playing = grouped.paid.length + grouped.owed.length + grouped.review.length;
  const collected = grouped.paid.length * pricePerPlayer;
  const expected = playing * pricePerPlayer;
  const progress = expected > 0 ? Math.min(100, Math.round((collected / expected) * 100)) : 0;

  return (
    <div className="min-h-[100dvh] rondo-page">
      <PageHeader title="Payments" subtitle={title ?? undefined} back fallbackHref={`/organizer/games/${id}/manage`} />

      <div className="mx-auto max-w-lg space-y-6 px-4 py-5">
        <section className="rondo-surface p-4">
          <p className="rondo-label text-[var(--ink-low)]">Collected</p>
          <p className="mt-1 font-heading text-[32px] leading-none text-[var(--ink-hi)] tabular-nums">
            {formatPrice(collected)}
          </p>
          <p className="mt-1 text-sm text-[var(--ink-mid)]">
            of {formatPrice(expected)} from {playing} {playing === 1 ? "player" : "players"}
          </p>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[var(--bg-inset)]" aria-hidden>
            <div className="h-full rounded-full bg-[var(--ink-hi)] transition-[width] duration-500" style={{ width: `${progress}%` }} />
          </div>
          <dl className="mt-4 grid grid-cols-3 divide-x divide-[var(--stroke)] text-center">
            {[
              { label: "Paid", value: grouped.paid.length },
              { label: "To collect", value: grouped.owed.length },
              { label: "Needs you", value: grouped.review.length },
            ].map((stat) => (
              <div key={stat.label} className="px-2">
                <dt className="rondo-meta text-[var(--ink-low)]">{stat.label}</dt>
                <dd className="mt-0.5 font-heading text-xl text-[var(--ink-hi)] tabular-nums">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        {loading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-[var(--r-md)] bg-[var(--bg-surface)]" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="rondo-surface p-6 text-center">
            <p className="font-semibold text-[var(--ink-hi)]">No players yet</p>
            <p className="mt-1 text-sm text-[var(--ink-low)]">Payments show up here as people join.</p>
          </div>
        ) : (
          GROUPS.filter((group) => grouped[group.key].length > 0).map((group) => (
            <section key={group.key} className="space-y-2">
              <h2 className="rondo-label text-[var(--ink-low)]">
                {group.title} · {grouped[group.key].length}
              </h2>
              <ul className="divide-y divide-[var(--stroke)] overflow-hidden rounded-[var(--r-md)] border border-[var(--stroke)] bg-[var(--bg-surface)]">
                {grouped[group.key].map((entry) => (
                  <li key={entry.id} className="flex items-center gap-3 px-3 py-2.5">
                    {entry.profile ? (
                      <PlayerAvatar profile={entry.profile as Profile} size="sm" showFlag={false} />
                    ) : (
                      <span className="size-9 shrink-0 rounded-full bg-[var(--bg-inset)]" aria-hidden />
                    )}
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold text-[var(--ink-hi)]">
                      {entry.profile?.full_name ?? "Player"}
                    </span>
                    <span
                      className={cn(
                        "shrink-0 text-xs",
                        group.key === "paid" && "text-[var(--ok)]",
                        group.key === "review" && "font-semibold text-[var(--ink-hi)]",
                        (group.key === "owed" || group.key === "out") && "text-[var(--ink-low)]"
                      )}
                    >
                      {STATUS_LABEL[entry.payment_status] ?? entry.payment_status}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}

        {grouped.review.length > 0 && (
          <p className="text-sm text-[var(--ink-low)]">
            Approve payments and refunds from the roster on the match&apos;s manage screen.
          </p>
        )}
      </div>
    </div>
  );
}
