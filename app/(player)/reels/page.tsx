"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PlusCircle, Bookmark } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { isScoutUser } from "@/lib/auth/is-scout";
import { ReelPlayer } from "@/components/reels/ReelPlayer";
import { ReelUploadModal } from "@/components/reels/ReelUploadModal";
import type { PlayerReel } from "@/lib/supabase/types";
import { toast } from "sonner";

export default function ReelsPage() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [reels, setReels] = useState<PlayerReel[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isScout, setIsScout] = useState(false);
  const [isPlayer, setIsPlayer] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [shortlisted, setShortlisted] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const offset = useRef(0);
  const PAGE = 10;

  const fetchReels = useCallback(async (reset = false) => {
    if (reset) offset.current = 0;
    const res = await fetch(`/api/reels?limit=${PAGE}&offset=${offset.current}`);
    if (!res.ok) return;
    const json = await res.json() as { reels: PlayerReel[] };
    const fetched = json.reels ?? [];
    setReels((prev) => reset ? fetched : [...prev, ...fetched]);
    setHasMore(fetched.length === PAGE);
    offset.current += fetched.length;
  }, []);

  useEffect(() => {
    async function init() {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      setCurrentUserId(user?.id ?? null);
      const scout = isScoutUser(user);
      setIsScout(scout);

      if (user?.id && !user.is_anonymous) {
        const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
        setIsPlayer(profile?.role === "player");
      }

      // Load scout shortlist for any logged-in user
      if (user?.id) {
        const res = await fetch("/api/scout/shortlist");
        if (res.ok) {
          const json = await res.json() as { shortlist: { player_id: string }[] };
          setShortlisted(new Set(json.shortlist.map((s) => s.player_id)));
        }
      }

      await fetchReels(true);
      setLoading(false);
    }
    init();
  }, [fetchReels]);

  // Track active reel via scroll position
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const onScroll = () => {
      const idx = Math.round(container.scrollTop / window.innerHeight);
      setActiveIndex(idx);
      // Load more when near end
      if (idx >= reels.length - 3 && hasMore && !loadingMore) {
        setLoadingMore(true);
        fetchReels().then(() => setLoadingMore(false));
      }
    };
    container.addEventListener("scroll", onScroll, { passive: true });
    return () => container.removeEventListener("scroll", onScroll);
  }, [reels.length, hasMore, loadingMore, fetchReels]);

  async function handleLikeToggle(reelId: string) {
    if (!currentUserId) {
      toast("Sign in to like reels");
      return;
    }
    await fetch(`/api/reels/${reelId}/like`, { method: "POST" });
  }

  async function handleShortlistToggle(playerId: string) {
    if (!currentUserId) {
      router.push("/login");
      return;
    }
    const res = await fetch("/api/scout/shortlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ player_id: playerId }),
    });
    if (!res.ok) return;
    const json = await res.json() as { shortlisted: boolean };
    setShortlisted((prev) => {
      const next = new Set(prev);
      if (json.shortlisted) next.add(playerId);
      else next.delete(playerId);
      return next;
    });
    toast(json.shortlisted ? "Player shortlisted" : "Removed from shortlist");
  }

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-black flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-rondo-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className="min-h-[100dvh] bg-black flex flex-col items-center justify-center gap-4 px-8 text-center">
        <p className="font-heading text-white font-black italic text-2xl uppercase">No Reels Yet</p>
        <p className="font-body text-white/50 text-sm">
          Players haven&apos;t posted any skill clips yet. Check back soon.
        </p>
        {isPlayer && (
          <button
            onClick={() => setShowUpload(true)}
            className="mt-4 bg-rondo-accent text-black font-bold px-6 py-3 rounded-xl"
          >
            Be the first — post a reel
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="relative bg-black overflow-hidden" style={{ height: "100dvh" }}>
      {/* Scroll container — vertical snap */}
      <div
        ref={containerRef}
        className="h-full overflow-y-scroll"
        style={{ scrollSnapType: "y mandatory", WebkitOverflowScrolling: "touch" }}
      >
        {reels.map((reel, idx) => (
          <ReelPlayer
            key={reel.id}
            reel={reel}
            isActive={idx === activeIndex}
            currentUserId={currentUserId}
            isScout={isScout}
            onLikeToggle={handleLikeToggle}
            onShortlistToggle={handleShortlistToggle}
            isShortlisted={shortlisted.has(reel.player_id)}
          />
        ))}
        {loadingMore && (
          <div className="h-20 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-rondo-accent border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* FAB: upload reel (players only) */}
      {isPlayer && (
        <button
          onClick={() => setShowUpload(true)}
          className="absolute top-14 right-4 w-10 h-10 rounded-full bg-rondo-accent text-black flex items-center justify-center shadow-lg z-20"
        >
          <PlusCircle size={20} />
        </button>
      )}

      {/* Scout shortlist CTA */}
      {isScout && (
        <button
          onClick={() => router.push("/scout/shortlist")}
          className="absolute top-14 left-4 flex items-center gap-1.5 bg-black/60 border border-rondo-accent/30 text-rondo-accent text-xs font-semibold px-3 py-2 rounded-full z-20"
        >
          <Bookmark size={14} />
          Shortlist ({shortlisted.size})
        </button>
      )}

      {showUpload && currentUserId && (
        <ReelUploadModal
          userId={currentUserId}
          onClose={() => setShowUpload(false)}
          onUploaded={() => fetchReels(true)}
        />
      )}
    </div>
  );
}
