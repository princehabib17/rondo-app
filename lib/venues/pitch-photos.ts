export interface PitchPhoto {
  src: string;
  alt: string;
  label: string;
}

/** Aerial photo of the BGC Turf pitch, shown wherever that venue is opened. */
export const BGC_TURF_PITCH_PHOTO = "/venues/bgc-turf.jpg";

const PITCH_PHOTOS: { matches: (venueName: string) => boolean; photo: PitchPhoto }[] = [
  {
    matches: (venueName) => venueName.trim().toLowerCase() === "bgc turf",
    photo: {
      src: BGC_TURF_PITCH_PHOTO,
      alt: "BGC Turf football pitch",
      label: "BGC Turf",
    },
  },
];

export function pitchPhotoForVenue(venueName: string | null | undefined): PitchPhoto | null {
  if (!venueName) return null;
  return PITCH_PHOTOS.find((entry) => entry.matches(venueName))?.photo ?? null;
}

/**
 * Image for match cards, the map sheet, and the match hero.
 * An organizer-uploaded cover wins. Organizer logos are not pitch photos.
 */
export function gameCoverSrc(game: {
  venue_name?: string | null;
  banner_url?: string | null;
}): string | null {
  const banner = game.banner_url?.trim() || null;
  if (banner && !banner.startsWith("/organizers/")) return banner;
  return pitchPhotoForVenue(game.venue_name)?.src ?? banner;
}
