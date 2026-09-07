"use client";

import Link from "next/link";
import { ArrowRight, CalendarBlank, MapPin, Trophy } from "@phosphor-icons/react";
import { format, formatDistanceToNowStrict, isToday, isTomorrow } from "date-fns";
import type { Game, Tournament } from "@/lib/supabase/types";
import type { HomeNextUp, RecentMatchRow } from "@/lib/feed/home-queries";
import { TournamentCard } from "@/components/tournament/TournamentCard";
import { NearbyGameRow } from "@/components/feed/NearbyGamesSection";
import { EmptyState, RondoButton } from "@/components/rondo/primitives";
import { formatPrice } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

function SectionHeader({
  label,
  href,
  hrefLabel = "See all",
}: {
  label: string;
  href?: string;
  hrefLabel?: string;
}) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-3">
      <h2 className="rondo-label text-[var(--ink-low)]">{label}</h2>
      {href && (
        <Link href={href} className="rondo-meta font-bold text-[var(--gold)]">
          {hrefLabel}
        </Link>
      )}
    </div>
  );
}

function kickoffLabel(dateString: string): string {
  const d = new Date(dateString);
  const time = format(d, "h:mm a");
  if (isToday(d)) return `Today · ${time}`;
  if (isTomorrow(d)) return `Tomorrow · ${time}`;
  return `${format(d, "EEE, MMM d")} · ${time}`;
}

function countdownChip(dateString: string): string {
  const d = new Date(dateString);
  if (d.getTime() <= Date.now()) return "Starting";
  return `In ${formatDistanceToNowStrict(d, { addSuffix: false })}`;
}

export function NextUpSection({
  nextUp,
  fallbackGame,
}: {
  nextUp: HomeNextUp;
  fallbackGame: Game | null;
}) {
  const item =
    nextUp ??
    (fallbackGame ? ({ kind: "game", game: fallbackGame } as const) : null);

  return (
    <section className="px-4 pt-4">
      <SectionHeader label="Next up" href="/my-games" hrefLabel="My matches" />
      {!item ? (
        <div className="rondo-surface p-6">
          <EmptyState
            title="Nothing booked"
            body="Find an open match or join a tournament. Your next kickoff lands here."
            action={<RondoButton href="/tournaments">Browse tournaments</RondoButton>}
          />
        </div>
      ) : item.kind === "game" ? (
        <NextUpGameCard game={item.game} personal={Boolean(nextUp)} />
      ) : (
        <NextUpTournamentCard tournament={item.tournament} personal={Boolean(nextUp)} />
      )}
    </section>
  );
}

function NextUpGameCard({ game, personal }: { game: Game; personal: boolean }) {
  const playerCount = game.game_players?.length ?? 0;
  const spotsLeft = Math.max(0, game.max_players - playerCount);

  return (
    <article className="overflow-hidden rounded-[var(--r-lg)] border border-[var(--stroke)] bg-[var(--bg-surface)]">
      <div className="relative rondo-floodlight-scene px-5 pb-5 pt-6" data-variant="0">
        <p className="rondo-label text-[var(--gold)]">
          {personal ? "Your next match" : "Open nearby"}
        </p>
        <p className="mt-3 font-heading text-[2rem] font-bold uppercase leading-none tracking-[0.01em] text-[var(--ink-hi)] tabular-nums">
          {format(new Date(game.date_time), "h:mm a")}
        </p>
        <p className="mt-2 rondo-meta text-[var(--ink-mid)]">{kickoffLabel(game.date_time)}</p>
        <h3 className="mt-4 truncate font-heading text-xl font-bold uppercase text-[var(--ink-hi)]">
          {game.title}
        </h3>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 rondo-meta text-[var(--ink-low)]">
          <span className="inline-flex items-center gap-1">
            <MapPin size={14} weight="duotone" className="text-[var(--gold)]" aria-hidden />
            {game.venue_name}
          </span>
          <span className="inline-flex items-center gap-1">
            <CalendarBlank size={14} weight="duotone" className="text-[var(--gold)]" aria-hidden />
            {countdownChip(game.date_time)}
          </span>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-[var(--r-pill)] border border-[var(--stroke)] bg-[var(--bg-inset)] px-3 py-1 rondo-meta text-[var(--ink-mid)]">
            {playerCount}/{game.max_players}
            {spotsLeft > 0 ? ` · ${spotsLeft} open` : " · Full"}
          </span>
          <span className="rounded-[var(--r-pill)] bg-[var(--gold-dim)] px-3 py-1 rondo-meta font-bold text-[var(--gold)]">
            {game.price_per_player === 0 ? "Free" : formatPrice(game.price_per_player)}
          </span>
        </div>
      </div>
      <div className="border-t border-[var(--stroke)] p-4">
        <RondoButton href={`/games/${game.id}`}>
          {personal ? "Open match" : "View match"}
        </RondoButton>
      </div>
    </article>
  );
}

function NextUpTournamentCard({
  tournament,
  personal,
}: {
  tournament: Tournament;
  personal: boolean;
}) {
  const teamCount =
    tournament.tournament_teams?.filter((t) => t.status === "registered").length ?? 0;

  return (
    <article className="overflow-hidden rounded-[var(--r-lg)] border border-[color-mix(in_oklch,var(--gold)_28%,var(--stroke))] bg-[var(--bg-surface)]">
      <div className="relative rondo-floodlight-scene px-5 pb-5 pt-6" data-variant="1">
        <div className="flex items-center justify-between gap-3">
          <p className="rondo-label text-[var(--gold)]">
            {personal
              ? tournament.status === "active"
                ? "Your live tournament"
                : "Your next tournament"
              : tournament.status === "active"
                ? "Live tournament"
                : "Tournament spotlight"}
          </p>
          {tournament.status === "active" && (
            <span className="inline-flex items-center gap-1 rounded-[var(--r-pill)] border border-[var(--live)] bg-[color-mix(in_oklch,var(--live)_16%,transparent)] px-2.5 py-1 rondo-label text-[var(--live)]">
              <span className="rondo-live-dot" aria-hidden />
              Live
            </span>
          )}
        </div>
        <h3 className="mt-4 font-heading text-[1.75rem] font-bold uppercase leading-none tracking-[0.01em] text-[var(--ink-hi)]">
          {tournament.name}
        </h3>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 rondo-meta text-[var(--ink-low)]">
          <span className="inline-flex items-center gap-1">
            <MapPin size={14} weight="duotone" className="text-[var(--gold)]" aria-hidden />
            {tournament.venue_name}
          </span>
          <span className="inline-flex items-center gap-1">
            <Trophy size={14} weight="duotone" className="text-[var(--gold)]" aria-hidden />
            {teamCount}/{tournament.max_teams} teams
          </span>
        </div>
        <p className="mt-2 rondo-meta text-[var(--ink-mid)]">{kickoffLabel(tournament.starts_at)}</p>
      </div>
      <div className="border-t border-[var(--stroke)] p-4">
        <RondoButton href={`/tournaments/${tournament.id}`}>
          {tournament.status === "active" ? "Watch live" : personal ? "Open tournament" : "View tournament"}
        </RondoButton>
      </div>
    </article>
  );
}

export function YourTournamentsSection({ tournaments }: { tournaments: Tournament[] }) {
  if (tournaments.length === 0) return null;

  return (
    <section className="pt-8">
      <div className="px-4">
        <SectionHeader label="Your tournaments" href="/tournaments" />
      </div>
      <div className="-mx-0 flex gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
        {tournaments.map((tournament) => (
          <div key={tournament.id} className="w-[85%] max-w-sm shrink-0 sm:w-[320px]">
            <TournamentCard
              tournament={tournament}
              href={`/tournaments/${tournament.id}`}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

export function AroundYouSection({
  tournaments,
  games,
}: {
  tournaments: Tournament[];
  games: Game[];
}) {
  const showTournaments = tournaments.length > 0;
  const showGames = !showTournaments && games.length > 0;

  return (
    <section className="px-4 pb-10 pt-8">
      <SectionHeader
        label="Around you"
        href={showTournaments ? "/tournaments" : "/feed/map"}
        hrefLabel={showTournaments ? "All tournaments" : "Street map"}
      />
      {showTournaments ? (
        <div className="space-y-3">
          {tournaments.map((tournament) => (
            <TournamentCard
              key={tournament.id}
              tournament={tournament}
              href={`/tournaments/${tournament.id}`}
            />
          ))}
        </div>
      ) : showGames ? (
        <div className="space-y-2">
          {games.slice(0, 3).map((game) => (
            <NearbyGameRow key={game.id} game={game} />
          ))}
          <Link
            href="/feed/map"
            className="mt-2 inline-flex min-h-11 items-center gap-1.5 rondo-meta font-bold text-[var(--gold)]"
          >
            Open street map
            <ArrowRight size={14} weight="bold" aria-hidden />
          </Link>
        </div>
      ) : (
        <div className="rondo-surface p-6">
          <EmptyState
            title="Quiet around here"
            body="No open tournaments or matches nearby yet. Check back later or start one."
            action={<RondoButton href="/tournaments">Browse tournaments</RondoButton>}
          />
        </div>
      )}
    </section>
  );
}

export function RecentSection({ rows }: { rows: RecentMatchRow[] }) {
  if (rows.length === 0) return null;

  return (
    <section className="px-4 pb-4 pt-8">
      <SectionHeader label="Recent" href="/my-games" />
      <div className="overflow-hidden rounded-[var(--r-md)] border border-[var(--stroke)] bg-[var(--bg-surface)]">
        {rows.map((row, i) => (
          <Link
            key={row.id}
            href={`/games/${row.game.id}`}
            className={cn(
              "flex min-h-14 items-center gap-3 px-4 py-3 transition-colors active:bg-[var(--bg-inset)]",
              i > 0 && "border-t border-[var(--stroke)]"
            )}
          >
            <div className="min-w-0 flex-1">
              <p className="truncate rondo-body font-bold text-[var(--ink-hi)]">{row.game.title}</p>
              <p className="truncate rondo-meta text-[var(--ink-low)]">
                {format(new Date(row.game.date_time), "MMM d")} · {row.game.venue_name}
              </p>
            </div>
            <span className="shrink-0 font-heading text-sm font-bold tabular-nums text-[var(--gold)]">
              {row.game.price_per_player === 0 ? "Free" : formatPrice(row.game.price_per_player)}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
