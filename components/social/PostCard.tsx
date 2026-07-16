"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChatCircle, Trash, Trophy, VideoCamera } from "@phosphor-icons/react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { PUBLIC_PROFILE_SELECT } from "@/lib/supabase/profile-select";
import type { Post, PostComment } from "@/lib/supabase/types";
import { PlayerAvatar } from "@/components/game/PlayerAvatar";
import { formatGameHeadline, formatRelativeTime } from "@/lib/utils/format";
import { COMMENT_BODY_MAX } from "@/lib/social/post-schema";
import { Chip, KudosButton } from "@/components/rondo/primitives";

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
    <article className="rondo-surface space-y-3 p-4">
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
              className="rondo-body truncate font-bold text-[var(--ink-hi)]"
            >
              {post.author?.full_name ?? "Player"}
            </Link>
            {post.kind === "highlight" && (
              <Chip label="Highlight" variant="outline" size="sm" icon={<VideoCamera size={14} />} />
            )}
            {post.kind === "match_result" && (
              <Chip label="Result" variant="outline" size="sm" icon={<Trophy size={14} />} />
            )}
          </div>
          <p className="rondo-meta text-[var(--ink-low)]">{formatRelativeTime(post.created_at)}</p>
        </div>
        {currentUserId === post.author_id && (
          <button
            type="button"
            onClick={deletePost}
            aria-label="Delete post"
            className="p-1 text-[var(--ink-low)] transition-colors hover:text-[var(--live)]"
          >
            <Trash size={16} />
          </button>
        )}
      </div>

      {(post.tournament || post.game) && (
        <div className="flex flex-wrap gap-2">
          {post.tournament && (
            <Link href={`/tournaments/${post.tournament.id}`}>
              <Chip label={post.tournament.name} variant="outline" size="sm" icon={<Trophy size={14} />} />
            </Link>
          )}
          {post.game && (
            <Link href={`/games/${post.game.id}`}>
              <Chip label={formatGameHeadline(post.game.date_time)} variant="ghost" size="sm" />
            </Link>
          )}
        </div>
      )}

      <p className="whitespace-pre-wrap break-words rondo-body text-[var(--ink-mid)]">{post.body}</p>

      {post.media_url && (
        <a href={post.media_url} target="_blank" rel="noopener noreferrer" className="block">
          <Image
            src={post.media_url}
            alt="Post media"
            width={800}
            height={450}
            unoptimized
            className="max-h-72 w-full rounded-[var(--r-sm)] border border-[var(--stroke)] object-cover"
          />
        </a>
      )}

      <div className="flex items-center gap-5 pt-1">
        <KudosButton count={likeCount} active={liked} onToggle={toggleLike} />
        <button
          type="button"
          onClick={openComments}
          className="inline-flex min-h-11 items-center gap-2 rondo-meta font-bold text-[var(--ink-low)] transition-colors hover:text-[var(--ink-mid)]"
        >
          <ChatCircle size={20} />
          {commentCount}
        </button>
      </div>

      {commentsOpen && (
        <div className="space-y-3 border-t border-[var(--stroke)] pt-3">
          {comments === null ? (
            <div className="h-8 rounded-[var(--r-sm)] rondo-shimmer" />
          ) : comments.length === 0 ? (
            <p className="rondo-meta text-[var(--ink-low)]">No comments yet. Be first.</p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex items-start gap-2">
                {comment.author && (
                  <PlayerAvatar profile={comment.author} size="xs" showFlag={false} linkable={false} />
                )}
                <div className="min-w-0 flex-1">
                  <p className="rondo-meta font-bold text-[var(--ink-hi)]">
                    {comment.author?.full_name ?? "Player"}{" "}
                    <span className="font-normal text-[var(--ink-low)]">
                      {formatRelativeTime(comment.created_at)}
                    </span>
                  </p>
                  <p className="break-words rondo-meta text-[var(--ink-mid)]">{comment.body}</p>
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
                placeholder="Add a comment"
                className="h-10 flex-1 rounded-[var(--r-pill)] border border-transparent bg-[var(--bg-inset)] px-3 rondo-meta text-[var(--ink-hi)] outline-none placeholder:text-[var(--ink-low)] focus:border-[var(--gold)]"
              />
              <button
                type="button"
                onClick={sendComment}
                disabled={!commentBody.trim() || sendingComment}
                className="rondo-meta font-bold text-[var(--gold)] disabled:opacity-40"
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
