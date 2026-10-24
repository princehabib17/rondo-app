"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Camera, CaretRight, CheckCircle, Image as ImageIcon, User } from "@phosphor-icons/react";
import { JoinShell } from "@/components/onboarding/JoinShell";
import { RondoButton } from "@/components/rondo/primitives";
import { ImageCropModal } from "@/components/ui/image-crop-modal";
import {
  joinBackPath,
  joinNextPath,
  readOnboardingDraft,
  writeOnboardingDraft,
} from "@/lib/onboarding/draft";

const AVATAR_SIZE = 512;

async function blobToAvatarDataUrl(blob: Blob): Promise<string> {
  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement("canvas");
  canvas.width = AVATAR_SIZE;
  canvas.height = AVATAR_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not read image");
  ctx.drawImage(bitmap, 0, 0, AVATAR_SIZE, AVATAR_SIZE);
  return canvas.toDataURL("image/jpeg", 0.85);
}

export default function OnboardingPhotoPage() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [justSet, setJustSet] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const existing = readOnboardingDraft().avatarDataUrl;
    setPreview(existing);
    setJustSet(Boolean(existing));
  }, []);

  useEffect(() => {
    return () => {
      if (cropSrc) URL.revokeObjectURL(cropSrc);
    };
  }, [cropSrc]);

  function openGallery() {
    setSheetOpen(false);
    galleryRef.current?.click();
  }

  function openCamera() {
    setSheetOpen(false);
    cameraRef.current?.click();
  }

  function onPick(input: HTMLInputElement) {
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("That file isn't an image. Pick a photo.");
      return;
    }
    setError(null);
    setCropSrc(URL.createObjectURL(file));
  }

  async function onCropped(blob: Blob) {
    try {
      const dataUrl = await blobToAvatarDataUrl(blob);
      setPreview(dataUrl);
      setJustSet(true);
      writeOnboardingDraft({ avatarDataUrl: dataUrl });
    } catch {
      setError("Could not use that photo. Try another.");
    } finally {
      setCropSrc(null);
    }
  }

  function removePhoto() {
    setPreview(null);
    setJustSet(false);
    writeOnboardingDraft({ avatarDataUrl: null });
  }

  return (
    <JoinShell
      step="photo"
      backHref={joinBackPath("photo")}
      title="Show your face"
      subtitle="Teammates recognise you before kickoff. You can change it any time."
      footer={
        <RondoButton type="button" variant="primary" onClick={() => router.push(joinNextPath("photo"))}>
          {preview ? "Next" : "Maybe later"}
        </RondoButton>
      }
    >
      <div className="flex flex-1 flex-col items-center justify-center gap-6">
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          aria-label={preview ? "Change profile photo" : "Add profile photo"}
          className="group relative rounded-full focus:outline-none focus-visible:ring-4 focus-visible:ring-[color-mix(in_oklch,var(--gold)_40%,transparent)]"
        >
          <motion.div
            className="flex h-44 w-44 items-center justify-center overflow-hidden rounded-full border-4 border-[var(--gold)] bg-[var(--bg-inset)] shadow-[0_0_0_10px_var(--gold-dim),0_20px_50px_-15px_color-mix(in_oklch,var(--gold)_45%,transparent)]"
            whileTap={{ scale: reduceMotion ? 1 : 0.96 }}
            key={preview ?? "empty"}
            initial={{ scale: reduceMotion ? 1 : 0.92, opacity: 0.6 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 380, damping: 24 }}
          >
            {preview ? (
               
              <img src={preview} alt="Your profile photo" className="h-full w-full object-cover" />
            ) : (
              <User size={80} className="text-[var(--ink-low)] transition-colors group-hover:text-[var(--ink-mid)]" weight="fill" />
            )}
          </motion.div>
          <span className="absolute bottom-2 right-2 flex h-12 w-12 items-center justify-center rounded-full border-4 border-[var(--bg-page)] bg-[var(--gold)] text-[var(--gold-ink)]">
            <Camera size={20} weight="bold" />
          </span>
        </button>

        <AnimatePresence mode="wait">
          {preview && justSet ? (
            <motion.div
              key="good"
              initial={{ opacity: 0, y: reduceMotion ? 0 : 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 rounded-full border border-[color-mix(in_oklch,var(--ok)_40%,transparent)] bg-[color-mix(in_oklch,var(--ok)_14%,transparent)] px-4 py-2"
              role="status"
            >
              <CheckCircle size={20} weight="fill" className="text-[var(--ok)]" />
              <span className="font-body text-sm font-bold text-[var(--ink-hi)]">Looking good!</span>
            </motion.div>
          ) : (
            <motion.p key="hint" className="font-body text-sm font-semibold text-[var(--ink-mid)]">
              Tap the circle to add a photo
            </motion.p>
          )}
        </AnimatePresence>

        <div className="w-full space-y-3">
          <OptionRow icon={<ImageIcon size={22} />} label="Pick from camera roll" onClick={openGallery} />
          <OptionRow icon={<Camera size={22} />} label="Take a photo" onClick={openCamera} />
          {preview && (
            <button
              type="button"
              onClick={removePhoto}
              className="w-full py-2 text-center font-body text-sm font-semibold text-[var(--ink-low)] hover:text-[var(--live)]"
            >
              Remove photo
            </button>
          )}
        </div>
        {error && <p className="text-center text-sm text-[var(--live)]">{error}</p>}
      </div>

      <AnimatePresence>
        {sheetOpen && (
          <motion.div
            className="fixed inset-0 z-[250] flex items-end justify-center bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSheetOpen(false)}
          >
            <motion.div
              role="dialog"
              aria-label="Add a profile photo"
              className="w-full max-w-md space-y-3 rounded-t-[1.75rem] border-t border-[var(--stroke)] bg-[var(--bg-surface)] p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 420, damping: 38 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mx-auto mb-2 h-1.5 w-10 rounded-full bg-[var(--stroke)]" />
              <p className="pb-1 text-center font-heading text-lg font-black uppercase tracking-tight">
                Profile photo
              </p>
              <OptionRow icon={<ImageIcon size={22} />} label="Pick from camera roll" onClick={openGallery} />
              <OptionRow icon={<Camera size={22} />} label="Take a photo" onClick={openCamera} />
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                className="w-full py-3 text-center font-body text-sm font-semibold text-[var(--ink-mid)]"
              >
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {cropSrc && (
        <ImageCropModal
          src={cropSrc}
          aspect={1}
          cropShape="round"
          label="Move and scale"
          onDone={onCropped}
          onCancel={() => setCropSrc(null)}
        />
      )}

      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        className="hidden"
        data-testid="photo-gallery-input"
        onChange={(e) => onPick(e.currentTarget)}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={(e) => onPick(e.currentTarget)}
      />
    </JoinShell>
  );
}

function OptionRow({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-[var(--r-md)] border border-[var(--stroke)] bg-[var(--bg-inset)] px-4 py-4 text-left transition-colors hover:border-[color-mix(in_oklch,var(--gold)_45%,var(--stroke))]"
    >
      <span className="flex items-center gap-3 font-body text-[0.95rem] font-semibold text-[var(--ink-hi)]">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--gold-dim)] text-[var(--gold)]">
          {icon}
        </span>
        {label}
      </span>
      <CaretRight size={18} className="text-[var(--ink-low)]" />
    </button>
  );
}
