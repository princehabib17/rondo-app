"use client";

import "react-easy-crop/react-easy-crop.css";
import { useCallback, useState } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import { Check, X } from "@phosphor-icons/react";

async function cropImageToBlob(src: string, pixelCrop: Area): Promise<Blob> {
  const image = new Image();
  image.crossOrigin = "anonymous";
  image.src = src;
  await new Promise<void>((res, rej) => {
    image.onload = () => res();
    image.onerror = rej;
  });
  const canvas = document.createElement("canvas");
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Canvas is empty"))),
      "image/jpeg",
      0.92
    )
  );
}

export interface ImageCropModalProps {
  src: string;
  aspect: number;
  label?: string;
  onDone: (blob: Blob) => void;
  onCancel: () => void;
}

export function ImageCropModal({ src, aspect, label, onDone, onCancel }: ImageCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);

  const onCropComplete = useCallback((_area: Area, pxArea: Area) => {
    setCroppedAreaPixels(pxArea);
  }, []);

  async function confirm() {
    if (!croppedAreaPixels || processing) return;
    setProcessing(true);
    try {
      const blob = await cropImageToBlob(src, croppedAreaPixels);
      onDone(blob);
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[300] flex flex-col bg-[var(--bg-page)]"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex shrink-0 items-center justify-between border-b border-[var(--stroke)] px-4 py-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex h-10 w-10 items-center justify-center text-[var(--ink-mid)] hover:text-[var(--ink-hi)]"
          aria-label="Cancel crop"
        >
          <X size={20} weight="bold" />
        </button>
        <span className="rondo-label text-[var(--ink-hi)]">{label ?? "Crop image"}</span>
        <button
          type="button"
          onClick={confirm}
          disabled={processing}
          className="inline-flex items-center gap-1.5 rounded-[var(--r-pill)] bg-[var(--gold)] px-4 py-2 rondo-label text-[var(--gold-ink)] disabled:opacity-50"
        >
          <Check size={14} weight="bold" />
          {processing ? "…" : "Use"}
        </button>
      </div>

      <div className="relative flex-1 bg-[var(--bg-page)]">
        <Cropper
          image={src}
          crop={crop}
          zoom={zoom}
          aspect={aspect}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
          style={{ containerStyle: { background: "oklch(16% 0.008 102)" } }}
        />
      </div>

      <div className="flex shrink-0 items-center gap-4 border-t border-[var(--stroke)] bg-[var(--bg-page)] px-6 py-4">
        <span className="shrink-0 rondo-label text-[var(--ink-low)]">Zoom</span>
        <input
          type="range"
          min={1}
          max={3}
          step={0.01}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="h-1 flex-1 accent-[var(--gold)]"
        />
      </div>
    </div>
  );
}
