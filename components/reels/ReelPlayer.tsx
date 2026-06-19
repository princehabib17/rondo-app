"use client";

import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, Bookmark, Volume2, VolumeX } from "lucide-react";
import { getFlagEmoji } from "@/lib/utils/format";
import type { PlayerReel } from "@/lib/supabase/types";

interface ReelPlayerProps {
  reel: PlayerReel;
  isActive: boolean;
  currentUserId: string | null;
  isScout: boolean;
  onLikeToggle: (reelId: string) => void;
  onShortlistToggle: (playerId: string) => void;
  isShortlisted: boolean;
}

export function ReelPlayer({
  reel,
  isActive,
  currentUserId,
  isScout,
  onLikeToggle,
  onShortlistToggle,
  isShortlisted,
}: ReelPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [likeCount, setLikeCount] = useState(reel.reel_likes?.length ?? 0);
  const [liked, setLiked] = useState(
    !!currentUserId && (reel.reel_likes?.some((l) => l.user_id === currentUserId) ?? false)
  );
  const player = reel.player;
  const flag = player?.nationality ? getFlagEmoji(player.nationality) : "";

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isActive) {
      video.currentTime = 0;
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [isActive]);

  function toggleMute() {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
  }

  function handleLike() {
    if (!currentUserId) return;
    const nowLiked = !liked;
    setLiked(nowLiked);
    setLikeCount((c) => c + (nowLiked ? 1 : -1));
    onLikeToggle(reel.id);
  }

  return (
    <div
      className="relative w-full bg-black flex-shrink-0 overflow-hidden"
      style={{ height: "100dvh", scrollSnapAlign: "start" }}
    >
      <video
        ref={videoRef}
        src={reel.video_url}
        muted={muted}
        loop
        playsInline
        preload="metadata"
        className="w-full h-full object-cover"
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />

      {/* Mute toggle */}
      <button
        onClick={toggleMute}
        className="absolute top-14 right-4 w-10 h-10 rounded-full bg-black/40 flex items-center justify-center text-white z-10"
      >
        {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
      </button>

      {/* Bottom: player info + actions */}
      <div className="absolute bottom-0 left-0 right-0 p-4 pb-28 z-10">
        <div className="flex items-end justify-between gap-4">
          {/* Player info */}
          <div className="flex-1 min-w-0">
            <Link href={`/profile/${player?.id}`} className="flex items-center gap-2 mb-2">
              <div className="relative shrink-0">
                <div className="w-10 h-10 relative rounded-full bg-secondary border border-white/20 overflow-hidden flex items-center justify-center">
                  {player?.avatar_url ? (
                    <Image src={player.avatar_url} alt="" fill className="object-cover" sizes="40px" />
                  ) : (
                    <span className="text-white font-black text-sm">
                      {(player?.full_name ?? "?")[0]}
                    </span>
                  )}
                </div>
                {flag && (
                  <span className="absolute -bottom-0.5 -right-0.5 text-sm leading-none">{flag}</span>
                )}
              </div>
              <div>
                <p className="text-white font-bold text-sm leading-tight drop-shadow-md">
                  {player?.full_name}
                </p>
                {(reel.position ?? player?.position) && (
                  <p className="text-white/60 text-xs capitalize">
                    {reel.position ?? player?.position}
                  </p>
                )}
              </div>
            </Link>
            {reel.caption && (
              <p className="text-white/90 text-sm leading-snug line-clamp-2 drop-shadow-md">
                {reel.caption}
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-col items-center gap-5 shrink-0">
            <button
              onClick={handleLike}
              disabled={!currentUserId}
              className="flex flex-col items-center gap-1 disabled:opacity-40"
            >
              <Heart
                size={28}
                strokeWidth={1.75}
                className={liked ? "fill-red-500 text-red-500" : "text-white drop-shadow-md"}
              />
              <span className="text-white text-xs font-semibold drop-shadow-md">{likeCount}</span>
            </button>

            {currentUserId && (
              <button
                onClick={() => onShortlistToggle(reel.player_id)}
                className="flex flex-col items-center gap-1"
              >
                <Bookmark
                  size={28}
                  strokeWidth={1.75}
                  className={
                    isShortlisted
                      ? "fill-rondo-accent text-rondo-accent"
                      : "text-white drop-shadow-md"
                  }
                />
                <span className="text-white text-xs font-semibold drop-shadow-md">
                  {isShortlisted ? "Saved" : "Save"}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
