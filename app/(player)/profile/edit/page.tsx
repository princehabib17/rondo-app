"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera } from "@phosphor-icons/react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { isGuestUser } from "@/lib/auth/is-guest";
import { PageHeader } from "@/components/layout/PageHeader";
import { RondoButton, rondoFieldClass } from "@/components/rondo/primitives";
import { ImageCropModal } from "@/components/ui/image-crop-modal";
import { NATIONALITIES } from "@/lib/utils/format";
import type { Position, PreferredFoot, Profile, SkillLevel } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

const POSITIONS: { value: Position; label: string }[] = [
  { value: "goalkeeper", label: "Goalkeeper" },
  { value: "defender", label: "Defender" },
  { value: "midfielder", label: "Midfielder" },
  { value: "forward", label: "Forward" },
  { value: "any", label: "Anywhere" },
];

const LEVELS: { value: SkillLevel; label: string }[] = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
  { value: "pro", label: "Pro" },
];

const FEET: { value: PreferredFoot; label: string }[] = [
  { value: "right", label: "Right" },
  { value: "left", label: "Left" },
  { value: "both", label: "Both" },
];

const USERNAME = /^[a-z0-9_]{3,20}$/;

/** "Marco Reyes" -> "marco_reyes": a starting point for accounts created before usernames. */
function suggestUsername(name: string): string {
  const base = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 20);
  return base.length >= 3 ? base : "";
}
const BIO_LIMIT = 160;

type Draft = {
  full_name: string;
  username: string;
  bio: string;
  preferred_areas: string;
  nationality: string;
  position: Position | "";
  skill_level: SkillLevel | "";
  preferred_foot: PreferredFoot | "";
};

function ChipGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T | "";
  onChange: (value: T | "") => void;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="rondo-label text-[var(--ink-low)]">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            data-active={value === option.value}
            aria-pressed={value === option.value}
            onClick={() => onChange(value === option.value ? "" : option.value)}
            className="rondo-chip min-h-10 normal-case tracking-normal text-[0.8125rem]"
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export default function EditProfilePage() {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof Draft, string>>>({});

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        router.replace("/login?next=/profile/edit");
        return;
      }
      if (isGuestUser(data.user)) {
        router.replace("/signup?next=/profile");
        return;
      }
      setUserId(data.user.id);
      const { data: row } = await supabase.from("profiles").select("*").eq("id", data.user.id).single();
      const profile = row as Profile | null;
      setIsOrganizer(profile?.role === "organizer");
      setAvatarUrl(profile?.avatar_url ?? null);
      setDraft({
        full_name: profile?.full_name ?? "",
        username: profile?.username ?? suggestUsername(profile?.full_name ?? ""),
        bio: profile?.bio ?? "",
        preferred_areas: profile?.preferred_areas ?? "",
        nationality: profile?.nationality ?? "",
        position: profile?.position ?? "",
        skill_level: profile?.skill_level ?? "",
        preferred_foot: profile?.preferred_foot ?? "",
      });
    });
  }, [router]);

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => (current ? { ...current, [key]: value } : current));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  function pickPhoto(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Pick a photo (JPG, PNG, or HEIC).");
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      toast.error("That photo is over 12 MB. Try a smaller one.");
      return;
    }
    setCropSrc(URL.createObjectURL(file));
  }

  async function uploadAvatar(blob: Blob) {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
    if (!userId) return;
    setUploading(true);
    try {
      const supabase = createClient();
      const path = `${userId}/avatar-${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, blob, { contentType: "image/jpeg", upsert: true });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ avatar_url: data.publicUrl })
        .eq("id", userId);
      if (profileError) throw profileError;
      setAvatarUrl(data.publicUrl);
      toast.success("Photo updated.");
    } catch {
      toast.error("Couldn't upload that photo. Try again.");
    } finally {
      setUploading(false);
    }
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!draft || !userId || saving) return;

    const username = draft.username.trim().toLowerCase().replace(/^@+/, "");
    const nextErrors: typeof errors = {};
    if (draft.full_name.trim().length < 2) nextErrors.full_name = "Tell us what to call you.";
    if (!USERNAME.test(username)) nextErrors.username = "3 to 20 characters: letters, numbers, underscores.";
    if (draft.bio.length > BIO_LIMIT) nextErrors.bio = `Keep it under ${BIO_LIMIT} characters.`;
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      const first = (["full_name", "username", "bio"] as const).find((key) => nextErrors[key]);
      if (first) document.getElementById(first)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: draft.full_name.trim(),
        username,
        bio: draft.bio.trim() || null,
        preferred_areas: draft.preferred_areas.trim() || null,
        nationality: draft.nationality || null,
        ...(isOrganizer
          ? {}
          : {
              position: draft.position || null,
              skill_level: draft.skill_level || null,
              preferred_foot: draft.preferred_foot || null,
            }),
      })
      .eq("id", userId);
    setSaving(false);

    if (error) {
      const taken = error.code === "23505" || /duplicate|unique/i.test(error.message);
      if (taken) {
        setErrors({ username: "That username is taken. Try another." });
        document.getElementById("username")?.scrollIntoView({ behavior: "smooth", block: "center" });
      } else {
        toast.error("Couldn't save your profile. Try again.");
      }
      return;
    }

    toast.success("Profile saved.");
    router.replace("/profile");
    router.refresh();
  }

  return (
    <form onSubmit={save} className="min-h-[100dvh] rondo-page" noValidate>
      <PageHeader title="Edit profile" back fallbackHref="/profile" />

      {!draft ? (
        <div className="mx-auto max-w-lg space-y-4 px-4 py-6">
          <div className="mx-auto size-28 rounded-[var(--r-pill)] rondo-shimmer" />
          <div className="h-12 rounded-[var(--r-sm)] rondo-shimmer" />
          <div className="h-12 rounded-[var(--r-sm)] rondo-shimmer" />
        </div>
      ) : (
        <div className="mx-auto max-w-lg space-y-8 px-4 py-6">
          <section className="flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              disabled={uploading}
              className="group relative grid size-28 place-items-center overflow-hidden rounded-[var(--r-pill)] bg-[var(--bg-inset)] ring-2 ring-[var(--gold)] ring-offset-4 ring-offset-[var(--bg-page)]"
              aria-label="Change profile photo"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="font-heading text-5xl font-bold text-[var(--ink-hi)]">
                  {(draft.full_name || "?").slice(0, 1)}
                </span>
              )}
              <span
                className={cn(
                  "absolute inset-x-0 bottom-0 flex h-9 items-center justify-center bg-[color-mix(in_oklch,var(--bg-night)_72%,transparent)] text-[var(--night-ink)]",
                  uploading && "inset-0 h-auto"
                )}
              >
                {uploading ? <span className="rondo-label">Uploading</span> : <Camera size={18} weight="bold" aria-hidden />}
              </span>
            </button>
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="min-h-11 rondo-meta font-bold text-[var(--ink-mid)] hover:text-[var(--ink-hi)]"
            >
              {avatarUrl ? "Change photo" : "Add a photo"}
            </button>
            <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={pickPhoto} />
          </section>

          <section className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="full_name" className="rondo-label text-[var(--ink-low)]">
                {isOrganizer ? "Organizer name" : "Name"}
              </label>
              <input
                id="full_name"
                value={draft.full_name}
                onChange={(e) => update("full_name", e.target.value)}
                autoComplete="name"
                className={rondoFieldClass}
              />
              {errors.full_name && <p className="rondo-meta text-[var(--live)]">{errors.full_name}</p>}
            </div>

            <div className="space-y-2">
              <label htmlFor="username" className="rondo-label text-[var(--ink-low)]">
                Username
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 rondo-body text-[var(--ink-low)]">@</span>
                <input
                  id="username"
                  value={draft.username}
                  onChange={(e) => update("username", e.target.value)}
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  className={cn(rondoFieldClass, "pl-9")}
                />
              </div>
              {errors.username ? (
                <p className="rondo-meta text-[var(--live)]">{errors.username}</p>
              ) : (
                <p className="rondo-meta text-[var(--ink-low)]">You can log in with this too.</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="bio" className="rondo-label text-[var(--ink-low)]">
                Bio
              </label>
              <textarea
                id="bio"
                value={draft.bio}
                onChange={(e) => update("bio", e.target.value.slice(0, BIO_LIMIT + 20))}
                rows={3}
                placeholder={isOrganizer ? "What your games are like, who they're for." : "Weekend striker. Left foot only, sorry."}
                className="w-full resize-none rounded-[var(--r-sm)] border border-transparent bg-[var(--bg-inset)] p-4 rondo-body text-[var(--ink-hi)] placeholder:text-[var(--ink-low)] focus:border-[var(--gold)] focus:outline-none"
              />
              <p
                className={cn(
                  "text-right rondo-meta tabular-nums",
                  draft.bio.length > BIO_LIMIT ? "text-[var(--live)]" : "text-[var(--ink-low)]"
                )}
              >
                {draft.bio.length}/{BIO_LIMIT}
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="areas" className="rondo-label text-[var(--ink-low)]">
                {isOrganizer ? "Where you host" : "Where you play"}
              </label>
              <input
                id="areas"
                value={draft.preferred_areas}
                onChange={(e) => update("preferred_areas", e.target.value)}
                placeholder="BGC, Makati, Ortigas"
                className={rondoFieldClass}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="nationality" className="rondo-label text-[var(--ink-low)]">
                Nationality
              </label>
              <select
                id="nationality"
                value={draft.nationality}
                onChange={(e) => update("nationality", e.target.value)}
                className={rondoFieldClass}
              >
                <option value="">Prefer not to say</option>
                {NATIONALITIES.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </div>
          </section>

          {!isOrganizer && (
            <section className="space-y-6">
              <ChipGroup label="Position" options={POSITIONS} value={draft.position} onChange={(v) => update("position", v)} />
              <ChipGroup label="Level" options={LEVELS} value={draft.skill_level} onChange={(v) => update("skill_level", v)} />
              <ChipGroup
                label="Stronger foot"
                options={FEET}
                value={draft.preferred_foot}
                onChange={(v) => update("preferred_foot", v)}
              />
            </section>
          )}
        </div>
      )}

      <div className="fixed inset-x-0 bottom-0 z-30 rondo-sticky-action pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto max-w-lg px-4 py-3">
          <RondoButton type="submit" disabled={!draft || saving || uploading}>
            {saving ? "Saving..." : "Save profile"}
          </RondoButton>
        </div>
      </div>

      {cropSrc && (
        <ImageCropModal
          src={cropSrc}
          aspect={1}
          label="Crop your photo"
          onDone={uploadAvatar}
          onCancel={() => {
            URL.revokeObjectURL(cropSrc);
            setCropSrc(null);
          }}
        />
      )}
    </form>
  );
}
