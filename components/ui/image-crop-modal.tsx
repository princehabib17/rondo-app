"use client";

import "react-easy-crop/react-easy-crop.css";
import { useCallback, useState } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import { Check, X } from "lucide-react";

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
    pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
    0, 0, pixelCrop.width, pixelCrop.height
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
      className="fixed inset-0 z-[300] flex flex-col bg-black"
      onClick={(e) => e.stopPropagation()}
    >
      {/* header */}
      <div className="flex shrink-0 items-center justify-between px-4 py-3 border-b border-white/10">
        <button
          type="button"
          onClick={onCancel}
          className="w-10 h-10 flex items-center justify-center text-white/60 hover:text-white"
        >
          <X size={20} />
        </button>
        <span className="text-white text-sm font-black uppercase tracking-widest">
          {label ?? "Crop image"}
        </span>
        <button
          type="button"
          onClick={confirm}
          disabled={processing}
          className="flex items-center gap-1.5 bg-rondo-yellow text-black font-black text-xs uppercase tracking-widest px-4 py-2 rounded-xl disabled:opacity-50"
        >
          <Check size={14} />
          {processing ? "…" : "Use"}
        </button>
      </div>

      {/* cropper */}
      <div className="relative flex-1 bg-[#111]">
        <Cropper
          image={src}
          crop={crop}
          zoom={zoom}
          aspect={aspect}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
          style={{ containerStyle: { background: "#111" } }}
        />
      </div>

      {/* zoom slider */}
      <div className="shrink-0 flex items-center gap-4 px-6 py-4 border-t border-white/10 bg-black">
        <span className="text-white/40 text-xs font-semibold uppercase tracking-wider shrink-0">
          Zoom
        </span>
        <input
          type="range"
          min={1}
          max={3}
          step={0.01}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="flex-1 accent-[#E9FF3A] h-1"
        />
      </div>
    </div>
  );
}
