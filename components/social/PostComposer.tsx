"use client";

import { useState } from "react";
import { Clapperboard, Send } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { POST_BODY_MAX } from "@/lib/social/post-schema";

interface PostComposerProps {
  onPosted: () => void;
}

export function PostComposer({ onPosted }: PostComposerProps) {
  const [body, setBody] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [isHighlight, setIsHighlight] = useState(false);
  const [showMediaInput, setShowMediaInput] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    const trimmed = body.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: trimmed,
          kind: isHighlight ? "highlight" : "post",
          ...(mediaUrl.trim() ? { mediaUrl: mediaUrl.trim() } : {}),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Could not post");
        return;
      }
      setBody("");
      setMediaUrl("");
      setIsHighlight(false);
      setShowMediaInput(false);
      onPosted();
    } catch {
      toast.error("Could not post");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rondo-surface p-3 space-y-2">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value.slice(0, POST_BODY_MAX))}
        placeholder="Share a result, a highlight, or find players…"
        rows={2}
        className="w-full bg-transparent text-white text-sm placeholder:text-white/30 resize-none outline-none"
      />
      {showMediaInput && (
        <input
          type="url"
          value={mediaUrl}
          onChange={(e) => setMediaUrl(e.target.value)}
          placeholder="https:// link to a photo or clip"
          className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-xs placeholder:text-white/30 outline-none focus:border-rondo-accent/40"
        />
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsHighlight((v) => !v)}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors",
              isHighlight
                ? "border-rondo-accent/60 bg-rondo-accent/15 text-rondo-accent"
                : "border-white/10 text-white/40"
            )}
          >
            <Clapperboard size={12} />
            Highlight
          </button>
          <button
            type="button"
            onClick={() => setShowMediaInput((v) => !v)}
            className={cn(
              "rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors",
              showMediaInput
                ? "border-rondo-accent/60 bg-rondo-accent/15 text-rondo-accent"
                : "border-white/10 text-white/40"
            )}
          >
            + Media link
          </button>
        </div>
        <button
          type="button"
          onClick={submit}
          disabled={!body.trim() || submitting}
          className="inline-flex items-center gap-1.5 rounded-full bg-rondo-accent text-black px-4 py-1.5 text-xs font-bold disabled:opacity-40"
        >
          <Send size={12} />
          {submitting ? "Posting…" : "Post"}
        </button>
      </div>
    </div>
  );
}
