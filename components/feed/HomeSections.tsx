"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, MapPin, Trophy } from "@phosphor-icons/react";
import { matchHeroImage } from "@/lib/venues/pitch-photos";
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
    <div className="mb-1 flex items-center justify-between gap-3">
      <h2 className="rondo-label text-[var(--ink-low)]">{label}</h2>
      {href && (
        <Link href={href} className="inline-flex min-h-11 items-center gap-1 rondo-meta font-bold text-[var(--ink-mid)] hover:text-[var(--ink-hi)]">
          {hrefLabel}
          <ArrowRight size={13} weight="bold" aria-hidden />
        </Link>
      )}
    </div>
  );
}

function dayLabel(dateString: string): string {
  const d = new Date(dateString);
  if (isToday(d)) return "Today";
  if (isTomorrow(d)) return "Tomorrow";
  return format(d, "EEE, MMM d");
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
        <EmptyState
          imageSrc="/scenes/center-spot.jpg"
          title="Nothing booked yet"
          body="Pick a match below or open the map. Your next kickoff lands here."
          action={<RondoButton href="/feed/map" variant="secondary">Open the map</RondoButton>}
          className="py-4"
        />
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
  const hero = matchHeroImage(game);
  const kickoff = new Date(game.date_time);

  return (
    <article className="overflow-hidden rounded-[var(--r-lg)] border border-[var(--stroke)] bg-[var(--bg-surface)]">
      <Link href={`/games/${game.id}`} className="relative block aspect-[16/11] overflow-hidden">
        <Image src={hero.src} alt={hero.alt} fill priority sizes="(max-width: 512px) 100vw, 512px" className="object-cover" />
        <div
          aria-hidden
          className="absolute inset-0 bg-[linear-gradient(180deg,color-mix(in_oklch,var(--bg-night)_45%,transparent)_0%,transparent_35%,color-mix(in_oklch,var(--bg-night)_92%,transparent)_100%)]"
        />
        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-4">
          <span className="rounded-[var(--r-pill)] bg-[color-mix(in_oklch,var(--bg-night)_70%,transparent)] px-3 py-1 rondo-label text-[var(--night-ink)] backdrop-blur-sm">
            {personal ? "Your next match" : "Open near you"}
          </span>
          <span className="rounded-[var(--r-pill)] bg-[color-mix(in_oklch,var(--bg-night)_70%,transparent)] px-3 py-1 rondo-label text-[var(--night-ink)] backdrop-blur-sm">
            {countdownChip(game.date_time)}
          </span>
        </div>
        <div className="absolute inset-x-0 bottom-0 p-4">
          <p className="font-heading text-[2.75rem] font-bold leading-none tabular-nums text-[var(--night-ink)]">
            {format(kickoff, "h:mm")}
            <span className="ml-1 text-xl">{format(kickoff, "a")}</span>
          </p>
          <h3 className="mt-2 line-clamp-2 font-heading text-xl font-bold uppercase leading-tight text-[var(--night-ink)]">
            {game.title}
          </h3>
          <p className="mt-1 flex items-center gap-1.5 truncate rondo-meta text-[color-mix(in_oklch,var(--night-ink)_78%,transparent)]">
            <MapPin size={14} aria-hidden />
            {dayLabel(game.date_time)} · {game.venue_name}
          </p>
        </div>
      </Link>
      <div className="flex items-center gap-3 p-4">
        <div className="min-w-0 flex-1">
          <p className="font-heading text-xl font-bold leading-none tabular-nums text-[var(--ink-hi)]">
            {game.price_per_player === 0 ? "Free" : formatPrice(game.price_per_player)}
          </p>
          <p className="mt-1 rondo-meta text-[var(--ink-low)]">
            {spotsLeft > 0 ? `${spotsLeft} of ${game.max_players} spots left` : "Full · join the waitlist"}
          </p>
        </div>
        <RondoButton href={`/games/${game.id}`} className="w-auto shrink-0">
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
  const live = tournament.status === "active";
  const eyebrow = personal
    ? live
      ? "Your live tournament"
      : "Your next tournament"
    : live
      ? "Live tournament"
      : "Tournament spotlight";

  return (
    <article className="overflow-hidden rounded-[var(--r-lg)] border border-[var(--stroke)] bg-[var(--bg-surface)]">
      <Link href={`/tournaments/${tournament.id}`} className="relative block aspect-[16/11] overflow-hidden">
        <Image
          src={live ? "/scenes/night-pitch.jpg" : "/scenes/champion-trophy.jpg"}
          alt=""
          fill
          priority
          sizes="(max-width: 512px) 100vw, 512px"
          className={cn("object-cover", !live && "object-[50%_30%]")}
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-[linear-gradient(180deg,color-mix(in_oklch,var(--bg-night)_45%,transparent)_0%,transparent_35%,color-mix(in_oklch,var(--bg-night)_92%,transparent)_100%)]"
        />
        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-4">
          <span className="rounded-[var(--r-pill)] bg-[color-mix(in_oklch,var(--bg-night)_70%,transparent)] px-3 py-1 rondo-label text-[var(--night-ink)] backdrop-blur-sm">
            {eyebrow}
          </span>
          {live && (
            <span className="inline-flex items-center gap-2 rounded-[var(--r-pill)] bg-[var(--live)] px-3 py-1 rondo-label text-[var(--night-ink)]">
              <span className="size-1.5 rounded-[var(--r-pill)] bg-[var(--night-ink)]" aria-hidden />
              Live
            </span>
          )}
        </div>
        <div className="absolute inset-x-0 bottom-0 p-4">
          <h3 className="line-clamp-2 font-heading text-[2.25rem] font-bold uppercase leading-[0.95] text-[var(--night-ink)]">
            {tournament.name}
          </h3>
          <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 rondo-meta text-[color-mix(in_oklch,var(--night-ink)_78%,transparent)]">
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={14} aria-hidden />
              {tournament.venue_name ?? "Venue TBC"}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Trophy size={14} aria-hidden />
              {teamCount} teams
            </span>
          </p>
        </div>
      </Link>
      <div className="flex items-center gap-3 p-4">
        <p className="min-w-0 flex-1 rondo-meta text-[var(--ink-low)]">{kickoffLabel(tournament.starts_at)}</p>
        <RondoButton href={`/tournaments/${tournament.id}`} className="w-auto shrink-0">
          {live ? "Follow live" : personal ? "Open tournament" : "View tournament"}
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
          {games.slice(0, 5).map((game) => (
            <NearbyGameRow key={game.id} game={game} />
          ))}
          <Link
            href="/feed/map"
            className="mt-1 inline-flex min-h-11 items-center gap-1.5 rondo-meta font-bold text-[var(--ink-mid)] hover:text-[var(--ink-hi)]"
          >
            Open street map
            <ArrowRight size={14} weight="bold" aria-hidden />
          </Link>
        </div>
      ) : (
        <div className="rounded-[var(--r-md)] border border-dashed border-[var(--stroke)] px-4 py-6 text-center">
          <p className="rondo-body font-bold text-[var(--ink-hi)]">Quiet around here tonight</p>
          <p className="mt-1 rondo-meta text-[var(--ink-low)]">New matches post every day. Finished cups live under Matches.</p>
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
