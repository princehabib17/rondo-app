"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Clapperboard, Heart, MessageCircle, Trash2, Trophy } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { PUBLIC_PROFILE_SELECT } from "@/lib/supabase/profile-select";
import type { Post, PostComment } from "@/lib/supabase/types";
import { PlayerAvatar } from "@/components/game/PlayerAvatar";
import { formatRelativeTime } from "@/lib/utils/format";
import { COMMENT_BODY_MAX } from "@/lib/social/post-schema";

interface PostCardProps {
  post: Post;
  currentUserId: string | null;
  onDeleted: (postId: string) => void;
}

export function PostCard({ post, currentUserId, onDeleted }: PostCardProps) {
  const initialLikes = post.post_likes ?? [];
  const [likeCount, setLikeCount] = useState(initialLikes.length);
  const [liked, setLiked] = useState(
    currentUserId ? initialLikes.some((l) => l.user_id === currentUserId) : false
  );
  const [commentCount, setCommentCount] = useState(post.post_comments?.[0]?.count ?? 0);
  const [comments, setComments] = useState<PostComment[] | null>(null);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentBody, setCommentBody] = useState("");
  const [sendingComment, setSendingComment] = useState(false);

  async function toggleLike() {
    // Optimistic flip; revert on failure.
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount((c) => c + (wasLiked ? -1 : 1));
    const res = await fetch(`/api/posts/${post.id}/like`, { method: "POST" });
    if (!res.ok) {
      setLiked(wasLiked);
      setLikeCount((c) => c + (wasLiked ? 1 : -1));
      const json = await res.json().catch(() => null);
      toast.error(json?.error ?? "Could not like post");
    }
  }

  async function loadComments() {
    const supabase = createClient();
    const { data } = await supabase
      .from("post_comments")
      .select(`*, author:profiles!author_id(${PUBLIC_PROFILE_SELECT})`)
      .eq("post_id", post.id)
      .order("created_at", { ascending: true })
      .limit(50);
    setComments((data as PostComment[]) ?? []);
  }

  async function openComments() {
    const next = !commentsOpen;
    setCommentsOpen(next);
    if (next && comments === null) await loadComments();
  }

  async function sendComment() {
    const body = commentBody.trim();
    if (!body || sendingComment) return;
    setSendingComment(true);
    try {
      const res = await fetch(`/api/posts/${post.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Could not comment");
        return;
      }
      setCommentBody("");
      setCommentCount((c) => c + 1);
      await loadComments();
    } finally {
      setSendingComment(false);
    }
  }

  async function deletePost() {
    const res = await fetch(`/api/posts/${post.id}`, { method: "DELETE" });
    if (res.ok) {
      onDeleted(post.id);
    } else {
      toast.error("Could not delete post");
    }
  }

  return (
    <article className="rondo-surface p-4 space-y-3">
      <div className="flex items-start gap-3">
        {post.author && (
          <Link href={`/profile/${post.author_id}`}>
            <PlayerAvatar profile={post.author} size="sm" showFlag linkable={false} />
          </Link>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Link
              href={`/profile/${post.author_id}`}
              className="text-white text-sm font-semibold truncate"
            >
              {post.author?.full_name ?? "Player"}
            </Link>
            {post.kind === "highlight" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-rondo-accent/15 text-rondo-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">
                <Clapperboard size={10} />
                Highlight
              </span>
            )}
            {post.kind === "match_result" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-rondo-accent/15 text-rondo-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">
                <Trophy size={10} />
                Result
              </span>
            )}
          </div>
          <p className="text-muted-foreground text-xs">{formatRelativeTime(post.created_at)}</p>
        </div>
        {currentUserId === post.author_id && (
          <button
            type="button"
            onClick={deletePost}
            aria-label="Delete post"
            className="text-white/25 hover:text-red-400 transition-colors p-1"
          >
            <Trash2 size={15} />
          </button>
        )}
      </div>

      <p className="text-white/85 text-sm whitespace-pre-wrap break-words">{post.body}</p>

      {post.media_url && (
        <a
          href={post.media_url}
          target="_blank"
          rel="noopener noreferrer"
          className="relative block aspect-video max-h-72 overflow-hidden rounded-xl border border-white/10"
        >
          <Image
            src={post.media_url}
            alt="Post media"
            fill
            unoptimized
            className="object-cover"
            sizes="(max-width: 512px) 100vw, 512px"
          />
        </a>
      )}

      <div className="flex items-center gap-5 pt-1">
        <button
          type="button"
          onClick={toggleLike}
          className={cn(
            "inline-flex items-center gap-1.5 text-xs font-semibold transition-colors",
            liked ? "text-rondo-accent" : "text-white/40 hover:text-white/70"
          )}
        >
          <Heart size={15} className={liked ? "fill-current" : ""} />
          {likeCount}
        </button>
        <button
          type="button"
          onClick={openComments}
          className="inline-flex items-center gap-1.5 text-white/40 hover:text-white/70 text-xs font-semibold transition-colors"
        >
          <MessageCircle size={15} />
          {commentCount}
        </button>
      </div>

      {commentsOpen && (
        <div className="space-y-3 border-t border-white/5 pt-3">
          {comments === null ? (
            <div className="h-8 rounded-lg bg-white/5 animate-pulse" />
          ) : comments.length === 0 ? (
            <p className="text-muted-foreground text-xs">No comments yet — be the first.</p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex items-start gap-2">
                {comment.author && (
                  <PlayerAvatar profile={comment.author} size="xs" showFlag={false} linkable={false} />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-white text-xs font-semibold">
                    {comment.author?.full_name ?? "Player"}{" "}
                    <span className="text-muted-foreground font-normal">
                      {formatRelativeTime(comment.created_at)}
                    </span>
                  </p>
                  <p className="text-white/75 text-xs break-words">{comment.body}</p>
                </div>
              </div>
            ))
          )}
          {currentUserId && (
            <div className="flex items-center gap-2">
              <input
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value.slice(0, COMMENT_BODY_MAX))}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendComment();
                  }
                }}
                placeholder="Add a comment…"
                className="flex-1 bg-black/30 border border-white/10 rounded-full px-3 py-1.5 text-white text-xs placeholder:text-white/30 outline-none focus:border-rondo-accent/40"
              />
              <button
                type="button"
                onClick={sendComment}
                disabled={!commentBody.trim() || sendingComment}
                className="text-rondo-accent text-xs font-bold disabled:opacity-40"
              >
                Send
              </button>
            </div>
          )}
        </div>
      )}
    </article>
  );
}
