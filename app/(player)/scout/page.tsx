"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Bookmark,
  Check,
  ChevronUp,
  Heart,
  Loader2,
  MessageCircle,
  Plus,
  Search,
  ShieldCheck,
  Upload,
  UserRound,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { isGuestUser } from "@/lib/auth/is-guest";
import type { ScoutClip, ScoutReactionKind } from "@/lib/supabase/types";
import { PlayerAvatar } from "@/components/game/PlayerAvatar";
import { cn } from "@/lib/utils";
import { SCOUT_CLIP_CAPTION_MAX } from "@/lib/scout/clip-schema";

type ScoutClipWithCounts = ScoutClip & {
  likes: number;
  saves: number;
  scouts: number;
};

function countsFor(clip: ScoutClip): ScoutClipWithCounts {
  const reactions = clip.scout_clip_reactions ?? [];
  return {
    ...clip,
    likes: reactions.filter((r) => r.kind === "like").length,
    saves: reactions.filter((r) => r.kind === "save").length,
    scouts: reactions.filter((r) => r.kind === "scout").length,
  };
}

function userReacted(clip: ScoutClip, userId: string | null, kind: ScoutReactionKind) {
  return Boolean(userId && clip.scout_clip_reactions?.some((r) => r.user_id === userId && r.kind === kind));
}

function ClipAction({
  icon: Icon,
  label,
  count,
  active,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  count?: number;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className="flex flex-col items-center gap-1 text-white">
      <span
        className={cn(
          "grid h-12 w-12 place-items-center rounded-full border backdrop-blur-md transition-colors",
          active
            ? "border-rondo-accent bg-rondo-accent text-black"
            : "border-white/16 bg-black/45 text-white"
        )}
      >
        <Icon size={22} fill={active && Icon === Heart ? "currentColor" : "none"} />
      </span>
      <span className="font-heading text-[0.68rem] font-black uppercase leading-none text-white/82">
        {count == null ? label : count}
      </span>
    </button>
  );
}

function UploadSheet({
  open,
  onClose,
  onCreated,
  currentUserId,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  currentUserId: string | null;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [position, setPosition] = useState("");
  const [tags, setTags] = useState("first touch, finishing");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (submitting) return;
    setSubmitting(true);
    try {
      let nextVideoUrl = videoUrl.trim();
      if (file) {
        if (!currentUserId) {
          toast.error("Sign in to upload a video file");
          return;
        }
        const supabase = createClient();
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
        const path = `${currentUserId}/${crypto.randomUUID()}-${safeName}`;
        const { error: uploadError } = await supabase.storage
          .from("scout-clips")
          .upload(path, file, { contentType: file.type, upsert: false });
        if (uploadError) {
          toast.error(uploadError.message);
          return;
        }
        nextVideoUrl = supabase.storage.from("scout-clips").getPublicUrl(path).data.publicUrl;
      }

      const res = await fetch("/api/scout-clips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoUrl: nextVideoUrl,
          thumbnailUrl: thumbnailUrl.trim(),
          caption: caption.trim(),
          position: position.trim(),
          skillTags: tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Could not publish clip");
        return;
      }
      setFile(null);
      setVideoUrl("");
      setThumbnailUrl("");
      setCaption("");
      setPosition("");
      toast.success("Scout clip published");
      onCreated();
      onClose();
    } catch {
      toast.error("Could not publish clip");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[260] flex items-end justify-center bg-black/70 px-3 pb-3 backdrop-blur-sm">
      <div className="w-full max-w-[430px] rounded-[1.6rem] border border-white/12 bg-[#070707] p-4 shadow-[0_-24px_90px_rgba(0,0,0,0.78)]">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="font-heading text-2xl font-black uppercase italic text-white">Upload Clip</p>
            <p className="text-xs text-white/45">Upload a clip or paste a public video link.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-full border border-white/10 text-white"
            aria-label="Close upload"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3">
          <label className="flex min-h-20 cursor-pointer items-center justify-center rounded-xl border border-dashed border-rondo-accent/35 bg-rondo-accent/8 px-3 text-center text-xs font-semibold text-rondo-accent">
            <input
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="sr-only"
            />
            {file ? file.name : "Choose video file"}
          </label>
          <input
            type="url"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="Or paste https://.../highlight.mp4"
            className="h-12 w-full rounded-xl border border-white/12 bg-white/[0.045] px-3 text-sm text-white outline-none placeholder:text-white/28 focus:border-rondo-accent/55"
          />
          <input
            type="url"
            value={thumbnailUrl}
            onChange={(e) => setThumbnailUrl(e.target.value)}
            placeholder="Optional thumbnail https://..."
            className="h-12 w-full rounded-xl border border-white/12 bg-white/[0.045] px-3 text-sm text-white outline-none placeholder:text-white/28 focus:border-rondo-accent/55"
          />
          <div className="grid grid-cols-[0.9fr_1.1fr] gap-2">
            <input
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder="Position"
              className="h-12 rounded-xl border border-white/12 bg-white/[0.045] px-3 text-sm text-white outline-none placeholder:text-white/28 focus:border-rondo-accent/55"
            />
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Tags"
              className="h-12 rounded-xl border border-white/12 bg-white/[0.045] px-3 text-sm text-white outline-none placeholder:text-white/28 focus:border-rondo-accent/55"
            />
          </div>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value.slice(0, SCOUT_CLIP_CAPTION_MAX))}
            placeholder="What should scouts notice?"
            rows={3}
            className="w-full resize-none rounded-xl border border-white/12 bg-white/[0.045] px-3 py-3 text-sm text-white outline-none placeholder:text-white/28 focus:border-rondo-accent/55"
          />
          <button
            type="button"
            onClick={submit}
            disabled={(!videoUrl.trim() && !file) || !caption.trim() || submitting}
            className="rondo-btn rondo-btn-primary"
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            Publish Clip
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ScoutPage() {
  const [clips, setClips] = useState<ScoutClipWithCounts[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [guest, setGuest] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const activeClip = clips[activeIndex] ?? clips[0];

  const loadClips = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      setCurrentUserId(userData.user?.id ?? null);
      setGuest(userData.user ? isGuestUser(userData.user) : false);

      const res = await fetch("/api/scout-clips", { cache: "no-store" });
      const json = await res.json();
      setClips(((json.clips ?? []) as ScoutClip[]).map(countsFor));
    } catch {
      setClips([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClips();
  }, [loadClips]);

  const reactToClip = useCallback(
    async (clip: ScoutClipWithCounts, kind: ScoutReactionKind) => {
      if (!currentUserId || guest) {
        toast("Sign in to save scout activity");
        return;
      }

      const supabase = createClient();
      const active = userReacted(clip, currentUserId, kind);
      const nextReactions = active
        ? (clip.scout_clip_reactions ?? []).filter((r) => !(r.user_id === currentUserId && r.kind === kind))
        : [...(clip.scout_clip_reactions ?? []), { user_id: currentUserId, kind }];

      setClips((prev) =>
        prev.map((item) => (item.id === clip.id ? countsFor({ ...item, scout_clip_reactions: nextReactions }) : item))
      );

      const request = active
        ? supabase.from("scout_clip_reactions").delete().eq("clip_id", clip.id).eq("user_id", currentUserId).eq("kind", kind)
        : supabase.from("scout_clip_reactions").insert({ clip_id: clip.id, user_id: currentUserId, kind });

      const { error } = await request;
      if (error) {
        toast.error("Could not update clip");
        loadClips();
      }
    },
    [currentUserId, guest, loadClips]
  );

  const scrollToActive = useCallback((direction: 1 | -1) => {
    const next = Math.max(0, Math.min(clips.length - 1, activeIndex + direction));
    setActiveIndex(next);
    containerRef.current?.children[next]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [activeIndex, clips.length]);

  const profileHref = `/profile/${activeClip?.player_id}`;
  const messageHref = `/messages/${activeClip?.player_id}`;

  if (!loading && clips.length === 0) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-black px-8 text-center text-white">
        <p className="font-heading text-2xl font-black uppercase italic">No Clips Yet</p>
        <p className="font-body text-sm text-white/50">
          Nobody&apos;s posted a scout clip yet. Check back soon.
        </p>
        {!guest && (
          <button
            type="button"
            onClick={() => setUploadOpen(true)}
            className="mt-4 rounded-xl bg-rondo-accent px-6 py-3 font-bold text-black"
          >
            Be the first — post a clip
          </button>
        )}
        <UploadSheet
          open={uploadOpen}
          onClose={() => setUploadOpen(false)}
          onCreated={loadClips}
          currentUserId={currentUserId}
        />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-black text-white">
      <div className="fixed inset-x-0 top-0 z-50 mx-auto flex h-[5.25rem] max-w-[430px] items-center justify-between px-5 pt-3">
        <Link href="/feed" className="flex items-center gap-2" aria-label="Back to feed">
          <Image src="/rondo-logo.png" alt="RONDO" width={34} height={34} className="object-contain" priority />
          <span className="font-heading text-sm font-black uppercase tracking-[0.18em]">Scout</span>
        </Link>
        <div className="flex items-center gap-2 pr-1">
          <Link
            href="/community"
            className="grid h-10 w-10 place-items-center rounded-full border border-white/12 bg-black/45 text-white backdrop-blur"
            aria-label="Search players"
          >
            <Search size={18} />
          </Link>
          <button
            type="button"
            onClick={() => (guest ? toast("Create an account to upload clips") : setUploadOpen(true))}
            className="grid h-10 w-10 place-items-center rounded-full bg-rondo-accent text-black shadow-[0_0_28px_rgba(246,224,55,0.35)]"
            aria-label="Upload scout clip"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        onScroll={(e) => {
          const el = e.currentTarget;
          setActiveIndex(Math.round(el.scrollTop / Math.max(1, el.clientHeight)));
        }}
        className="h-[100dvh] snap-y snap-mandatory overflow-y-auto overflow-x-hidden [scrollbar-width:none]"
      >
        {clips.map((clip) => {
          const liked = userReacted(clip, currentUserId, "like");
          const saved = userReacted(clip, currentUserId, "save");
          const scouted = userReacted(clip, currentUserId, "scout");
          return (
            <section key={clip.id} className="relative mx-auto h-[100dvh] max-w-[430px] snap-start overflow-hidden bg-black">
              {clip.thumbnail_url && (
                <img
                  src={clip.thumbnail_url}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover opacity-45 blur-[1px]"
                />
              )}
              <video
                src={clip.video_url}
                poster={clip.thumbnail_url ?? undefined}
                className="absolute inset-0 h-full w-full object-cover"
                playsInline
                muted
                loop
                autoPlay
                controls={false}
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.62)_0%,rgba(0,0,0,0.08)_36%,rgba(0,0,0,0.78)_100%)]" />
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_28%_70%,rgba(246,224,55,0.18),transparent_28%)]" />

              <div className="absolute right-3 top-1/2 z-20 flex -translate-y-1/2 flex-col items-center gap-4">
                <ClipAction icon={Heart} label="Like" count={clip.likes} active={liked} onClick={() => reactToClip(clip, "like")} />
                <ClipAction icon={Bookmark} label="Save" count={clip.saves} active={saved} onClick={() => reactToClip(clip, "save")} />
                <ClipAction icon={ShieldCheck} label="Scout" count={clip.scouts} active={scouted} onClick={() => reactToClip(clip, "scout")} />
                <Link href={messageHref} className="flex flex-col items-center gap-1 text-white">
                  <span className="grid h-12 w-12 place-items-center rounded-full border border-white/16 bg-black/45 backdrop-blur-md">
                    <MessageCircle size={22} />
                  </span>
                  <span className="font-heading text-[0.68rem] font-black uppercase leading-none text-white/82">DM</span>
                </Link>
              </div>

              <div className="absolute bottom-32 left-0 right-0 z-20 px-4">
                <div className="max-w-[calc(100%-4.5rem)] space-y-3">
                  <Link href={profileHref} className="flex items-center gap-3">
                    {clip.player ? (
                      <PlayerAvatar profile={clip.player} size="md" linkable={false} />
                    ) : (
                      <span className="grid h-11 w-11 place-items-center rounded-full border border-white/16 bg-white/10">
                        <UserRound size={18} />
                      </span>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate font-heading text-2xl font-black uppercase italic leading-none text-white">
                          {clip.player?.full_name ?? "Player"}
                        </p>
                        <Check size={16} className="shrink-0 rounded-full bg-rondo-accent p-0.5 text-black" />
                      </div>
                      <p className="mt-1 text-xs font-semibold text-white/58">
                        {clip.position ?? clip.player?.position ?? "Player"} · {clip.player?.skill_level ?? "Open level"}
                      </p>
                    </div>
                  </Link>

                  <p className="text-sm font-medium leading-snug text-white/88">{clip.caption}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {clip.skill_tags.slice(0, 4).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-rondo-accent/25 bg-rondo-accent/12 px-2.5 py-1 text-[0.68rem] font-bold uppercase text-rondo-accent"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          );
        })}
      </div>

      <div className="fixed bottom-[5.1rem] left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/12 bg-black/50 px-3 py-2 backdrop-blur-md">
        <button
          type="button"
          onClick={() => scrollToActive(-1)}
          className="grid h-9 w-9 place-items-center rounded-full bg-white/8 text-white"
          aria-label="Previous clip"
        >
          <ChevronUp size={18} />
        </button>
        <div className="flex items-center gap-1.5 px-1">
          {clips.map((clip, i) => (
            <span
              key={clip.id}
              className={cn("h-1.5 rounded-full transition-all", i === activeIndex ? "w-5 bg-rondo-accent" : "w-1.5 bg-white/32")}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => scrollToActive(1)}
          className="grid h-9 w-9 rotate-180 place-items-center rounded-full bg-white/8 text-white"
          aria-label="Next clip"
        >
          <ChevronUp size={18} />
        </button>
      </div>

      {loading && (
        <div className="pointer-events-none fixed left-1/2 top-24 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/10 bg-black/60 px-3 py-2 text-xs text-white/70 backdrop-blur">
          <Loader2 size={14} className="animate-spin text-rondo-accent" />
          Loading clips
        </div>
      )}

      <UploadSheet
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onCreated={loadClips}
        currentUserId={currentUserId}
      />
    </div>
  );
}
