"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, MapPin, Trophy } from "@phosphor-icons/react";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils/format";
import { PageHeader } from "@/components/layout/PageHeader";
import { MatchesSwitcher } from "@/components/layout/MatchesSwitcher";
import { cn } from "@/lib/utils";
import { EmptyState, RondoButton } from "@/components/rondo/primitives";
import Link from "next/link";

interface MyGame {
  id: string;
  game_id: string;
  payment_status: string;
  joined_at: string;
  game: {
    id: string;
    title: string;
    venue_name: string;
    date_time: string;
    price_per_player: number;
    status: string;
    format: string;
  };
}

interface MyTournament {
  teamId: string;
  teamName: string;
  tournament: {
    id: string;
    name: string;
    status: string;
    starts_at: string;
  };
}

const TOURNAMENT_STATUS_LABEL: Record<string, string> = {
  registration: "Registration open",
  active: "Live",
  completed: "Completed",
  cancelled: "Cancelled",
};

function TournamentRow({ entry }: { entry: MyTournament }) {
  const live = entry.tournament.status === "active";
  return (
    <Link
      href={`/tournaments/${entry.tournament.id}`}
      className="flex min-h-16 items-center gap-3 px-4 py-3 transition-colors active:bg-[var(--bg-inset)]"
    >
      <span className="grid size-11 shrink-0 place-items-center rounded-[var(--r-pill)] bg-[var(--gold-dim)] text-[var(--gold)]">
        <Trophy size={20} weight="duotone" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate rondo-body font-bold text-[var(--ink-hi)]">{entry.tournament.name}</span>
        <span className="block truncate rondo-meta text-[var(--ink-low)]">Playing as {entry.teamName}</span>
      </span>
      <span
        className={cn(
          "inline-flex shrink-0 items-center gap-1.5 rounded-[var(--r-pill)] px-2.5 py-1 rondo-label",
          live ? "bg-[color-mix(in_oklch,var(--live)_16%,transparent)] text-[var(--live)]" : "bg-[var(--bg-inset)] text-[var(--ink-low)]"
        )}
      >
        {live && <span className="rondo-live-dot" aria-hidden />}
        {TOURNAMENT_STATUS_LABEL[entry.tournament.status] ?? entry.tournament.status}
      </span>
    </Link>
  );
}

type StatusTone = "ok" | "gold" | "muted" | "live";

function matchStatus(entry: MyGame): { label: string; tone: StatusTone } {
  const status = entry.payment_status;
  if (entry.game.status === "cancelled") return { label: "Match cancelled", tone: "live" };
  if (status === "paid" || status === "approved") return { label: "You're in", tone: "ok" };
  if (status === "venue") return { label: "Pay at venue", tone: "muted" };
  if (status === "pending_approval") return { label: "Awaiting approval", tone: "muted" };
  if (["reserved", "pending_payment", "pending"].includes(status)) return { label: "Pay to confirm", tone: "gold" };
  if (status === "rejected") return { label: "Not approved", tone: "live" };
  if (status === "refunded") return { label: "Refunded", tone: "muted" };
  if (status === "no_show") return { label: "No-show", tone: "live" };
  if (status === "cancelled") return { label: "Cancelled", tone: "live" };
  return { label: status.replaceAll("_", " "), tone: "muted" };
}

const TONE_CLASS: Record<StatusTone, string> = {
  ok: "bg-[color-mix(in_oklch,var(--ok)_16%,transparent)] text-[var(--ok)]",
  gold: "bg-[var(--gold)] text-[var(--gold-ink)]",
  muted: "bg-[var(--bg-inset)] text-[var(--ink-mid)]",
  live: "bg-[color-mix(in_oklch,var(--live)_16%,transparent)] text-[var(--live)]",
};

function MatchRow({ entry, dimmed = false }: { entry: MyGame; dimmed?: boolean }) {
  const needsWalletPay = ["reserved", "pending_payment", "pending"].includes(entry.payment_status);
  const href = needsWalletPay ? `/games/${entry.game.id}/payment` : `/games/${entry.game.id}`;
  const kickoff = new Date(entry.game.date_time);
  const status = matchStatus(entry);

  return (
    <Link
      href={href}
      className={cn(
        "flex items-stretch overflow-hidden rounded-[var(--r-md)] border border-[var(--stroke)] bg-[var(--bg-surface)] transition-[transform,border-color] duration-200 active:scale-[0.98]",
        dimmed && "opacity-60"
      )}
    >
      <div className="flex w-16 shrink-0 flex-col items-center justify-center border-r border-dashed border-[var(--stroke)] bg-[var(--bg-inset)] py-3">
        <span className="rondo-label text-[var(--ink-low)]">{format(kickoff, "EEE")}</span>
        <span className="font-heading text-[1.75rem] font-bold leading-none tabular-nums text-[var(--ink-hi)]">
          {format(kickoff, "d")}
        </span>
        <span className="rondo-label text-[var(--ink-low)]">{format(kickoff, "MMM")}</span>
      </div>
      <div className="min-w-0 flex-1 space-y-2 p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="line-clamp-2 rondo-body font-bold leading-tight text-[var(--ink-hi)]">{entry.game.title}</h3>
          <span className="shrink-0 font-heading text-base font-bold tabular-nums text-[var(--ink-hi)]">
            {entry.game.price_per_player === 0 ? "Free" : formatPrice(entry.game.price_per_player)}
          </span>
        </div>
        <p className="flex items-center gap-1.5 truncate rondo-meta text-[var(--ink-low)]">
          <Clock size={13} aria-hidden className="shrink-0" />
          {format(kickoff, "h:mm a")}
          <span aria-hidden>·</span>
          <MapPin size={13} aria-hidden className="shrink-0" />
          <span className="truncate">{entry.game.venue_name}</span>
        </p>
        <div className="flex items-center gap-2">
          <span className={cn("inline-flex h-6 items-center rounded-[var(--r-pill)] px-2.5 rondo-label", TONE_CLASS[status.tone])}>
            {status.label}
          </span>
          <span className="rondo-label text-[var(--ink-low)]">{entry.game.format}</span>
        </div>
      </div>
    </Link>
  );
}

function Section({ label, count, children }: { label: string; count: number; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 flex items-center gap-2 rondo-label text-[var(--ink-low)]">
        {label}
        <span className="tabular-nums text-[var(--ink-mid)]">{count}</span>
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

export default function MyMatchesPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<MyGame[]>([]);
  const [tournamentEntries, setTournamentEntries] = useState<MyTournament[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient();
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) {
          router.push("/login");
          return;
        }
        const uid = userData.user.id;

        const [{ data }, { data: captainRows }, { data: memberRows }] = await Promise.all([
          supabase
            .from("game_players")
            .select(
              "id, game_id, payment_status, joined_at, game:games(id, title, venue_name, date_time, price_per_player, status, format)"
            )
            .eq("user_id", uid)
            .order("joined_at", { ascending: false }),
          // Registered captains + rostered players both count as "on" a team —
          // this page previously only ever knew about pickup games.
          supabase
            .from("tournament_teams")
            .select("id, name, tournament:tournaments(id, name, status, starts_at)")
            .eq("captain_id", uid)
            .eq("status", "registered")
            .eq("is_managed", false),
          supabase
            .from("tournament_team_members")
            .select("team_id, team:tournament_teams(id, name), tournament:tournaments(id, name, status, starts_at)")
            .eq("user_id", uid),
        ]);

        setEntries((data as unknown as MyGame[]) ?? []);

        const captainEntries: MyTournament[] = (
          (captainRows as { id: string; name: string; tournament: MyTournament["tournament"] | null }[] | null) ?? []
        )
          .filter((row) => row.tournament)
          .map((row) => ({ teamId: row.id, teamName: row.name, tournament: row.tournament! }));

        const memberEntries: MyTournament[] = (
          (memberRows as
            | {
                team_id: string;
                team: { id: string; name: string } | null;
                tournament: MyTournament["tournament"] | null;
              }[]
            | null) ?? []
        )
          .filter((row) => row.tournament && row.team)
          .map((row) => ({ teamId: row.team_id, teamName: row.team!.name, tournament: row.tournament! }));

        const seen = new Set<string>();
        const mergedTournaments: MyTournament[] = [];
        for (const entry of [...captainEntries, ...memberEntries]) {
          if (seen.has(entry.tournament.id)) continue;
          seen.add(entry.tournament.id);
          mergedTournaments.push(entry);
        }
        mergedTournaments.sort(
          (a, b) => new Date(b.tournament.starts_at).getTime() - new Date(a.tournament.starts_at).getTime()
        );
        setTournamentEntries(mergedTournaments);
      } catch {
        setEntries([]);
        setTournamentEntries([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  const now = new Date();

  // Build mutually exclusive sections by priority so entries don't appear twice.
  const cancelled = entries.filter((e) =>
    e.game.status === "cancelled" || ["cancelled", "rejected", "refunded"].includes(e.payment_status)
  );
  const cancelledIds = new Set(cancelled.map((e) => e.id));

  const pendingApproval = entries.filter(
    (e) => !cancelledIds.has(e.id) && e.payment_status === "pending_approval"
  );
  const pendingApprovalIds = new Set(pendingApproval.map((e) => e.id));

  // "Needs payment" — future games where payment action is still required.
  // "venue" status means the player confirmed pay-at-venue, so it's NOT unpaid.
  const reservedUnpaid = entries.filter(
    (e) =>
      !cancelledIds.has(e.id) &&
      !pendingApprovalIds.has(e.id) &&
      new Date(e.game.date_time) >= now &&
      ["reserved", "pending_payment", "pending"].includes(e.payment_status)
  );
  const reservedUnpaidIds = new Set(reservedUnpaid.map((e) => e.id));

  const upcoming = entries.filter(
    (e) =>
      !cancelledIds.has(e.id) &&
      !pendingApprovalIds.has(e.id) &&
      !reservedUnpaidIds.has(e.id) &&
      new Date(e.game.date_time) >= now
  );

  const completed = entries.filter(
    (e) =>
      !cancelledIds.has(e.id) &&
      new Date(e.game.date_time) < now &&
      ["paid", "approved", "venue"].includes(e.payment_status) &&
      e.game.status === "completed"
  );
  const completedIds = new Set(completed.map((e) => e.id));

  const past = entries.filter(
    (e) =>
      !cancelledIds.has(e.id) &&
      !completedIds.has(e.id) &&
      new Date(e.game.date_time) < now
  );

  return (
    <div className="min-h-[100dvh] rondo-page">
      <PageHeader title="Matches">
        <MatchesSwitcher />
      </PageHeader>

      <div className="mx-auto max-w-lg space-y-8 px-4 py-6">
        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-28 rounded-[var(--r-md)] rondo-shimmer" />
            ))}
          </div>
        ) : entries.length === 0 && tournamentEntries.length === 0 ? (
          <EmptyState
            imageSrc="/scenes/boots-on-the-line.jpg"
            title="Nothing booked yet"
            body="Join a pickup match or enter a tournament. Every booking, payment, and result lives here."
            action={<RondoButton href="/feed">Find a match</RondoButton>}
            className="py-8"
          />
        ) : (
          <>
            {reservedUnpaid.length > 0 && (
              <Section label="Needs payment" count={reservedUnpaid.length}>
                {reservedUnpaid.map((e) => <MatchRow key={`reserved-${e.id}`} entry={e} />)}
              </Section>
            )}
            {upcoming.length > 0 && (
              <Section label="Upcoming" count={upcoming.length}>
                {upcoming.map((e) => <MatchRow key={e.id} entry={e} />)}
              </Section>
            )}
            {pendingApproval.length > 0 && (
              <Section label="Awaiting approval" count={pendingApproval.length}>
                {pendingApproval.map((e) => <MatchRow key={`pending-${e.id}`} entry={e} />)}
              </Section>
            )}
            {tournamentEntries.length > 0 && (
              <Section label="Your tournaments" count={tournamentEntries.length}>
                <div className="divide-y divide-[var(--stroke)] overflow-hidden rounded-[var(--r-md)] border border-[var(--stroke)] bg-[var(--bg-surface)]">
                  {tournamentEntries.map((e) => (
                    <TournamentRow key={e.tournament.id} entry={e} />
                  ))}
                </div>
              </Section>
            )}
            {completed.length > 0 && (
              <Section label="Played" count={completed.length}>
                {completed.map((e) => <MatchRow key={`completed-${e.id}`} entry={e} dimmed />)}
              </Section>
            )}
            {past.length > 0 && (
              <Section label="Past" count={past.length}>
                {past.map((e) => <MatchRow key={e.id} entry={e} dimmed />)}
              </Section>
            )}
            {cancelled.length > 0 && (
              <Section label="Cancelled" count={cancelled.length}>
                {cancelled.map((e) => <MatchRow key={`cancelled-${e.id}`} entry={e} dimmed />)}
              </Section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
