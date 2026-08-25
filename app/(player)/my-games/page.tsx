"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bookmark, Calendar, MapPin, Clock, Trophy } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatGameDate, formatPrice } from "@/lib/utils/format";
import { Badge } from "@/components/ui/badge";
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
  registration: "Open for teams",
  active: "Live",
  completed: "Completed",
  cancelled: "Cancelled",
};

function TournamentRow({ entry }: { entry: MyTournament }) {
  return (
    <Link href={`/tournaments/${entry.tournament.id}`} className="block cursor-pointer">
      <div className="rondo-surface p-4 hover:border-[var(--gold)]/30 active:scale-[0.98] transition-[transform,border-color] duration-200 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-[var(--ink-hi)] font-bold text-sm leading-tight flex-1">{entry.tournament.name}</h3>
          <Badge variant="secondary" className="text-xs h-5 shrink-0">
            {TOURNAMENT_STATUS_LABEL[entry.tournament.status] ?? entry.tournament.status}
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-[var(--ink-low)] text-xs">
          <Trophy size={11} />
          <span>Playing as {entry.teamName}</span>
        </div>
      </div>
    </Link>
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

  const paymentColor: Record<string, string> = {
    paid: "text-[var(--ok)]",
    venue: "text-yellow-400",
    pending: "text-[var(--ink-low)]",
    pending_payment: "text-blue-300",
    reserved: "text-[var(--gold)]",
    pending_approval: "text-blue-300",
    approved: "text-[var(--ok)]",
    rejected: "text-destructive",
    cancelled: "text-destructive",
    no_show: "text-destructive",
    refunded: "text-destructive",
  };

  function MatchRow({ entry }: { entry: MyGame }) {
    const needsWalletPay = ["reserved", "pending_payment", "pending"].includes(entry.payment_status);
    const href = needsWalletPay
      ? `/games/${entry.game.id}/payment`
      : `/games/${entry.game.id}`;

    return (
      <Link href={href} className="block cursor-pointer">
        <div className="rondo-surface p-4 hover:border-[var(--gold)]/30 active:scale-[0.98] transition-[transform,border-color] duration-200 space-y-2">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-[var(--ink-hi)] font-bold text-sm leading-tight flex-1">{entry.game.title}</h3>
            <span className="text-[var(--gold)] font-black text-sm whitespace-nowrap">{formatPrice(entry.game.price_per_player)}</span>
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-[var(--ink-low)] text-xs">
              <Calendar size={11} />
              <span>{formatGameDate(entry.game.date_time)}</span>
            </div>
            <div className="flex items-center gap-2 text-[var(--ink-low)] text-xs">
              <MapPin size={11} />
              <span>{entry.game.venue_name}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="text-xs h-5">{entry.game.format}</Badge>
            <span className={`text-xs font-semibold capitalize ${paymentColor[entry.payment_status] ?? "text-[var(--ink-low)]"}`}>
              {entry.payment_status === "venue"
                ? "Pay at Venue"
                : needsWalletPay
                  ? "Pay with wallet"
                  : entry.payment_status}
            </span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <div className="min-h-[100dvh] rondo-page pb-20">
      <header className="sticky top-0 rondo-glass-nav border-b border-[var(--stroke)] z-40 px-4 py-3">
        <div className="flex items-center gap-2.5 max-w-lg mx-auto">
          <Bookmark size={18} className="text-[var(--gold)]" />
          <h1 className="text-[var(--ink-hi)] font-black text-lg">My Matches</h1>
        </div>
      </header>

      <div className="px-4 py-5 space-y-8 max-w-lg mx-auto">
        {loading ? (
          <div className="space-y-3">
            {[0,1,2].map((i) => <div key={i} className="h-24 bg-[var(--bg-surface)] border border-[var(--stroke)] rounded-[var(--r-md)] animate-pulse" />)}
          </div>
        ) : entries.length === 0 && tournamentEntries.length === 0 ? (
          <div className="rondo-surface px-4">
            <EmptyState
              title="No matches yet"
              body="Join a match from the feed or map and it shows up here."
              imageSrc="/feed/hero-coach.jpg"
              imageAlt=""
              action={<RondoButton href="/feed">Browse matches</RondoButton>}
            />
          </div>
        ) : (
          <>
            {tournamentEntries.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <Trophy size={14} className="text-[var(--gold)]" />
                  <h2 className="text-[var(--ink-low)] text-xs font-semibold uppercase tracking-wider">
                    Tournaments ({tournamentEntries.length})
                  </h2>
                </div>
                {tournamentEntries.map((e) => (
                  <TournamentRow key={e.tournament.id} entry={e} />
                ))}
              </section>
            )}
            {upcoming.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-[var(--gold)]" />
                  <h2 className="text-[var(--ink-low)] text-xs font-semibold uppercase tracking-wider">Upcoming ({upcoming.length})</h2>
                </div>
                {upcoming.map((e) => <MatchRow key={e.id} entry={e} />)}
              </section>
            )}
            {pendingApproval.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-[var(--ink-low)] text-xs font-semibold uppercase tracking-wider">Pending Approval ({pendingApproval.length})</h2>
                {pendingApproval.map((e) => <MatchRow key={`pending-${e.id}`} entry={e} />)}
              </section>
            )}
            {reservedUnpaid.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-[var(--ink-low)] text-xs font-semibold uppercase tracking-wider">Reserved / Unpaid ({reservedUnpaid.length})</h2>
                {reservedUnpaid.map((e) => <MatchRow key={`reserved-${e.id}`} entry={e} />)}
              </section>
            )}
            {completed.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-[var(--ink-low)] text-xs font-semibold uppercase tracking-wider">Completed ({completed.length})</h2>
                {completed.map((e) => <MatchRow key={`completed-${e.id}`} entry={e} />)}
              </section>
            )}
            {cancelled.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-[var(--ink-low)] text-xs font-semibold uppercase tracking-wider">Cancelled ({cancelled.length})</h2>
                {cancelled.map((e) => <MatchRow key={`cancelled-${e.id}`} entry={e} />)}
              </section>
            )}
            {past.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-[var(--ink-low)] text-xs font-semibold uppercase tracking-wider">Past ({past.length})</h2>
                {past.map((e) => <MatchRow key={e.id} entry={e} />)}
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
