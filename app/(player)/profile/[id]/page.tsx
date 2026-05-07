"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, UserPlus, UserMinus, MapPin, Trophy } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getFlagEmoji } from "@/lib/utils/format";
import type { Profile } from "@/lib/supabase/types";

export default function PublicProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [gamesPlayed, setGamesPlayed] = useState(0);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id ?? null;
      setCurrentUserId(uid);

      const [{ data: profileData }, { count }, { data: followData }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", id).single(),
        supabase.from("game_players").select("id", { count: "exact", head: true }).eq("user_id", id),
        uid ? supabase.from("follows").select("follower_id").eq("follower_id", uid).eq("following_id", id).maybeSingle() : Promise.resolve({ data: null }),
      ]);

      setProfile(profileData as Profile);
      setGamesPlayed(count ?? 0);
      setIsFollowing(!!followData);
      setLoading(false);
    }
    load();
  }, [id]);

  async function handleFollow() {
    if (!currentUserId || followLoading) return;
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

  return (
    <div className="min-h-[100dvh] pb-8">
      <header className="sticky top-0 bg-background/90 backdrop-blur-md border-b border-border z-40 px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="min-w-[44px] min-h-[44px] flex items-center justify-center text-white hover:text-rondo-yellow transition-colors cursor-pointer" aria-label="Back">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-white font-bold text-base flex-1 truncate">{profile.full_name}</h1>
        {!isOwnProfile && currentUserId && (
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
          <button
            onClick={() => router.push("/onboarding/profile")}
            className="w-full border border-border text-muted-foreground hover:text-white hover:border-border/80 text-sm py-3 rounded-xl active:scale-[0.98] transition-all cursor-pointer min-h-[44px]"
          >
            Edit Profile
          </button>
        )}
      </div>
    </div>
  );
}
