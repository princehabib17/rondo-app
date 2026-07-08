"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MapPin, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { isGuestUser } from "@/lib/auth/is-guest";
import type { Post, Profile } from "@/lib/supabase/types";
import { PUBLIC_PROFILE_SELECT } from "@/lib/supabase/profile-select";
import { PlayerAvatar } from "@/components/game/PlayerAvatar";
import { PostCard } from "@/components/social/PostCard";
import { PostComposer } from "@/components/social/PostComposer";
import { formatPlayerDistance, sortProfilesByDistance, type NearbyPlayer } from "@/lib/location/nearby";
import type { Coords } from "@/lib/feed/filters";
import { cn } from "@/lib/utils";

const POSTS_PAGE_SIZE = 20;

function PlayerList({ title, players }: { title: string; players: Profile[] }) {
  return (
    <section className="space-y-3">
      <h2 className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
        {title} ({players.length})
      </h2>
      {players.length === 0 ? (
        <div className="rondo-surface p-4">
          <p className="text-muted-foreground text-sm">No players yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {players.map((player) => (
            <Link
              key={player.id}
              href={`/profile/${player.id}`}
              className="flex items-center gap-3 bg-card border border-border hover:border-rondo-accent/40 rounded-xl p-3 transition-colors"
            >
              <PlayerAvatar profile={player} size="sm" showFlag linkable={false} />
              <div className="min-w-0">
                <p className="text-white text-sm font-semibold truncate">
                  {player.full_name ?? "Player"}
                </p>
                <p className="text-muted-foreground text-xs truncate">
                  {player.nationality ?? "No nationality yet"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

export default function CommunityPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"feed" | "players">("feed");
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [hasMorePosts, setHasMorePosts] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [following, setFollowing] = useState<Profile[]>([]);
  const [followers, setFollowers] = useState<Profile[]>([]);
  const [nearby, setNearby] = useState<NearbyPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(false);
  const [locationDenied, setLocationDenied] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState(false);

  const loadPosts = useCallback(async (offset = 0) => {
    const supabase = createClient();
    const { data } = await supabase
      .from("posts")
      .select(
        `*, author:profiles!author_id(${PUBLIC_PROFILE_SELECT}), post_likes(user_id), post_comments(count)`
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + POSTS_PAGE_SIZE - 1);

    const rows = (data as Post[]) ?? [];
    setHasMorePosts(rows.length === POSTS_PAGE_SIZE);
    if (offset === 0) {
      setPosts(rows);
    } else {
      setPosts((prev) => [...prev, ...rows]);
    }
    setPostsLoading(false);
  }, []);

  const loadSocial = useCallback(async (uid: string) => {
    const supabase = createClient();
    const [{ data: followingRows }, { data: followerRows }] = await Promise.all([
      supabase.from("follows").select("following_id").eq("follower_id", uid),
      supabase.from("follows").select("follower_id").eq("following_id", uid),
    ]);

    const followingIds = (followingRows ?? []).map((row) => row.following_id);
    const followerIds = (followerRows ?? []).map((row) => row.follower_id);

    const [followingProfiles, followerProfiles] = await Promise.all([
      followingIds.length > 0
        ? supabase.from("profiles").select("*").in("id", followingIds)
        : Promise.resolve({ data: [] as Profile[] }),
      followerIds.length > 0
        ? supabase.from("profiles").select("*").in("id", followerIds)
        : Promise.resolve({ data: [] as Profile[] }),
    ]);

    setFollowing((followingProfiles.data as Profile[]) ?? []);
    setFollowers((followerProfiles.data as Profile[]) ?? []);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;

      if (!uid) {
        router.push("/login");
        return;
      }
      if (cancelled) return;

      setCurrentUserId(uid);
      setIsGuest(isGuestUser(userData.user));
      setLoading(false);

      loadPosts().catch(() => {
        if (!cancelled) setPostsLoading(false);
      });
      loadSocial(uid).catch(() => {
        if (!cancelled) {
          setFollowing([]);
          setFollowers([]);
        }
      });
    }
    init();

    return () => {
      cancelled = true;
    };
  }, [router, loadSocial, loadPosts]);

  const loadMorePosts = useCallback(async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    await loadPosts(posts.length);
    setLoadingMore(false);
  }, [loadingMore, loadPosts, posts.length]);

  // Infinite scroll: fetch the next page when the sentinel below the list
  // comes into view. The button stays as a fallback.
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || tab !== "feed" || !hasMorePosts) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMorePosts();
      },
      { rootMargin: "400px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [tab, hasMorePosts, loadMorePosts]);

  const findNearbyPlayers = useCallback(() => {
    if (!("geolocation" in navigator)) return;
    setLocating(true);
    setLocationDenied(false);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords: Coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };

        await fetch("/api/profile/location", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(coords),
        });

        const supabase = createClient();
        const { data: players } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url, nationality, role, location_hidden, last_lat, last_lng")
          .eq("role", "player")
          .eq("location_hidden", false)
          .not("last_lat", "is", null)
          .not("last_lng", "is", null)
          .limit(80);

        const sorted = sortProfilesByDistance(
          (players as Profile[]) ?? [],
          coords,
          currentUserId
        ).slice(0, 12);

        setNearby(sorted);
        setLocating(false);
      },
      () => {
        setLocationDenied(true);
        setLocating(false);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 120000 }
    );
  }, [currentUserId]);

  return (
    <div className="min-h-[100dvh] rondo-page pb-20">
      <header className="sticky top-0 rondo-glass-nav border-b border-white/5 z-40 px-4 py-3">
        <div className="flex items-center justify-between gap-2 max-w-lg mx-auto">
          <div className="flex items-center gap-2.5">
            <Users size={18} className="text-rondo-accent" />
            <h1 className="text-white font-black text-lg">Community</h1>
          </div>
          <div className="flex gap-1.5">
            {(
              [
                { value: "feed", label: "Feed" },
                { value: "players", label: "Players" },
              ] as const
            ).map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setTab(value)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
                  tab === value
                    ? "border-rondo-accent/60 bg-rondo-accent/15 text-rondo-accent"
                    : "border-white/10 text-white/40"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="px-4 py-5 space-y-6 max-w-lg mx-auto">
        {tab === "feed" ? (
          <>
            {isGuest ? (
              <div className="rondo-surface p-4 space-y-2">
                <p className="text-white/70 text-sm">
                  Create an account to post results, highlights, and shout-outs.
                </p>
                <Link href="/signup" className="text-rondo-accent text-xs font-bold">
                  Sign up →
                </Link>
              </div>
            ) : (
              <PostComposer onPosted={() => loadPosts()} />
            )}

            {postsLoading ? (
              <div className="space-y-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-28 bg-card border border-border rounded-xl animate-pulse" />
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="rondo-surface p-6 text-center space-y-1">
                <p className="text-white/70 text-sm font-semibold">Nothing here yet</p>
                <p className="text-muted-foreground text-xs">
                  Be the first to share a result or a highlight from your last match.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    currentUserId={currentUserId}
                    onDeleted={(postId) =>
                      setPosts((prev) => prev.filter((p) => p.id !== postId))
                    }
                  />
                ))}
                {hasMorePosts && (
                  <div ref={sentinelRef}>
                    <button
                      type="button"
                      onClick={loadMorePosts}
                      disabled={loadingMore}
                      className="w-full rounded-xl border border-white/10 py-2.5 text-white/60 text-xs font-semibold disabled:opacity-50"
                    >
                      {loadingMore ? "Loading…" : "Load more"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <>
            <section className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                  Players near you
                </h2>
                {nearby.length === 0 && (
                  <button
                    type="button"
                    onClick={findNearbyPlayers}
                    disabled={locating}
                    className="text-rondo-accent text-xs font-semibold disabled:opacity-50"
                  >
                    {locating ? "Locating…" : "Find nearby"}
                  </button>
                )}
              </div>

              {nearby.length === 0 ? (
                <div className="rondo-surface p-4 space-y-2">
                  <p className="text-white/70 text-sm">
                    Distance is only shown when you ask — we never track you in the background.
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Players who hide location won&apos;t appear. Turn off hiding in your profile if you
                    want to be discoverable.
                  </p>
                  {locationDenied && (
                    <p className="text-amber-200/80 text-xs">Location permission was denied.</p>
                  )}
                  <button
                    type="button"
                    onClick={findNearbyPlayers}
                    disabled={locating}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-rondo-accent text-black px-4 py-2 text-xs font-bold disabled:opacity-50"
                  >
                    <MapPin size={13} />
                    {locating ? "Locating…" : "Use my location once"}
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {nearby.map((player) => (
                    <Link
                      key={player.id}
                      href={`/profile/${player.id}`}
                      className="flex items-center gap-3 bg-card border border-border hover:border-rondo-accent/40 rounded-xl p-3 transition-colors"
                    >
                      <PlayerAvatar profile={player} size="sm" showFlag linkable={false} />
                      <div className="min-w-0 flex-1">
                        <p className="text-white text-sm font-semibold truncate">
                          {player.full_name ?? "Player"}
                        </p>
                        <p className="text-rondo-accent text-xs">{formatPlayerDistance(player.distanceKm)}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            {loading ? (
              <div className="space-y-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-16 bg-card border border-border rounded-xl animate-pulse" />
                ))}
              </div>
            ) : (
              <>
                <PlayerList title="Friends" players={following} />
                <PlayerList title="Following You" players={followers} />
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
