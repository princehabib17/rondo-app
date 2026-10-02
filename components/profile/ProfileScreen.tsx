"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowDownLeft,
  ArrowsLeftRight,
  ArrowUpRight,
  CalendarBlank,
  CaretRight,
  ChatCircle,
  EyeSlash,
  Lifebuoy,
  MapPin,
  Medal,
  PencilSimple,
  SignOut,
  SoccerBall,
  Trophy,
  UserMinus,
  UserPlus,
  Wallet,
} from "@phosphor-icons/react";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { isGuestUser } from "@/lib/auth/is-guest";
import { PUBLIC_PROFILE_SELECT } from "@/lib/supabase/profile-select";
import { formatPrice, getFlagEmoji } from "@/lib/utils/format";
import { describeWalletTransaction } from "@/lib/wallet/describe";
import { PageHeader } from "@/components/layout/PageHeader";
import type { Profile, PlayerReel, TournamentAward } from "@/lib/supabase/types";
import { Chip, EmptyState, RondoButton } from "@/components/rondo/primitives";
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

type WalletRow = {
  amount: number;
  direction: "credit" | "debit";
  source: string;
  note: string | null;
  created_at: string;
  game: { title: string } | null;
};

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

/** A player's or organizer's profile. `asTab` renders the signed-in user's own profile as a tab root. */
export function ProfileScreen({ id, asTab = false }: { id: string; asTab?: boolean }) {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [gamesPlayed, setGamesPlayed] = useState(0);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [recentMatches, setRecentMatches] = useState<ProfileMatchEntry[]>([]);
  const [walletRows, setWalletRows] = useState<WalletRow[]>([]);
  const [followerCount, setFollowerCount] = useState(0);
  const [isGuest, setIsGuest] = useState(false);
  const [locationHidden, setLocationHidden] = useState(false);
  const [playerReels, setPlayerReels] = useState<PlayerReel[]>([]);
  const [trophyRows, setTrophyRows] = useState<ProfileTournamentEntry[]>([]);
  const [awards, setAwards] = useState<TournamentAward[]>([]);
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
      // Full reload so no signed-in state survives the deletion.
      window.location.replace(window.location.origin);
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
        { count: followers },
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
              .select("amount, direction, source, note, created_at, game:games(title)")
              .eq("user_id", id)
              .order("created_at", { ascending: false })
              .limit(200)
          : Promise.resolve({ data: [] as WalletRow[] }),
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
        supabase.from("follows").select("follower_id", { count: "exact", head: true }).eq("following_id", id),
      ]);

      const loadedProfile = profileData as unknown as Profile;
      setProfile(loadedProfile);
      setLocationHidden(Boolean(loadedProfile?.location_hidden));
      setIsFollowing(!!followData);
      const entries = ((matchesData as ProfileMatchEntry[] | null) ?? []).filter((entry) => !!entry.game);
      setRecentMatches(entries);

      setWalletRows((walletData as unknown as WalletRow[] | null) ?? []);
      setFollowerCount(followers ?? 0);

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
      <div className="min-h-[100dvh] rondo-page">
        <div className="mx-auto max-w-lg space-y-4 px-4 pt-20">
          <div className="h-56 rounded-[var(--r-lg)] rondo-shimmer" />
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 h-28 rounded-[var(--r-md)] rondo-shimmer" />
            <div className="h-28 rounded-[var(--r-md)] rondo-shimmer" />
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-[100dvh] rondo-page">
        <PageHeader title="Profile" back fallbackHref="/community" />
        <div className="mx-auto max-w-lg px-4 py-12">
          <EmptyState
            title="Player not found"
            body="This profile was removed or the link is wrong."
            action={<RondoButton href="/community" variant="secondary">Find players</RondoButton>}
          />
        </div>
      </div>
    );
  }

  const flag = profile.nationality ? getFlagEmoji(profile.nationality) : "";
  const isOwnProfile = currentUserId === id;
  const isOrganizer = profile.role === "organizer";
  const upcomingMatches = recentMatches
    .filter((entry) => entry.game && new Date(entry.game.date_time) >= new Date())
    .slice(0, 3);
  const metaLine = [
    profile.position ? capitalize(profile.position) : null,
    profile.preferred_areas || profile.nationality,
  ]
    .filter(Boolean)
    .join(" · ");
  const trophyCount = awards.length;
  const balance = walletRows.reduce(
    (sum, row) => sum + (row.direction === "credit" ? row.amount : -row.amount),
    0
  );
  const canMessage = !isOwnProfile && currentUserId && !isGuest;

  return (
    <div className="min-h-[100dvh] rondo-page">
      <PageHeader
        title={isOwnProfile && asTab ? "Profile" : profile.full_name}
        back={!asTab}
        fallbackHref="/community"
        trailing={isOwnProfile ? <ThemeToggle /> : null}
      />

      <div className="mx-auto max-w-lg space-y-8 px-4 py-6">
        <section className="relative overflow-hidden rounded-[var(--r-lg)] border border-[var(--stroke)] rondo-floodlight-scene p-6">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <div className="grid size-24 place-items-center overflow-hidden rounded-[var(--r-pill)] bg-[var(--bg-inset)] ring-2 ring-[var(--gold)] ring-offset-4 ring-offset-[var(--bg-night)]">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.full_name ?? ""} className="h-full w-full object-cover" />
                ) : (
                  <span className="font-heading text-4xl font-bold text-[var(--ink-hi)]">
                    {(profile.full_name ?? "?").slice(0, 1)}
                  </span>
                )}
              </div>
              {flag && <span className="absolute -bottom-1 -right-1 text-xl leading-none">{flag}</span>}
            </div>
            <div className="min-w-0 flex-1">
              {isOrganizer && <Chip label="Organizer" variant="outline" size="sm" className="mb-2" />}
              <h2 className="font-heading text-[1.75rem] font-bold uppercase leading-[0.95] tracking-[0.01em] text-[var(--ink-hi)] [overflow-wrap:anywhere]">
                {profile.full_name}
              </h2>
              {metaLine && (
                <p className="mt-2 flex items-center gap-1.5 rondo-meta text-[var(--ink-mid)]">
                  <MapPin size={13} weight="bold" className="shrink-0 text-[var(--ink-low)]" aria-hidden />
                  <span className="truncate">{metaLine}</span>
                </p>
              )}
              {profile.skill_level && !isOrganizer && (
                <p className="mt-1 rondo-meta text-[var(--ink-low)]">{capitalize(profile.skill_level)} level</p>
              )}
            </div>
          </div>

          {canMessage && (
            <div className="mt-6 grid grid-cols-[1fr_auto] gap-2">
              <button
                onClick={handleFollow}
                disabled={followLoading}
                className={cn("rondo-btn", isFollowing ? "rondo-btn-secondary" : "rondo-btn-primary")}
              >
                {isFollowing ? (
                  <>
                    <UserMinus size={18} weight="bold" aria-hidden />
                    Following
                  </>
                ) : (
                  <>
                    <UserPlus size={18} weight="bold" aria-hidden />
                    Follow
                  </>
                )}
              </button>
              <Link
                href={`/messages/${id}`}
                className="grid size-12 place-items-center rounded-[var(--r-pill)] bg-[var(--bg-inset)] text-[var(--ink-hi)] active:scale-[0.97]"
                aria-label={`Message ${profile.full_name}`}
              >
                <ChatCircle size={20} weight="bold" aria-hidden />
              </Link>
            </div>
          )}
          {!isOwnProfile && isGuest && (
            <RondoButton href={`/signup?next=/profile/${id}`} className="mt-6">
              Create an account to follow
            </RondoButton>
          )}
        </section>

        <section className="grid grid-cols-3 gap-3">
          <div className="col-span-2 row-span-2 flex flex-col justify-between rounded-[var(--r-md)] border border-[var(--stroke)] bg-[var(--bg-surface)] p-4">
            <p className="rondo-label text-[var(--ink-low)]">{isOrganizer ? "Games hosted" : "Matches played"}</p>
            <p className="mt-6 font-heading text-[3.5rem] font-bold leading-none tabular-nums text-[var(--ink-hi)]">
              {gamesPlayed}
            </p>
          </div>
          <div className="rounded-[var(--r-md)] border border-[var(--stroke)] bg-[var(--bg-surface)] px-4 py-3">
            <p className="font-heading text-2xl font-bold leading-none tabular-nums text-[var(--gold)]">{trophyCount}</p>
            <p className="mt-1 rondo-label text-[var(--ink-low)]">Honors</p>
          </div>
          <div className="rounded-[var(--r-md)] border border-[var(--stroke)] bg-[var(--bg-surface)] px-4 py-3">
            <p className="font-heading text-2xl font-bold leading-none tabular-nums text-[var(--ink-hi)]">{followerCount}</p>
            <p className="mt-1 rondo-label text-[var(--ink-low)]">Followers</p>
          </div>
        </section>

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
                    className={cn(
                      "w-44 shrink-0 rounded-[var(--r-md)] border p-4",
                      champion
                        ? "border-[color-mix(in_oklch,var(--gold)_45%,var(--stroke))] bg-[var(--gold-dim)]"
                        : "border-[var(--stroke)] bg-[var(--bg-surface)]"
                    )}
                  >
                    <div
                      className={cn(
                        "mb-4 grid size-10 place-items-center rounded-[var(--r-pill)]",
                        champion || topScorer
                          ? "bg-[var(--gold-dim)] text-[var(--gold)]"
                          : "bg-[var(--bg-inset)] text-[var(--ink-mid)]"
                      )}
                    >
                      <Icon size={20} />
                    </div>
                    <p className={cn("rondo-label", champion || topScorer ? "text-[var(--gold)]" : "text-[var(--ink-low)]")}>
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

        {profile.bio && (
          <section className="space-y-2">
            <h3 className="rondo-label text-[var(--ink-low)]">{isOrganizer ? "About this organizer" : "About"}</h3>
            <p className="whitespace-pre-wrap rondo-body text-[var(--ink-mid)]">{profile.bio}</p>
          </section>
        )}

        {isOrganizer && (
          <Link
            href={`/organizers/${id}`}
            className="flex min-h-16 items-center justify-between rounded-[var(--r-md)] border border-[var(--stroke)] bg-[var(--bg-surface)] px-4 py-3 transition-colors hover:border-[color-mix(in_oklch,var(--gold)_40%,var(--stroke))]"
          >
            <div>
              <p className="rondo-body font-bold text-[var(--ink-hi)]">Organizer page</p>
              <p className="rondo-meta text-[var(--ink-low)]">Games, broadcasts, followers</p>
            </div>
            <CaretRight size={16} className="text-[var(--ink-low)]" aria-hidden />
          </Link>
        )}

        {!isOrganizer && playerReels.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="rondo-label text-[var(--ink-low)]">Clips</h3>
              <Link href={`/reels?player=${id}`} className="rondo-meta font-bold text-[var(--ink-mid)]">
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
                  <video src={reel.video_url} muted playsInline preload="metadata" className="h-full w-full object-cover" />
                  {reel.caption && (
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[var(--bg-night)] p-2">
                      <p className="line-clamp-1 rondo-meta text-[var(--night-ink)]">{reel.caption}</p>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

        {isOwnProfile && (
          <>
            {!isOrganizer && (
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="rondo-label text-[var(--ink-low)]">Up next</h3>
                  <Link href="/my-games" className="rondo-meta font-bold text-[var(--ink-mid)]">
                    All matches
                  </Link>
                </div>
                {upcomingMatches.length === 0 ? (
                  <Link
                    href="/feed"
                    className="flex min-h-16 items-center justify-between gap-3 rounded-[var(--r-md)] border border-dashed border-[var(--stroke)] px-4 py-3"
                  >
                    <span className="rondo-meta text-[var(--ink-low)]">Nothing booked. Find a match tonight.</span>
                    <CaretRight size={16} className="shrink-0 text-[var(--ink-low)]" aria-hidden />
                  </Link>
                ) : (
                  <div className="divide-y divide-[var(--stroke)] overflow-hidden rounded-[var(--r-md)] border border-[var(--stroke)] bg-[var(--bg-surface)]">
                    {upcomingMatches.map((entry) =>
                      entry.game ? (
                        <Link
                          key={entry.id}
                          href={`/games/${entry.game.id}`}
                          className="flex min-h-16 items-center gap-3 px-4 py-3 transition-colors active:bg-[var(--bg-inset)]"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate rondo-body font-bold text-[var(--ink-hi)]">{entry.game.title}</p>
                            <p className="truncate rondo-meta text-[var(--ink-low)]">
                              {format(new Date(entry.game.date_time), "EEE, MMM d · h:mm a")} · {entry.game.venue_name}
                            </p>
                          </div>
                          <CaretRight size={16} className="shrink-0 text-[var(--ink-low)]" aria-hidden />
                        </Link>
                      ) : null
                    )}
                  </div>
                )}
              </section>
            )}

            <section className="space-y-3">
              <h3 className="rondo-label text-[var(--ink-low)]">Wallet</h3>
              <Link
                href="/wallet"
                className="block overflow-hidden rounded-[var(--r-md)] border border-[var(--stroke)] bg-[var(--bg-surface)] transition-colors active:bg-[var(--bg-inset)]"
              >
                <div className="flex items-center justify-between gap-3 px-4 py-4">
                  <div>
                    <p className="rondo-label text-[var(--ink-low)]">Balance</p>
                    <p className="mt-1 font-heading text-[2rem] font-bold leading-none tabular-nums text-[var(--ink-hi)]">
                      {formatPrice(Math.max(0, balance))}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 rondo-meta font-bold text-[var(--ink-mid)]">
                    <Wallet size={16} aria-hidden />
                    Open wallet
                    <CaretRight size={14} aria-hidden />
                  </span>
                </div>
                {walletRows.slice(0, 3).map((row, i) => {
                  const label = describeWalletTransaction(row);
                  return (
                    <div key={i} className="flex items-center gap-3 border-t border-[var(--stroke)] px-4 py-3">
                      <div
                        className={cn(
                          "grid size-8 shrink-0 place-items-center rounded-[var(--r-pill)]",
                          row.direction === "credit"
                            ? "bg-[color-mix(in_oklch,var(--ok)_16%,transparent)] text-[var(--ok)]"
                            : "bg-[var(--bg-inset)] text-[var(--ink-mid)]"
                        )}
                      >
                        {row.direction === "credit" ? (
                          <ArrowDownLeft size={15} weight="bold" aria-hidden />
                        ) : (
                          <ArrowUpRight size={15} weight="bold" aria-hidden />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate rondo-body text-[var(--ink-hi)]">{label.title}</p>
                        {label.detail && <p className="truncate rondo-meta text-[var(--ink-low)]">{label.detail}</p>}
                      </div>
                      <p
                        className={cn(
                          "shrink-0 font-heading text-base font-bold tabular-nums",
                          row.direction === "credit" ? "text-[var(--ok)]" : "text-[var(--ink-hi)]"
                        )}
                      >
                        {row.direction === "credit" ? "+" : "\u2212"}
                        {formatPrice(row.amount)}
                      </p>
                    </div>
                  );
                })}
              </Link>
            </section>

            <section className="space-y-3">
              <h3 className="rondo-label text-[var(--ink-low)]">Account</h3>
              <div className="divide-y divide-[var(--stroke)] overflow-hidden rounded-[var(--r-md)] border border-[var(--stroke)] bg-[var(--bg-surface)]">
                {isOrganizer && (
                  <SettingsLink href="/organizer/dashboard" icon={<CalendarBlank size={18} aria-hidden />} label="Organizer dashboard" hint="Create games, manage payouts" />
                )}
                <SettingsLink
                  href={isGuest ? "/signup?next=/profile" : "/onboarding/profile"}
                  icon={<PencilSimple size={18} aria-hidden />}
                  label={isGuest ? "Create your account" : "Edit profile"}
                  hint={isGuest ? "Save matches, pay, and post" : "Name, photo, position, areas"}
                />
                <SettingsLink href="/messages" icon={<ChatCircle size={18} aria-hidden />} label="Messages" />
                <SettingsLink href="/help" icon={<Lifebuoy size={18} aria-hidden />} label="Help and refunds" />
                <button
                  type="button"
                  role="switch"
                  aria-checked={locationHidden}
                  disabled={savingLocation}
                  onClick={toggleLocationHidden}
                  className="flex min-h-16 w-full items-center gap-3 px-4 py-3 text-left disabled:opacity-60"
                >
                  <span className="grid size-8 shrink-0 place-items-center text-[var(--ink-low)]">
                    <EyeSlash size={18} aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block rondo-body text-[var(--ink-hi)]">Hide my location</span>
                    <span className="block rondo-meta text-[var(--ink-low)]">Keep me out of nearby-player lists</span>
                  </span>
                  <span
                    aria-hidden
                    className={cn(
                      "relative h-7 w-12 shrink-0 rounded-[var(--r-pill)] transition-colors duration-200",
                      locationHidden ? "bg-[var(--gold)]" : "bg-[var(--bg-inset)]"
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-1 size-5 rounded-[var(--r-pill)] transition-transform duration-200",
                        locationHidden ? "translate-x-6 bg-[var(--gold-ink)]" : "translate-x-1 bg-[var(--ink-low)]"
                      )}
                    />
                  </span>
                </button>
                {!isGuest && profile.role !== "admin" && (
                  <button
                    type="button"
                    onClick={switchRole}
                    disabled={switchingRole}
                    className="flex min-h-16 w-full items-center gap-3 px-4 py-3 text-left disabled:opacity-60"
                  >
                    <span className="grid size-8 shrink-0 place-items-center text-[var(--ink-low)]">
                      <ArrowsLeftRight size={18} aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block rondo-body text-[var(--ink-hi)]">
                        {switchingRole ? "Switching..." : isOrganizer ? "Switch to player" : "Switch to organizer"}
                      </span>
                      <span className="block rondo-meta text-[var(--ink-low)]">
                        {isOrganizer ? "Find and join matches" : "Run games and tournaments"}
                      </span>
                    </span>
                  </button>
                )}
              </div>
            </section>

            {!isGuest && <PasskeyManager />}

            <div className="space-y-3">
              <button
                onClick={async () => {
                  const supabase = createClient();
                  await supabase.auth.signOut();
                  router.push("/");
                  router.refresh();
                }}
                className="rondo-btn rondo-btn-secondary text-[var(--live)]"
              >
                <SignOut size={18} aria-hidden />
                Sign out
              </button>

              {!confirmDelete ? (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="w-full py-2 text-center rondo-meta text-[var(--ink-low)] transition-colors hover:text-[var(--live)]"
                >
                  Delete account
                </button>
              ) : (
                <div className="space-y-3 rounded-[var(--r-md)] border border-[color-mix(in_oklch,var(--live)_35%,var(--stroke))] bg-[color-mix(in_oklch,var(--live)_8%,transparent)] p-4">
                  <p className="rondo-body text-[var(--ink-mid)]">
                    This permanently deletes your account, profile, and match history. It can&apos;t be undone.
                  </p>
                  <div className="flex gap-2">
                    <button onClick={() => setConfirmDelete(false)} className="rondo-btn rondo-btn-secondary flex-1">
                      Keep it
                    </button>
                    <button
                      onClick={deleteAccount}
                      disabled={deleting}
                      className="rondo-btn flex-1 bg-[var(--live)] text-[var(--ink-hi)] disabled:opacity-50"
                    >
                      {deleting ? "Deleting..." : "Delete forever"}
                    </button>
                  </div>
                </div>
              )}
              {accountError && <p className="text-center rondo-meta text-[var(--live)]">{accountError}</p>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function SettingsLink({
  href,
  icon,
  label,
  hint,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  hint?: string;
}) {
  return (
    <Link href={href} className="flex min-h-14 items-center gap-3 px-4 py-3 transition-colors active:bg-[var(--bg-inset)]">
      <span className="grid size-8 shrink-0 place-items-center text-[var(--ink-low)]">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block rondo-body text-[var(--ink-hi)]">{label}</span>
        {hint && <span className="block truncate rondo-meta text-[var(--ink-low)]">{hint}</span>}
      </span>
      <CaretRight size={16} className="shrink-0 text-[var(--ink-low)]" aria-hidden />
    </Link>
  );
}
