"use client";

import { useRef, useState } from "react";
import { X, Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

interface ReelUploadModalProps {
  userId: string;
  onClose: () => void;
  onUploaded: () => void;
}

const MAX_BYTES = 50 * 1024 * 1024;

export function ReelUploadModal({ userId, onClose, onUploaded }: ReelUploadModalProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);

  function pickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > MAX_BYTES) {
      toast.error("Video must be under 50 MB");
      return;
    }
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  }

  async function upload() {
    if (!file || uploading) return;
    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() ?? "mp4";
      const path = `${userId}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("player-reels")
        .upload(path, file, { upsert: false, contentType: file.type });

      if (uploadError) {
        toast.error(`Upload failed: ${uploadError.message}`);
        return;
      }

      const { data: urlData } = supabase.storage.from("player-reels").getPublicUrl(path);
      const res = await fetch("/api/reels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ video_url: urlData.publicUrl, caption: caption.trim() || null }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Could not save reel");
        return;
      }
      toast.success("Reel posted!");
      onUploaded();
      onClose();
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[300] bg-black/80 flex items-end sm:items-center justify-center p-4">
      <div className="w-full max-w-sm bg-card border border-border rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="font-heading text-white font-black italic text-base uppercase">Post a Reel</h2>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {previewUrl ? (
            <div className="relative rounded-xl overflow-hidden bg-black" style={{ aspectRatio: "9/16", maxHeight: 240 }}>
              <video src={previewUrl} muted playsInline className="w-full h-full object-cover" />
              <button
                onClick={() => { setFile(null); setPreviewUrl(null); }}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full border-2 border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center gap-2 text-white/40 hover:border-rondo-accent/40 hover:text-rondo-accent transition-colors py-10"
            >
              <Upload size={28} />
              <span className="font-body text-sm">Tap to choose a video</span>
              <span className="text-xs">MP4 or WebM, max 50 MB</span>
            </button>
          )}

          <input
            ref={fileRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            className="hidden"
            onChange={pickFile}
          />

          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value.slice(0, 300))}
            placeholder="Add a caption… (optional)"
            rows={2}
            className="w-full bg-background border border-border rounded-xl px-3 py-2 text-white text-sm placeholder:text-white/30 resize-none outline-none focus:border-rondo-accent/40"
          />

          <button
            onClick={upload}
            disabled={!file || uploading}
            className="w-full bg-rondo-accent text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-40"
          >
            {uploading ? <><Loader2 size={16} className="animate-spin" /> Uploading…</> : "Post Reel"}
          </button>
        </div>
      </div>
    </div>
  );
}
