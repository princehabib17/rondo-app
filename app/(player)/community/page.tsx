"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/supabase/types";
import { PlayerAvatar } from "@/components/game/PlayerAvatar";

export default function CommunityPage() {
  const router = useRouter();
  const [following, setFollowing] = useState<Profile[]>([]);
  const [followers, setFollowers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCommunity() {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;

      if (!uid) {
        router.push("/login");
        return;
      }

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
      setLoading(false);
    }

    loadCommunity();
  }, [router]);

  function PlayerList({ title, players }: { title: string; players: Profile[] }) {
    return (
      <section className="space-y-3">
        <h2 className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
          {title} ({players.length})
        </h2>
        {players.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-4">
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
                  <p className="text-white text-sm font-semibold truncate">{player.full_name ?? "Player"}</p>
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

  return (
    <div className="min-h-[100dvh]">
      <header className="sticky top-0 bg-background/90 backdrop-blur-md border-b border-border z-40 px-4 py-3">
        <div className="flex items-center gap-2.5 max-w-lg mx-auto">
          <Users size={18} className="text-rondo-accent" />
          <h1 className="text-white font-black text-lg">Community</h1>
        </div>
      </header>

      <div className="px-4 py-5 space-y-8 max-w-lg mx-auto">
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
      </div>
    </div>
  );
}
