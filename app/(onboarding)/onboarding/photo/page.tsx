"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Image as ImageIcon, User } from "@phosphor-icons/react";
import { JoinShell } from "@/components/onboarding/JoinShell";
import { RondoButton } from "@/components/rondo/primitives";
import {
  joinBackPath,
  joinNextPath,
  readOnboardingDraft,
  writeOnboardingDraft,
} from "@/lib/onboarding/draft";

async function fileToDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const max = 512;
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not read image");
  ctx.drawImage(bitmap, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", 0.82);
}

export default function OnboardingPhotoPage() {
  const router = useRouter();
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPreview(readOnboardingDraft().avatarDataUrl);
  }, []);

  async function onPick(file: File | null) {
    if (!file) return;
    setError(null);
    try {
      const dataUrl = await fileToDataUrl(file);
      setPreview(dataUrl);
      writeOnboardingDraft({ avatarDataUrl: dataUrl });
    } catch {
      setError("Could not use that photo. Try another.");
    }
  }

  return (
    <JoinShell
      step="photo"
      backHref={joinBackPath("photo")}
      title="Choose your profile picture"
      subtitle="Your profile picture will be visible in your profile."
      footer={
        <RondoButton
          type="button"
          variant="primary"
          onClick={() => router.push(joinNextPath("photo"))}
        >
          Next
        </RondoButton>
      }
    >
      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          <div className="flex h-36 w-36 items-center justify-center overflow-hidden rounded-full bg-[var(--bg-inset)]">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="" className="h-full w-full object-cover" />
            ) : (
              <User size={64} className="text-[var(--ink-low)]" weight="fill" />
            )}
          </div>
          <button
            type="button"
            aria-label="Add photo"
            onClick={() => galleryRef.current?.click()}
            className="absolute bottom-1 right-1 flex h-11 w-11 items-center justify-center rounded-full bg-[var(--ink-hi)] text-[var(--bg-page)]"
          >
            <Camera size={20} weight="bold" />
          </button>
        </div>
        <p className="font-body text-sm font-semibold text-[var(--ink-hi)]">Add a profile photo</p>

        <div className="w-full space-y-3">
          <button
            type="button"
            onClick={() => galleryRef.current?.click()}
            className="flex w-full items-center justify-between rounded-[var(--r-md)] border border-[var(--stroke)] bg-[var(--bg-surface)] px-4 py-4 text-left"
          >
            <span className="flex items-center gap-3 font-body text-sm font-semibold">
              <ImageIcon size={20} />
              Pick an image from camera roll
            </span>
            <span aria-hidden>›</span>
          </button>
          <button
            type="button"
            onClick={() => cameraRef.current?.click()}
            className="flex w-full items-center justify-between rounded-[var(--r-md)] border border-[var(--stroke)] bg-[var(--bg-surface)] px-4 py-4 text-left"
          >
            <span className="flex items-center gap-3 font-body text-sm font-semibold">
              <Camera size={20} />
              Take Photo
            </span>
            <span aria-hidden>›</span>
          </button>
        </div>
        {error && <p className="text-center text-sm text-[var(--live)]">{error}</p>}
      </div>

      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onPick(e.target.files?.[0] ?? null)}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={(e) => onPick(e.target.files?.[0] ?? null)}
      />
    </JoinShell>
  );
}
