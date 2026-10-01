"use client";

import { useState } from "react";
import type { PitchPhoto } from "@/lib/venues/pitch-photos";

interface PitchViewProps {
  photo: PitchPhoto;
  format?: string;
}

/** Full-width look at the venue's pitch. Used on the match page for BGC Turf. */
export function PitchView({ photo, format }: PitchViewProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="relative h-48 rondo-floodlight-scene" aria-label={photo.alt}>
        {format ? (
          <span className="absolute bottom-3 left-4 font-heading text-2xl font-black italic uppercase text-[var(--ink-hi)]">
            {format}
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <figure className="relative bg-[var(--bg-inset)]">
      <img
        src={photo.src}
        alt={photo.alt}
        className="aspect-[4/3] w-full object-cover object-center"
        onError={() => setFailed(true)}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[var(--bg-page)] via-[color-mix(in_oklch,var(--bg-page)_12%,transparent)] to-transparent" />
      <span className="absolute left-4 top-3 rounded-full border border-[var(--stroke)] bg-[color-mix(in_oklch,var(--bg-page)_72%,transparent)] px-3 py-1 rondo-label text-[var(--ink-hi)] backdrop-blur-sm">
        Pitch view
      </span>
      {format ? (
        <span className="absolute bottom-3 left-4 font-heading text-2xl font-black italic uppercase text-[var(--ink-hi)]">
          {format}
        </span>
      ) : null}
    </figure>
  );
}
