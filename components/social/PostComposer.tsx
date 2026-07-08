"use client";

import { useState } from "react";
import { Clapperboard, PaperPlaneRight } from "@phosphor-icons/react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { POST_BODY_MAX } from "@/lib/social/post-schema";

interface PostComposerProps {
  onPosted: () => void;
  gameId?: string;
  tournamentId?: string;
  defaultKind?: "post" | "highlight" | "match_result";
}

export function PostComposer({ onPosted, gameId, tournamentId, defaultKind = "post" }: PostComposerProps) {
  const [body, setBody] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [isHighlight, setIsHighlight] = useState(defaultKind === "highlight");
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
          kind: defaultKind === "match_result" ? "match_result" : isHighlight ? "highlight" : "post",
          ...(gameId ? { gameId } : {}),
          ...(tournamentId ? { tournamentId } : {}),
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
    <div className="rondo-surface space-y-3 p-4">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value.slice(0, POST_BODY_MAX))}
        placeholder={tournamentId ? "Post to this tournament" : "Share a result, a highlight, or find players"}
        rows={2}
        className="w-full resize-none bg-transparent rondo-body text-[var(--ink-hi)] outline-none placeholder:text-[var(--ink-low)]"
      />
      {showMediaInput && (
        <input
          type="url"
          value={mediaUrl}
          onChange={(e) => setMediaUrl(e.target.value)}
          placeholder="https:// link to a photo or clip"
          className="h-12 w-full rounded-[var(--r-sm)] border border-transparent bg-[var(--bg-inset)] px-4 rondo-body text-[var(--ink-hi)] outline-none placeholder:text-[var(--ink-low)] focus:border-[var(--gold)]"
        />
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsHighlight((v) => !v)}
            className={cn(
              "inline-flex h-8 items-center gap-1 rounded-[var(--r-pill)] border px-3 rondo-label transition-colors",
              isHighlight
                ? "border-[var(--gold)] bg-[var(--gold-dim)] text-[var(--gold)]"
                : "border-[var(--stroke)] text-[var(--ink-low)]"
            )}
          >
            <Clapperboard size={14} />
            Highlight
          </button>
          <button
            type="button"
            onClick={() => setShowMediaInput((v) => !v)}
            className={cn(
              "h-8 rounded-[var(--r-pill)] border px-3 rondo-label transition-colors",
              showMediaInput
                ? "border-[var(--gold)] bg-[var(--gold-dim)] text-[var(--gold)]"
                : "border-[var(--stroke)] text-[var(--ink-low)]"
            )}
          >
            + Media link
          </button>
        </div>
        <button
          type="button"
          onClick={submit}
          disabled={!body.trim() || submitting}
          className="inline-flex h-10 items-center gap-2 rounded-[var(--r-pill)] bg-[var(--gold)] px-4 rondo-meta font-bold text-[var(--gold-ink)] disabled:opacity-40"
        >
          <PaperPlaneRight size={16} weight="fill" />
          {submitting ? "Posting..." : "Post"}
        </button>
      </div>
    </div>
  );
}
