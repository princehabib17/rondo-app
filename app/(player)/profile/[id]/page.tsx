"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, UserPlus, UserMinus, MapPin, Trophy, Wallet, CalendarDays, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatGameDate, formatPrice, getFlagEmoji } from "@/lib/utils/format";
import type { Profile } from "@/lib/supabase/types";

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
  const [walletSpentCentavos, setWalletSpentCentavos] = useState(0);
  const [walletPaidCount, setWalletPaidCount] = useState(0);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id ?? null;
      setCurrentUserId(uid);
      setIsGuest(Boolean(userData.user?.is_anonymous));
      const isOwnProfile = uid === id;

      const [{ data: profileData }, { count }, { data: followData }, { data: matchesData }, { data: walletData }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", id).single(),
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
      ]);

      setProfile(profileData as Profile);
      setGamesPlayed(count ?? 0);
      setIsFollowing(!!followData);
      const entries = ((matchesData as ProfileMatchEntry[] | null) ?? []).filter((entry) => !!entry.game);
      setRecentMatches(entries);
      const walletRows = (walletData as Array<{ amount: number; direction: "credit" | "debit"; source: string }> | null) ?? [];
      if (walletRows.length > 0) {
        const debits = walletRows.filter((row) => row.direction === "debit");
        setWalletPaidCount(debits.length);
        setWalletSpentCentavos(debits.reduce((sum, row) => sum + row.amount, 0));
      } else {
        const paidEntries = entries.filter((entry) => entry.payment_status === "paid");
        setWalletPaidCount(paidEntries.length);
        setWalletSpentCentavos(
          paidEntries.reduce((sum, entry) => sum + (entry.game?.price_per_player ?? 0), 0)
        );
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
  const upcomingMatches = recentMatches
    .filter((entry) => entry.game && new Date(entry.game.date_time) >= new Date())
    .slice(0, 3);

  return (
    <div className="min-h-[100dvh] pb-8">
      <header className="sticky top-0 bg-background/90 backdrop-blur-md border-b border-border z-40 px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="min-w-[44px] min-h-[44px] flex items-center justify-center text-white hover:text-rondo-yellow transition-colors cursor-pointer" aria-label="Back">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-white font-bold text-base flex-1 truncate">{profile.full_name}</h1>
        {!isOwnProfile && currentUserId && !isGuest && (
          <button
            onClick={handleFollow}
            disabled={followLoading}
            className="min-h-[44px] px-4 flex items-center gap-2 rounded-lg border border-border hover:border-rondo-yellow/40 text-sm font-semibold transition-all cursor-pointer active:scale-[0.97] disabled:opacity-50"
            style={{ color: isFollowing ? "var(--muted-foreground)" : "var(--color-rondo-yellow)" }}
          >
            {isFollowing ? <><UserMinus size={15} />Unfollow</> : <><UserPlus size={15} />Follow</>}
          </button>
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
            <h2 className="text-white font-black text-xl leading-tight">{profile.full_name}</h2>
            {profile.nationality && (
              <p className="text-muted-foreground text-sm flex items-center gap-1.5 mt-1">
                <MapPin size={12} />
                {profile.nationality}
              </p>
            )}
            <div className="flex items-center gap-1.5 mt-1">
              <Trophy size={12} className="text-rondo-yellow" />
              <span className="text-muted-foreground text-sm">{gamesPlayed} games played</span>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3">
          {profile.position && (
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Position</p>
              <p className="text-white font-bold capitalize">{profile.position}</p>
            </div>
          )}
          {profile.preferred_foot && (
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Preferred Foot</p>
              <p className="text-white font-bold capitalize">{profile.preferred_foot}</p>
            </div>
          )}
        </div>

        {/* Bio */}
        {profile.bio && (
          <div className="space-y-2">
            <h3 className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">About</h3>
            <p className="text-white text-sm leading-relaxed">{profile.bio}</p>
          </div>
        )}

        {/* Edit button for own profile */}
        {isOwnProfile && (
          <>
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Wallet size={16} className="text-rondo-accent" />
                <h3 className="text-white font-bold text-base">Wallet</h3>
              </div>
              <div className="bg-card border border-border rounded-xl p-4 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Total Paid</p>
                  <p className="text-rondo-accent font-black text-lg">{formatPrice(walletSpentCentavos)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Paid Matches</p>
                  <p className="text-white font-black text-lg">{walletPaidCount}</p>
                </div>
              </div>
            </section>

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
            <Link
              href="/help"
              className="block w-full border border-border text-center text-muted-foreground hover:text-white hover:border-border/80 text-sm py-3 rounded-xl transition-all"
            >
              Help & Refunds
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
