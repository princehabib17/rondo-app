"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import {
  ArrowUpRight,
  CalendarBlank,
  CaretRight,
  CheckCircle,
  MapPin,
  Megaphone,
  ShareNetwork,
  Timer,
} from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import { isGuestUser } from "@/lib/auth/is-guest";
import { MatchTeamsRoster } from "@/components/match/MatchTeamsRoster";
import { MatchRulesPanel } from "@/components/match/MatchRulesPanel";
import { formatPrice } from "@/lib/utils/format";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState, RondoButton } from "@/components/rondo/primitives";
import { GameBadges } from "@/components/feed/GameBadges";
import { PUBLIC_PROFILE_SELECT } from "@/lib/supabase/profile-select";
import {
  getMatchStatusBanner,
  resolveJoinCta,
  spotsLeft,
} from "@/lib/match/rules";
import type { Game, GamePlayer } from "@/lib/supabase/types";
import { matchHeroImage } from "@/lib/venues/pitch-photos";

export default function MatchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [game, setGame] = useState<Game | null>(null);
  const [gamesHosted, setGamesHosted] = useState(0);
  const [loading, setLoading] = useState(true);
  const [myEntry, setMyEntry] = useState<GamePlayer | null>(null);
  const [onWaitlist, setOnWaitlist] = useState(false);
  const [leavingWaitlist, setLeavingWaitlist] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      setCurrentUserId(userData.user?.id ?? null);
      setIsGuest(isGuestUser(userData.user));

      const { data } = await supabase
        .from("games")
        .select(
          `
          *,
          organizer:profiles!organizer_id(${PUBLIC_PROFILE_SELECT}),
          teams(id, name, color, slot_number,
            game_players:game_players(id, user_id, profile:profiles(id, avatar_url, nationality))
          ),
          game_players(id, user_id, team_id, payment_status)
        `
        )
        .eq("id", id)
        .single();

      if (data) {
        const g = data as Game;
        setGame(g);
        if (userData.user?.id) {
          const entry = (g.game_players as GamePlayer[]).find(
            (gp) => gp.user_id === userData.user!.id
          );
          setMyEntry(entry ?? null);

          const { data: wl } = await supabase
            .from("game_waitlist")
            .select("id")
            .eq("game_id", id)
            .eq("user_id", userData.user.id)
            .eq("status", "waiting")
            .maybeSingle();
          setOnWaitlist(Boolean(wl));
        }

        const { count } = await supabase
          .from("games")
          .select("id", { count: "exact", head: true })
          .eq("organizer_id", g.organizer_id)
          .neq("status", "cancelled");
        setGamesHosted(count ?? 0);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[100dvh] rondo-page">
        <div className="aspect-[16/11] w-full rondo-shimmer" />
        <div className="mx-auto max-w-lg space-y-4 p-4">
          <div className="h-16 rounded-[var(--r-md)] rondo-shimmer" />
          <div className="h-32 rounded-[var(--r-md)] rondo-shimmer" />
          <div className="h-40 rounded-[var(--r-md)] rondo-shimmer" />
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-[100dvh] rondo-page">
        <PageHeader title="Match" back fallbackHref="/feed" />
        <div className="mx-auto max-w-lg px-4 py-12">
          <EmptyState
            title="Match not found"
            body="It may have been cancelled or the link is old. Plenty more are on tonight."
            action={<RondoButton href="/feed">Find a match</RondoButton>}
          />
        </div>
      </div>
    );
  }

  const banner = getMatchStatusBanner(game);
  const hero = matchHeroImage(game);
  const cta = resolveJoinCta({
    game,
    myEntry,
    isGuest,
    hasUser: Boolean(currentUserId),
    onWaitlist,
  });
  const left = spotsLeft(game);
  const filled = game.max_players - left;
  const spotOpenForWaitlist = onWaitlist && !myEntry && left > 0;
  const kickoff = new Date(game.date_time);
  const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    [game.venue_name, game.venue_address].filter(Boolean).join(", ")
  )}`;

  async function leaveWaitlist() {
    setLeavingWaitlist(true);
    try {
      const res = await fetch(`/api/matches/waitlist?gameId=${id}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? "Could not leave waitlist");
      }
      setOnWaitlist(false);
    } catch {
      // silent: user can retry
    } finally {
      setLeavingWaitlist(false);
    }
  }

  return (
    <div className="min-h-[100dvh] rondo-page">
      <PageHeader
        title={game.title}
        back
        fallbackHref="/feed"
        trailing={
          currentUserId && !isGuest ? (
            <Link
              href={`/games/${game.id}/invite`}
              aria-label="Invite friends"
              className="grid size-11 place-items-center rounded-[var(--r-pill)] text-[var(--ink-hi)] hover:bg-[var(--bg-inset)]"
            >
              <ShareNetwork size={20} weight="bold" aria-hidden />
            </Link>
          ) : null
        }
      />

      <section className="relative isolate">
        <div className="relative aspect-[16/11] w-full overflow-hidden bg-[var(--bg-inset)]">
          <img src={hero.src} alt={hero.alt} className="h-full w-full object-cover" />
          <div
            aria-hidden
            className="absolute inset-0 bg-[linear-gradient(180deg,transparent_30%,color-mix(in_oklch,var(--bg-page)_70%,transparent)_70%,var(--bg-page)_100%)]"
          />
        </div>
        <div className="relative -mt-24 px-4">
          <div className="mx-auto max-w-lg">
            <GameBadges game={game} showStatus />
            <h2 className="mt-3 font-heading text-[2rem] font-bold uppercase leading-[0.95] tracking-[0.01em] text-[var(--ink-hi)] [text-wrap:balance]">
              {game.title}
            </h2>
            <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 rondo-meta text-[var(--ink-mid)]">
              <span className="inline-flex items-center gap-1.5">
                <CalendarBlank size={15} className="text-[var(--ink-low)]" aria-hidden />
                {format(kickoff, "EEEE, MMM d")}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin size={15} className="text-[var(--ink-low)]" aria-hidden />
                {game.venue_name}
              </span>
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-lg space-y-6 px-4 py-6">
        <dl className="grid grid-cols-3 divide-x divide-[var(--stroke)] overflow-hidden rounded-[var(--r-md)] border border-[var(--stroke)] bg-[var(--bg-surface)]">
          <div className="px-3 py-3">
            <dt className="rondo-label text-[var(--ink-low)]">Kickoff</dt>
            <dd className="mt-1 font-heading text-xl font-bold leading-6 tabular-nums text-[var(--ink-hi)]">
              {format(kickoff, "h:mm a")}
            </dd>
          </div>
          <div className="px-3 py-3">
            <dt className="rondo-label text-[var(--ink-low)]">Spots</dt>
            <dd className="mt-1 font-heading text-xl font-bold leading-6 tabular-nums text-[var(--ink-hi)]">
              {left > 0 ? `${left} left` : "Full"}
            </dd>
          </div>
          <div className="px-3 py-3">
            <dt className="rondo-label text-[var(--ink-low)]">Per player</dt>
            <dd className="mt-1 font-heading text-xl font-bold leading-6 tabular-nums text-[var(--gold)]">
              {game.price_per_player === 0 ? "Free" : formatPrice(game.price_per_player)}
            </dd>
          </div>
        </dl>

        <div>
          <div className="h-1.5 overflow-hidden rounded-[var(--r-pill)] bg-[var(--bg-inset)]">
            <div
              className="h-full rounded-[var(--r-pill)] bg-[var(--ink-hi)]"
              style={{ width: `${Math.min(100, Math.round((filled / Math.max(game.max_players, 1)) * 100))}%` }}
            />
          </div>
          <p className="mt-2 rondo-meta text-[var(--ink-low)]">
            {filled} of {game.max_players} players in
          </p>
        </div>

        {banner && (
          <div
            className={cn(
              "rounded-[var(--r-md)] border px-4 py-3 rondo-body",
              banner.tone === "error"
                ? "border-[color-mix(in_oklch,var(--live)_40%,transparent)] bg-[color-mix(in_oklch,var(--live)_10%,transparent)] text-[var(--live)]"
                : "border-[var(--stroke)] bg-[var(--bg-surface)] text-[var(--ink-mid)]"
            )}
          >
            {banner.text}
          </div>
        )}

        {myEntry && (
          <div className="flex items-center gap-3 rounded-[var(--r-md)] border border-[color-mix(in_oklch,var(--ok)_35%,var(--stroke))] bg-[color-mix(in_oklch,var(--ok)_8%,transparent)] p-4">
            <CheckCircle size={22} weight="fill" className="shrink-0 text-[var(--ok)]" aria-hidden />
            <div className="min-w-0">
              <p className="rondo-body font-bold text-[var(--ink-hi)]">You have a spot</p>
              <p className="rondo-meta text-[var(--ink-low)]">{describeEntry(myEntry.payment_status)}</p>
            </div>
          </div>
        )}

        {onWaitlist && !myEntry && (
          <div className="space-y-3 rounded-[var(--r-md)] border border-[color-mix(in_oklch,var(--gold)_30%,var(--stroke))] bg-[var(--gold-dim)] p-4">
            {spotOpenForWaitlist ? (
              <>
                <p className="rondo-body font-bold text-[var(--gold)]">A spot just opened. Claim it before someone else does.</p>
                <p className="rondo-meta text-[var(--ink-low)]">Everyone on the waitlist was notified. First to accept gets in.</p>
              </>
            ) : (
              <>
                <p className="rondo-body font-bold text-[var(--ink-hi)]">You&apos;re on the waitlist</p>
                <p className="rondo-meta text-[var(--ink-low)]">
                  When a spot opens, everyone gets notified. First to accept gets in.
                </p>
              </>
            )}
            <button
              type="button"
              onClick={leaveWaitlist}
              disabled={leavingWaitlist}
              className="rondo-meta font-bold text-[var(--ink-mid)] underline underline-offset-2 hover:text-[var(--ink-hi)] disabled:opacity-50"
            >
              {leavingWaitlist ? "Leaving..." : "Leave waitlist"}
            </button>
          </div>
        )}

        <MatchRulesPanel game={game} organizer={game.organizer} gamesHosted={gamesHosted} />

        <section className="space-y-3">
          <h3 className="rondo-label text-[var(--ink-low)]">Venue</h3>
          <a
            href={mapsHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-16 items-center gap-3 rounded-[var(--r-md)] border border-[var(--stroke)] bg-[var(--bg-surface)] px-4 py-3 transition-transform active:scale-[0.98]"
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-[var(--r-pill)] bg-[var(--bg-inset)] text-[var(--ink-hi)]">
              <MapPin size={18} aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate rondo-body font-bold text-[var(--ink-hi)]">{game.venue_name}</span>
              {game.venue_address && (
                <span className="block truncate rondo-meta text-[var(--ink-low)]">{game.venue_address}</span>
              )}
            </span>
            <span className="inline-flex shrink-0 items-center gap-1 rondo-meta font-bold text-[var(--ink-mid)]">
              Directions
              <ArrowUpRight size={14} aria-hidden />
            </span>
          </a>
        </section>

        <MatchTeamsRoster game={game} />

        <Link
          href={`/games/${game.id}/timer`}
          className="flex min-h-16 items-center gap-3 rounded-[var(--r-md)] border border-[var(--stroke)] bg-[var(--bg-surface)] px-4 py-3 transition-transform active:scale-[0.98]"
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-[var(--r-pill)] bg-[var(--bg-inset)] text-[var(--ink-hi)]">
            <Timer size={18} aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block rondo-body font-bold text-[var(--ink-hi)]">Match timer</span>
            <span className="block truncate rondo-meta text-[var(--ink-low)]">Round clock, current matchup, next rotation</span>
          </span>
          <CaretRight size={16} className="shrink-0 text-[var(--ink-low)]" aria-hidden />
        </Link>
      </div>

      {/* Pushed screen: the tab bar steps aside, so this bar owns the bottom edge. */}
      <div className="fixed inset-x-0 bottom-0 z-30 rondo-sticky-action pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto flex max-w-lg gap-2 px-4 py-3">
          <Link
            href={`/games/${game.id}/room`}
            className="flex min-h-12 min-w-16 flex-col items-center justify-center gap-0.5 rounded-[var(--r-md)] bg-[var(--bg-inset)] text-[var(--ink-hi)]"
            aria-label="Organizer room"
          >
            <Megaphone size={18} aria-hidden />
            <span className="rondo-label text-[0.625rem] text-[var(--ink-mid)]">Room</span>
          </Link>

          {cta.action === "disabled" ? (
            <div className="flex min-h-12 flex-1 flex-col justify-center rounded-[var(--r-md)] bg-[var(--bg-inset)] px-4 py-2">
              <p className="rondo-body font-bold text-[var(--ink-hi)]">{cta.label}</p>
              <p className="rondo-meta text-[var(--ink-low)]">{cta.reason}</p>
            </div>
          ) : (
            <Link href={cta.href!} className="rondo-btn rondo-btn-primary flex-1">
              {cta.label}
              {cta.action !== "login" && cta.action !== "signup" && <CaretRight size={18} weight="bold" aria-hidden />}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function describeEntry(status: string): string {
  switch (status) {
    case "paid":
    case "approved":
      return "Paid and confirmed. See you on the pitch.";
    case "venue":
      return "Pay the organizer at the venue on match day.";
    case "pending_approval":
      return "Waiting for the organizer to approve you.";
    case "reserved":
    case "pending":
    case "pending_payment":
      return "Reserved. Pay from your wallet to lock it in.";
    default:
      return status.replaceAll("_", " ");
  }
}
