"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, UserPlus, UserMinus, MapPin, Trophy, Wallet, CalendarDays, ChevronRight, ArrowUpRight, ArrowDownLeft, MessageCircle } from "lucide-react";
import { Medal, SoccerBall } from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import { isGuestUser } from "@/lib/auth/is-guest";
import { PUBLIC_PROFILE_SELECT } from "@/lib/supabase/profile-select";
import { formatGameDate, formatPrice, getFlagEmoji } from "@/lib/utils/format";
import type { Profile, PlayerReel, TournamentAward } from "@/lib/supabase/types";
import { StatTile } from "@/components/rondo/primitives";
import { PasskeyManager } from "@/components/auth/PasskeyManager";

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
      <div className="min-h-[100dvh] p-4 space-y-4">
        <div className="w-8 h-8 bg-muted rounded animate-pulse" />
        <div className="flex gap-4 items-center">
          <div className="w-20 h-20 rounded-full bg-muted animate-pulse" />
          <div className="space-y-2 flex-1">
            <div className="h-5 bg-muted rounded animate-pulse w-1/2" />
            <div className="h-3 bg-muted rounded animate-pulse w-1/3" />
          </div>
        </div>
      </div>
    );
  }

  if (!profile) return <div className="min-h-[100dvh] flex items-center justify-center text-muted-foreground">Player not found</div>;

  const flag = profile.nationality ? getFlagEmoji(profile.nationality) : "";
  const isOwnProfile = currentUserId === id;
  const isOrganizer = profile.role === "organizer";
  const upcomingMatches = recentMatches
    .filter((entry) => entry.game && new Date(entry.game.date_time) >= new Date())
    .slice(0, 3);

  return (
    <div className="min-h-[100dvh] pb-24">
      <header className="sticky top-0 bg-background/90 backdrop-blur-md border-b border-border z-40 px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="min-w-[44px] min-h-[44px] flex items-center justify-center text-white hover:text-rondo-yellow transition-colors cursor-pointer" aria-label="Back">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-white font-bold text-base flex-1 truncate">{profile.full_name}</h1>
        {!isOwnProfile && currentUserId && !isGuest && (
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href={`/messages/${id}`}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg border border-border hover:border-rondo-yellow/40 text-rondo-yellow transition-all"
              aria-label="Message player"
            >
              <MessageCircle size={18} />
            </Link>
            <button
              onClick={handleFollow}
              disabled={followLoading}
              className="min-h-[44px] px-4 flex items-center gap-2 rounded-lg border border-border hover:border-rondo-yellow/40 text-sm font-semibold transition-all cursor-pointer active:scale-[0.97] disabled:opacity-50"
              style={{ color: isFollowing ? "var(--muted-foreground)" : "var(--color-rondo-yellow)" }}
            >
              {isFollowing ? <><UserMinus size={15} />Unfollow</> : <><UserPlus size={15} />Follow</>}
            </button>
          </div>
        )}
      </header>

      <div className="px-4 py-6 space-y-6 max-w-lg mx-auto">
        {/* Avatar + name */}
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-full bg-secondary border-2 border-border overflow-hidden flex items-center justify-center">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.full_name ?? ""} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-black text-2xl">
                  {(profile.full_name ?? "?").slice(0, 1)}
                </span>
              )}
            </div>
            {flag && (
              <span className="absolute -bottom-1 -right-1 text-xl leading-none">{flag}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-white font-black text-xl leading-tight">{profile.full_name}</h2>
              {isOrganizer && (
                <span className="rounded-full bg-rondo-accent/15 text-rondo-accent text-[10px] font-black uppercase tracking-wider px-2 py-0.5 border border-rondo-accent/30">
                  Organizer
                </span>
              )}
            </div>
            {profile.nationality && !isOrganizer && (
              <p className="text-muted-foreground text-sm flex items-center gap-1.5 mt-1">
                <MapPin size={12} />
                {profile.nationality}
              </p>
            )}
            {isOrganizer && profile.preferred_areas && (
              <p className="text-muted-foreground text-sm flex items-center gap-1.5 mt-1 truncate">
                <MapPin size={12} className="shrink-0" />
                <span className="truncate">{profile.preferred_areas}</span>
              </p>
            )}
            <div className="flex items-center gap-1.5 mt-1">
              <Trophy size={12} className="text-rondo-yellow" />
              <span className="text-muted-foreground text-sm">
                {isOrganizer ? `${gamesPlayed} games hosted` : `${gamesPlayed} matches played`}
              </span>
            </div>
          </div>
        </div>

        {/* Stats row */}
        {!isOrganizer && profile.position && (
          <div className="grid grid-cols-2 gap-3">
            <StatTile label="Position" value={profile.position} size="sm" />
            {profile.skill_level && (
              <StatTile label="Level" value={profile.skill_level} size="sm" />
            )}
          </div>
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

        {/* Organizer info card */}
        {isOrganizer && (
          <Link
            href={`/organizers/${id}`}
            className="flex items-center justify-between bg-card border border-border hover:border-rondo-accent/40 rounded-xl p-4 transition-colors"
          >
            <div>
              <p className="text-white text-sm font-bold">View organizer page</p>
              <p className="text-muted-foreground text-xs mt-0.5">Games, room broadcasts, followers</p>
            </div>
            <ChevronRight size={16} className="text-muted-foreground" />
          </Link>
        )}

        {/* Bio */}
        {profile.bio && (
          <div className="space-y-2">
            <h3 className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">
              {isOrganizer ? "About this organizer" : "About"}
            </h3>
            <p className="text-white text-sm leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
          </div>
        )}

        {/* Clips. Player only. */}
        {!isOrganizer && playerReels.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Clips</h3>
              <Link
                href={`/reels?player=${id}`}
                className="text-rondo-accent text-xs font-semibold uppercase tracking-wide"
              >
                View All
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {playerReels.slice(0, 4).map((reel) => (
                <Link
                  key={reel.id}
                  href={`/reels?player=${id}`}
                  className="relative aspect-[9/16] max-h-48 rounded-xl overflow-hidden bg-black border border-border"
                >
                  <video
                    src={reel.video_url}
                    muted
                    playsInline
                    preload="metadata"
                    className="w-full h-full object-cover"
                  />
                  {reel.caption && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 p-2">
                      <p className="text-white text-[10px] line-clamp-1">{reel.caption}</p>
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
                  <Wallet size={16} className="text-rondo-accent" />
                  <h3 className="text-white font-bold text-base">Rondo Wallet</h3>
                </div>
                <Link
                  href="/wallet"
                  className="text-rondo-accent text-xs font-semibold uppercase tracking-wide"
                >
                  Manage
                </Link>
              </div>
              {walletRows.length > 0 && (
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                  {walletRows.slice(0, 10).map((row, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-b-0"
                    >
                      <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${row.direction === "credit" ? "bg-green-500/15" : "bg-red-500/15"}`}>
                        {row.direction === "credit" ? (
                          <ArrowUpRight size={15} className="text-green-400" />
                        ) : (
                          <ArrowDownLeft size={15} className="text-red-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium">
                          {row.source
                            .split("_")
                            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                            .join(" ")}
                        </p>
                      </div>
                      <p className={`text-sm font-black shrink-0 ${row.direction === "credit" ? "text-green-400" : "text-red-400"}`}>
                        {row.direction === "credit" ? "+" : "-"}{formatPrice(row.amount)}
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
                    <CalendarDays size={16} className="text-rondo-accent" />
                    <h3 className="text-white font-bold text-base">Matches</h3>
                  </div>
                  <Link href="/my-games" className="text-rondo-accent text-xs font-semibold uppercase tracking-wide">
                    View All
                  </Link>
                </div>

                {upcomingMatches.length === 0 ? (
                  <div className="bg-card border border-border rounded-xl p-4">
                    <p className="text-muted-foreground text-sm">No upcoming matches yet.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {upcomingMatches.map((entry) =>
                      entry.game ? (
                        <Link
                          key={entry.id}
                          href={`/games/${entry.game.id}`}
                          className="flex items-center gap-3 bg-card border border-border hover:border-rondo-accent/40 rounded-xl p-3 transition-colors"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-white text-sm font-semibold truncate">{entry.game.title}</p>
                            <p className="text-muted-foreground text-xs truncate">{formatGameDate(entry.game.date_time)}</p>
                            <p className="text-muted-foreground text-xs truncate">{entry.game.venue_name}</p>
                          </div>
                          <span className="text-rondo-accent text-xs font-black shrink-0">
                            {formatPrice(entry.game.price_per_player)}
                          </span>
                          <ChevronRight size={16} className="text-white/40 shrink-0" />
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
                className="flex items-center justify-between bg-rondo-accent/10 border border-rondo-accent/40 rounded-xl p-4"
              >
                <div className="flex items-center gap-2.5">
                  <CalendarDays size={18} className="text-rondo-accent" />
                  <div>
                    <p className="text-white font-bold text-sm">Organizer dashboard</p>
                    <p className="text-muted-foreground text-xs">Create games, manage payouts</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-rondo-accent" />
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
              className="w-full border border-border text-muted-foreground hover:text-white hover:border-border/80 text-sm py-3 rounded-xl active:scale-[0.98] transition-all cursor-pointer min-h-[44px]"
            >
              Edit Profile
            </button>

            {!isGuest && profile.role !== "admin" && (
              <button
                onClick={switchRole}
                disabled={switchingRole}
                className="w-full text-center text-muted-foreground hover:text-white text-xs py-1 transition-colors cursor-pointer disabled:opacity-50"
              >
                {switchingRole
                  ? "Switching..."
                  : profile.role === "organizer"
                    ? "Switch to a player account"
                    : "Switch to an organizer account"}
              </button>
            )}

            <label className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 cursor-pointer">
              <input
                type="checkbox"
                checked={locationHidden}
                disabled={savingLocation}
                onChange={toggleLocationHidden}
                className="mt-0.5 h-4 w-4 accent-[#E9FF3A]"
              />
              <span className="text-sm text-white/80 leading-snug">
                Hide my location from other players
                <span className="block text-xs text-muted-foreground mt-0.5">
                  When on, nearest-player discovery won&apos;t show where you are.
                </span>
              </span>
            </label>

            {!isGuest && <PasskeyManager />}

            <Link
              href="/messages"
              className="block w-full border border-border text-center text-muted-foreground hover:text-white hover:border-border/80 text-sm py-3 rounded-xl transition-all"
            >
              Messages
            </Link>
            <Link
              href="/help"
              className="block w-full border border-border text-center text-muted-foreground hover:text-white hover:border-border/80 text-sm py-3 rounded-xl transition-all"
            >
              Help & Refunds
            </Link>
            <button
              onClick={async () => {
                const supabase = createClient();
                await supabase.auth.signOut();
                router.push("/");
                router.refresh();
              }}
              className="w-full border border-red-500/30 text-red-400 hover:text-red-300 hover:border-red-400/50 text-sm py-3 rounded-xl transition-all cursor-pointer min-h-[44px]"
            >
              Sign Out
            </button>

            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="w-full text-center text-white/30 hover:text-red-400 text-xs py-1 transition-colors cursor-pointer"
              >
                Delete account
              </button>
            ) : (
              <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 space-y-3">
                <p className="text-white/80 text-sm">
                  This permanently deletes your account, profile, and match history. It can&apos;t
                  be undone.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="flex-1 border border-border text-muted-foreground text-sm py-2.5 rounded-xl"
                  >
                    Keep my account
                  </button>
                  <button
                    onClick={deleteAccount}
                    disabled={deleting}
                    className="flex-1 bg-red-500/90 text-white text-sm font-bold py-2.5 rounded-xl disabled:opacity-50"
                  >
                    {deleting ? "Deleting..." : "Delete forever"}
                  </button>
                </div>
              </div>
            )}
            {accountError && <p className="text-red-400 text-xs text-center">{accountError}</p>}
          </>
        )}
      </div>
    </div>
  );
}
