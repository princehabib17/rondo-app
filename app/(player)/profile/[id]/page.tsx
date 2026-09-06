"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowDownLeft,
  ArrowUpRight,
  CalendarBlank,
  CaretRight,
  ChatCircle,
  MapPin,
  Medal,
  SoccerBall,
  Trophy,
  UserMinus,
  UserPlus,
  Wallet,
} from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import { isGuestUser } from "@/lib/auth/is-guest";
import { PUBLIC_PROFILE_SELECT } from "@/lib/supabase/profile-select";
import { formatGameDate, formatPrice, getFlagEmoji } from "@/lib/utils/format";
import type { Profile, PlayerReel, TournamentAward } from "@/lib/supabase/types";
import { Chip, StatTile } from "@/components/rondo/primitives";
import { PasskeyManager } from "@/components/auth/PasskeyManager";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

interface ProfileMatchEntry {
  id: string;
  payment_status: string;
  joined_at: string;
  game: {
    id: string;
    title: string;
    venue_name: string;
    date_time: string;
    price_per_player: number;
  } | null;
}

interface ProfileTournamentEntry {
  id: string;
  name: string;
  seed: number | null;
  tournament: {
    id: string;
    name: string;
    status: string;
    starts_at: string;
  } | null;
}

export default function PublicProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [gamesPlayed, setGamesPlayed] = useState(0);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [recentMatches, setRecentMatches] = useState<ProfileMatchEntry[]>([]);
  const [walletRows, setWalletRows] = useState<Array<{ amount: number; direction: "credit" | "debit"; source: string }>>([]);
  const [isGuest, setIsGuest] = useState(false);
  const [locationHidden, setLocationHidden] = useState(false);
  const [playerReels, setPlayerReels] = useState<PlayerReel[]>([]);
  const [trophyRows, setTrophyRows] = useState<ProfileTournamentEntry[]>([]);
  const [awards, setAwards] = useState<TournamentAward[]>([]);
  const [goalsScored, setGoalsScored] = useState(0);
  const [savingLocation, setSavingLocation] = useState(false);
  const [switchingRole, setSwitchingRole] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);

  async function switchRole() {
    if (!profile || switchingRole) return;
    const nextRole = profile.role === "organizer" ? "player" : "organizer";
    setSwitchingRole(true);
    setAccountError(null);
    try {
      const res = await fetch("/api/profile/switch-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: nextRole }),
      });
      const json = await res.json();
      if (!res.ok) {
        setAccountError(json.error ?? "Could not switch role");
        return;
      }
      // Full reload so the role-aware bottom nav picks up the new role.
      window.location.assign(nextRole === "organizer" ? "/organizer/dashboard" : "/feed");
    } finally {
      setSwitchingRole(false);
    }
  }

  async function deleteAccount() {
    if (deleting) return;
    setDeleting(true);
    setAccountError(null);
    try {
      const res = await fetch("/api/account/delete", { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        setAccountError(json.error ?? "Could not delete account");
        return;
      }
      const supabase = createClient();
      await supabase.auth.signOut();
      window.location.assign("/");
    } finally {
      setDeleting(false);
    }
  }

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id ?? null;
      setCurrentUserId(uid);
      setIsGuest(isGuestUser(userData.user));
      const isOwnProfile = uid === id;

      const profileSelect = isOwnProfile ? "*" : PUBLIC_PROFILE_SELECT;
      const [
        { data: profileData },
        { count },
        { data: followData },
        { data: matchesData },
        { data: walletData },
        { data: tournamentRows },
        { data: membershipRows },
        { data: awardRows },
        { data: goalRows },
      ] = await Promise.all([
        supabase.from("profiles").select(profileSelect).eq("id", id).single(),
        supabase.from("game_players").select("id", { count: "exact", head: true }).eq("user_id", id),
        uid
          ? supabase.from("follows").select("follower_id").eq("follower_id", uid).eq("following_id", id).maybeSingle()
          : Promise.resolve({ data: null }),
        isOwnProfile
          ? supabase
              .from("game_players")
              .select("id, payment_status, joined_at, game:games(id, title, venue_name, date_time, price_per_player)")
              .eq("user_id", id)
              .order("joined_at", { ascending: false })
              .limit(20)
          : Promise.resolve({ data: [] as ProfileMatchEntry[] }),
        isOwnProfile
          ? supabase
              .from("wallet_transactions")
              .select("amount, direction, source")
              .eq("user_id", id)
              .order("created_at", { ascending: false })
              .limit(100)
          : Promise.resolve({ data: [] as Array<{ amount: number; direction: "credit" | "debit"; source: string }> }),
        supabase
          .from("tournament_teams")
          .select("id, name, seed, tournament:tournaments(id, name, status, starts_at)")
          .eq("captain_id", id)
          .eq("status", "registered")
          .eq("is_managed", false)
          .order("created_at", { ascending: false })
          .limit(12),
        // Roster memberships, not just captaincies — a player who joined a
        // team's roster (without captaining it) is still "on" that team.
        supabase
          .from("tournament_team_members")
          .select("team_id, team:tournament_teams(id, name), tournament:tournaments(id, name, status, starts_at)")
          .eq("user_id", id)
          .limit(24),
        supabase
          .from("tournament_awards")
          .select("*")
          .eq("user_id", id)
          .order("created_at", { ascending: false })
          .limit(24),
        supabase.from("tournament_goals").select("goals").eq("scorer_id", id),
      ]);

      const loadedProfile = profileData as unknown as Profile;
      setProfile(loadedProfile);
      setLocationHidden(Boolean(loadedProfile?.location_hidden));
      setIsFollowing(!!followData);
      const entries = ((matchesData as ProfileMatchEntry[] | null) ?? []).filter((entry) => !!entry.game);
      setRecentMatches(entries);

      const walletRows = (walletData as Array<{ amount: number; direction: "credit" | "debit"; source: string }> | null) ?? [];
      setWalletRows(walletRows);

      const captainEntries = ((tournamentRows as ProfileTournamentEntry[] | null) ?? []).filter((row) => row.tournament);
      const memberships =
        (membershipRows as
          | { team_id: string; team: { id: string; name: string } | null; tournament: ProfileTournamentEntry["tournament"] }[]
          | null) ?? [];
      const membershipEntries: ProfileTournamentEntry[] = memberships
        .filter((row) => row.tournament && row.team)
        .map((row) => ({ id: row.team_id, name: row.team!.name, seed: null, tournament: row.tournament }));

      // Merge captain + roster entries, one card per tournament (captaincy wins the tiebreak).
      const seenTournaments = new Set<string>();
      const mergedTrophyRows: ProfileTournamentEntry[] = [];
      for (const entry of [...captainEntries, ...membershipEntries]) {
        if (seenTournaments.has(entry.tournament!.id)) continue;
        seenTournaments.add(entry.tournament!.id);
        mergedTrophyRows.push(entry);
      }
      setTrophyRows(mergedTrophyRows);
      setAwards((awardRows as TournamentAward[] | null) ?? []);
      const goalTotal = ((goalRows as { goals: number }[] | null) ?? []).reduce(
        (sum, row) => sum + (row.goals ?? 0),
        0
      );
      setGoalsScored(goalTotal);

      // "Matches played" undercounted badly without this: it only ever
      // counted pickup games, so a tournament champion could show "0 matches
      // played" one line above their trophy cabinet.
      const teamIds = [...new Set([...captainEntries.map((e) => e.id), ...memberships.map((m) => m.team_id)])];
      let tournamentMatchesPlayed = 0;
      if (teamIds.length > 0) {
        const idList = teamIds.join(",");
        const { count: matchCount } = await supabase
          .from("tournament_matches")
          .select("id", { count: "exact", head: true })
          .eq("status", "completed")
          .or(`home_team_id.in.(${idList}),away_team_id.in.(${idList})`);
        tournamentMatchesPlayed = matchCount ?? 0;
      }
      setGamesPlayed((count ?? 0) + tournamentMatchesPlayed);
      // Fetch player reels
      const reelsRes = await fetch(`/api/reels?playerId=${id}&limit=6`);
      if (reelsRes.ok) {
        const reelsJson = await reelsRes.json();
        setPlayerReels(reelsJson.reels ?? []);
      }

      setLoading(false);
    }
    load();
  }, [id]);

  async function handleFollow() {
    if (!currentUserId || followLoading) return;
    if (isGuest) {
      router.push(`/signup?next=/profile/${id}`);
      return;
    }
    setFollowLoading(true);
    const supabase = createClient();
    if (isFollowing) {
      await supabase.from("follows").delete().eq("follower_id", currentUserId).eq("following_id", id);
      setIsFollowing(false);
    } else {
      await supabase.from("follows").insert({ follower_id: currentUserId, following_id: id });
      setIsFollowing(true);
    }
    setFollowLoading(false);
  }

  async function toggleLocationHidden() {
    if (!currentUserId || savingLocation) return;
    setSavingLocation(true);
    const next = !locationHidden;
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ location_hidden: next })
      .eq("id", currentUserId);
    if (!updateError) setLocationHidden(next);
    setSavingLocation(false);
  }

  if (loading) {
    return (
      <div className="min-h-[100dvh] rondo-page space-y-4 p-4">
        <div className="h-8 w-8 rounded-[var(--r-sm)] rondo-shimmer" />
        <div className="flex items-center gap-4">
          <div className="size-24 rounded-full rondo-shimmer" />
          <div className="flex-1 space-y-2">
            <div className="h-6 w-1/2 rounded rondo-shimmer" />
            <div className="h-3 w-1/3 rounded rondo-shimmer" />
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center rondo-page rondo-meta text-[var(--ink-low)]">
        Player not found
      </div>
    );
  }

  const flag = profile.nationality ? getFlagEmoji(profile.nationality) : "";
  const isOwnProfile = currentUserId === id;
  const isOrganizer = profile.role === "organizer";
  const upcomingMatches = recentMatches
    .filter((entry) => entry.game && new Date(entry.game.date_time) >= new Date())
    .slice(0, 3);
  const cupWins = awards.filter((a) => a.kind === "champion").length;
  const metaLine = [profile.position, profile.nationality || profile.preferred_areas]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="min-h-[100dvh] rondo-page pb-24">
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-[var(--stroke)] rondo-glass-nav px-4 py-3">
        <button
          onClick={() => router.back()}
          className="flex min-h-11 min-w-11 items-center justify-center text-[var(--ink-hi)] transition-colors hover:text-[var(--gold)]"
          aria-label="Back"
        >
          <ArrowLeft size={20} weight="bold" />
        </button>
        <h1 className="flex-1 truncate rondo-title text-[var(--ink-hi)]">{profile.full_name}</h1>
        {isOwnProfile && <ThemeToggle />}
        {!isOwnProfile && currentUserId && !isGuest && (
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href={`/messages/${id}`}
              className="flex min-h-11 min-w-11 items-center justify-center rounded-[var(--r-pill)] border border-[var(--stroke)] text-[var(--gold)] transition-colors hover:border-[var(--gold)]"
              aria-label="Message player"
            >
              <ChatCircle size={18} weight="duotone" />
            </Link>
            <button
              onClick={handleFollow}
              disabled={followLoading}
              className={cn(
                "inline-flex min-h-11 items-center gap-2 rounded-[var(--r-pill)] border px-4 rondo-meta font-bold transition-all active:scale-[0.97] disabled:opacity-50",
                isFollowing
                  ? "border-[var(--stroke)] text-[var(--ink-low)]"
                  : "border-[var(--gold)] bg-[var(--gold-dim)] text-[var(--gold)]"
              )}
            >
              {isFollowing ? (
                <>
                  <UserMinus size={15} weight="bold" />
                  Unfollow
                </>
              ) : (
                <>
                  <UserPlus size={15} weight="bold" />
                  Follow
                </>
              )}
            </button>
          </div>
        )}
      </header>

      <div className="mx-auto max-w-lg space-y-8 px-4 py-6">
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <div className="flex size-24 items-center justify-center overflow-hidden rounded-full border-2 border-[var(--gold)] bg-[var(--bg-inset)]">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.full_name ?? ""} className="h-full w-full object-cover" />
              ) : (
                <span className="font-heading text-3xl font-bold text-[var(--ink-hi)]">
                  {(profile.full_name ?? "?").slice(0, 1)}
                </span>
              )}
            </div>
            {flag && (
              <span className="absolute -bottom-1 -right-1 text-xl leading-none">{flag}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-heading text-[1.75rem] font-bold uppercase leading-none tracking-[0.01em] text-[var(--ink-hi)]">
                {profile.full_name}
              </h2>
              {isOrganizer && <Chip label="Organizer" variant="outline" size="sm" />}
            </div>
            {metaLine && (
              <p className="mt-2 flex items-center gap-1.5 rondo-meta text-[var(--ink-low)]">
                <MapPin size={12} weight="bold" aria-hidden />
                {metaLine}
              </p>
            )}
            {profile.skill_level && !isOrganizer && (
              <p className="mt-1 rondo-meta text-[var(--ink-mid)]">{profile.skill_level}</p>
            )}
          </div>
        </div>

        {!isOrganizer && (
          <section className="grid grid-cols-2 gap-3">
            <StatTile label="Goals" value={goalsScored} size="lg" className="col-span-2" />
            <StatTile label="Cups" value={cupWins} size="sm" />
            <StatTile label="Apps" value={gamesPlayed} size="sm" />
          </section>
        )}

        {isOrganizer && (
          <section className="grid grid-cols-2 gap-3">
            <StatTile label="Games hosted" value={gamesPlayed} size="lg" className="col-span-2" />
          </section>
        )}

        {/* Trophy cabinet: real honors granted when tournaments complete. */}
        {awards.length > 0 && (
          <section className="space-y-3">
            <h3 className="rondo-label text-[var(--ink-low)]">Trophy cabinet</h3>
            <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
              {awards.map((award) => {
                const champion = award.kind === "champion";
                const topScorer = award.kind === "top_scorer";
                const Icon = champion ? Trophy : topScorer ? SoccerBall : Medal;
                return (
                  <Link
                    key={award.id}
                    href={`/tournaments/${award.tournament_id}/champion`}
                    className={`w-44 shrink-0 rounded-[var(--r-md)] border p-4 ${
                      champion
                        ? "border-[color-mix(in_oklch,var(--gold)_45%,var(--stroke))] bg-[var(--gold-dim)]"
                        : "border-[var(--stroke)] bg-[var(--bg-surface)]"
                    }`}
                  >
                    <div
                      className={`mb-4 grid size-10 place-items-center rounded-[var(--r-pill)] ${
                        champion || topScorer
                          ? "bg-[var(--gold-dim)] text-[var(--gold)]"
                          : "bg-[var(--bg-inset)] text-[var(--ink-mid)]"
                      }`}
                    >
                      <Icon size={20} />
                    </div>
                    <p className={`rondo-label ${champion || topScorer ? "text-[var(--gold)]" : "text-[var(--ink-low)]"}`}>
                      {champion ? "Champions" : topScorer ? "Top scorer" : "Runners-up"}
                    </p>
                    <p className="mt-1 truncate rondo-title text-[var(--ink-hi)]">{award.tournament_name}</p>
                    <p className="mt-1 truncate rondo-meta text-[var(--ink-low)]">
                      {topScorer ? (award.detail ?? award.team_name ?? "") : award.team_name ? `with ${award.team_name}` : (award.detail ?? "")}
                    </p>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Live campaigns: tournaments this player's team is still fighting in. */}
        {!isOrganizer && trophyRows.some((row) => row.tournament!.status !== "completed") && (
          <section className="space-y-3">
            <h3 className="rondo-label text-[var(--ink-low)]">In the hunt</h3>
            <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
              {trophyRows
                .filter((row) => row.tournament!.status !== "completed")
                .map((row) => (
                  <Link
                    key={row.id}
                    href={`/tournaments/${row.tournament!.id}`}
                    className="w-44 shrink-0 rounded-[var(--r-md)] border border-[var(--stroke)] bg-[var(--bg-surface)] p-4"
                  >
                    <div className="mb-4 grid size-10 place-items-center rounded-[var(--r-pill)] bg-[var(--bg-inset)] text-[var(--ink-mid)]">
                      <Trophy size={20} />
                    </div>
                    <p className="truncate rondo-title text-[var(--ink-hi)]">{row.tournament!.name}</p>
                    <p className="mt-1 truncate rondo-meta text-[var(--ink-low)]">as {row.name}</p>
                  </Link>
                ))}
            </div>
          </section>
        )}

        {isOrganizer && (
          <Link
            href={`/organizers/${id}`}
            className="flex items-center justify-between rounded-[var(--r-md)] border border-[var(--stroke)] bg-[var(--bg-surface)] p-4 transition-colors hover:border-[color-mix(in_oklch,var(--gold)_40%,var(--stroke))]"
          >
            <div>
              <p className="rondo-body font-bold text-[var(--ink-hi)]">View organizer page</p>
              <p className="mt-0.5 rondo-meta text-[var(--ink-low)]">Games, room broadcasts, followers</p>
            </div>
            <CaretRight size={16} className="text-[var(--ink-low)]" aria-hidden />
          </Link>
        )}

        {profile.bio && (
          <div className="space-y-2">
            <h3 className="rondo-label text-[var(--ink-low)]">
              {isOrganizer ? "About this organizer" : "About"}
            </h3>
            <p className="whitespace-pre-wrap rondo-body text-[var(--ink-mid)]">{profile.bio}</p>
          </div>
        )}

        {!isOrganizer && playerReels.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="rondo-label text-[var(--ink-low)]">Clips</h3>
              <Link href={`/reels?player=${id}`} className="rondo-meta font-bold text-[var(--gold)]">
                View all
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {playerReels.slice(0, 4).map((reel) => (
                <Link
                  key={reel.id}
                  href={`/reels?player=${id}`}
                  className="relative aspect-[9/16] max-h-48 overflow-hidden rounded-[var(--r-md)] border border-[var(--stroke)] bg-[var(--bg-page)]"
                >
                  <video
                    src={reel.video_url}
                    muted
                    playsInline
                    preload="metadata"
                    className="h-full w-full object-cover"
                  />
                  {reel.caption && (
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[var(--bg-page)] p-2">
                      <p className="line-clamp-1 rondo-meta text-[var(--ink-hi)]">{reel.caption}</p>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Edit button for own profile */}
        {isOwnProfile && (
          <>
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet size={16} weight="duotone" className="text-[var(--gold)]" aria-hidden />
                  <h3 className="rondo-label text-[var(--ink-low)]">Wallet</h3>
                </div>
                <Link href="/wallet" className="rondo-meta font-bold text-[var(--gold)]">
                  Manage
                </Link>
              </div>
              {walletRows.length > 0 && (
                <div className="overflow-hidden rounded-[var(--r-md)] border border-[var(--stroke)] bg-[var(--bg-surface)]">
                  {walletRows.slice(0, 10).map((row, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3",
                        i > 0 && "border-t border-[var(--stroke)]"
                      )}
                    >
                      <div
                        className={cn(
                          "flex size-8 shrink-0 items-center justify-center rounded-full",
                          row.direction === "credit"
                            ? "bg-[color-mix(in_oklch,var(--ok)_16%,transparent)] text-[var(--ok)]"
                            : "bg-[color-mix(in_oklch,var(--live)_16%,transparent)] text-[var(--live)]"
                        )}
                      >
                        {row.direction === "credit" ? (
                          <ArrowUpRight size={15} weight="bold" />
                        ) : (
                          <ArrowDownLeft size={15} weight="bold" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="rondo-body text-[var(--ink-hi)]">
                          {row.source
                            .split("_")
                            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                            .join(" ")}
                        </p>
                      </div>
                      <p
                        className={cn(
                          "shrink-0 font-heading text-sm font-bold tabular-nums",
                          row.direction === "credit" ? "text-[var(--ok)]" : "text-[var(--live)]"
                        )}
                      >
                        {row.direction === "credit" ? "+" : "-"}
                        {formatPrice(row.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {!isOrganizer && (
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CalendarBlank size={16} weight="duotone" className="text-[var(--gold)]" aria-hidden />
                    <h3 className="rondo-label text-[var(--ink-low)]">Recent matches</h3>
                  </div>
                  <Link href="/my-games" className="rondo-meta font-bold text-[var(--gold)]">
                    View all
                  </Link>
                </div>

                {upcomingMatches.length === 0 ? (
                  <div className="rondo-surface p-4">
                    <p className="rondo-meta text-[var(--ink-low)]">No upcoming matches yet.</p>
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-[var(--r-md)] border border-[var(--stroke)] bg-[var(--bg-surface)]">
                    {upcomingMatches.map((entry, i) =>
                      entry.game ? (
                        <Link
                          key={entry.id}
                          href={`/games/${entry.game.id}`}
                          className={cn(
                            "flex min-h-14 items-center gap-3 px-4 py-3 transition-colors active:bg-[var(--bg-inset)]",
                            i > 0 && "border-t border-[var(--stroke)]"
                          )}
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate rondo-body font-bold text-[var(--ink-hi)]">
                              {entry.game.title}
                            </p>
                            <p className="truncate rondo-meta text-[var(--ink-low)]">
                              {formatGameDate(entry.game.date_time)} · {entry.game.venue_name}
                            </p>
                          </div>
                          <span className="shrink-0 font-heading text-sm font-bold tabular-nums text-[var(--gold)]">
                            {formatPrice(entry.game.price_per_player)}
                          </span>
                          <CaretRight size={16} className="shrink-0 text-[var(--ink-low)]" aria-hidden />
                        </Link>
                      ) : null
                    )}
                  </div>
                )}
              </section>
            )}

            {isOrganizer && (
              <Link
                href="/organizer/dashboard"
                className="flex items-center justify-between rounded-[var(--r-md)] border border-[color-mix(in_oklch,var(--gold)_40%,var(--stroke))] bg-[var(--gold-dim)] p-4"
              >
                <div className="flex items-center gap-2.5">
                  <CalendarBlank size={18} weight="duotone" className="text-[var(--gold)]" aria-hidden />
                  <div>
                    <p className="rondo-body font-bold text-[var(--ink-hi)]">Organizer dashboard</p>
                    <p className="rondo-meta text-[var(--ink-low)]">Create games, manage payouts</p>
                  </div>
                </div>
                <CaretRight size={16} className="text-[var(--gold)]" aria-hidden />
              </Link>
            )}

            <button
              onClick={() => {
                if (isGuest) {
                  router.push("/signup?next=/profile");
                  return;
                }
                router.push("/onboarding/profile");
              }}
              className="rondo-btn rondo-btn-secondary"
            >
              Edit profile
            </button>

            {!isGuest && profile.role !== "admin" && (
              <button
                onClick={switchRole}
                disabled={switchingRole}
                className="w-full py-1 text-center rondo-meta text-[var(--ink-low)] transition-colors hover:text-[var(--ink-hi)] disabled:opacity-50"
              >
                {switchingRole
                  ? "Switching..."
                  : profile.role === "organizer"
                    ? "Switch to a player account"
                    : "Switch to an organizer account"}
              </button>
            )}

            <label className="flex cursor-pointer items-start gap-3 rounded-[var(--r-md)] border border-[var(--stroke)] bg-[var(--bg-surface)] p-4">
              <input
                type="checkbox"
                checked={locationHidden}
                disabled={savingLocation}
                onChange={toggleLocationHidden}
                className="mt-0.5 h-4 w-4 accent-[var(--gold)]"
              />
              <span className="rondo-body leading-snug text-[var(--ink-mid)]">
                Hide my location from other players
                <span className="mt-0.5 block rondo-meta text-[var(--ink-low)]">
                  When on, nearest-player discovery won&apos;t show where you are.
                </span>
              </span>
            </label>

            {!isGuest && <PasskeyManager />}

            <Link href="/messages" className="rondo-btn rondo-btn-secondary">
              Messages
            </Link>
            <Link href="/help" className="rondo-btn rondo-btn-secondary">
              Help and refunds
            </Link>
            <button
              onClick={async () => {
                const supabase = createClient();
                await supabase.auth.signOut();
                router.push("/");
                router.refresh();
              }}
              className="rondo-btn border border-[color-mix(in_oklch,var(--live)_35%,var(--stroke))] text-[var(--live)]"
            >
              Sign out
            </button>

            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="w-full py-1 text-center rondo-meta text-[var(--ink-low)] transition-colors hover:text-[var(--live)]"
              >
                Delete account
              </button>
            ) : (
              <div className="space-y-3 rounded-[var(--r-md)] border border-[color-mix(in_oklch,var(--live)_35%,var(--stroke))] bg-[color-mix(in_oklch,var(--live)_8%,transparent)] p-4">
                <p className="rondo-body text-[var(--ink-mid)]">
                  This permanently deletes your account, profile, and match history. It can&apos;t
                  be undone.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="rondo-btn rondo-btn-secondary flex-1"
                  >
                    Keep my account
                  </button>
                  <button
                    onClick={deleteAccount}
                    disabled={deleting}
                    className="flex-1 rounded-[var(--r-pill)] bg-[var(--live)] py-2.5 rondo-meta font-bold text-[var(--ink-hi)] disabled:opacity-50"
                  >
                    {deleting ? "Deleting..." : "Delete forever"}
                  </button>
                </div>
              </div>
            )}
            {accountError && (
              <p className="text-center rondo-meta text-[var(--live)]">{accountError}</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
