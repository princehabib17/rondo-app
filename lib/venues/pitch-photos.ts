export interface PitchPhoto {
  src: string;
  alt: string;
  label: string;
}

/**
 * Real photos of specific venues, keyed by venue name. Drop the file under
 * public/venues/ and add an entry here; until a venue has one, match views
 * use the generic night-scene art below instead of a broken image.
 */
const PITCH_PHOTOS: { matches: (venueName: string) => boolean; photo: PitchPhoto }[] = [];

export function pitchPhotoForVenue(venueName: string | null | undefined): PitchPhoto | null {
  if (!venueName) return null;
  return PITCH_PHOTOS.find((entry) => entry.matches(venueName))?.photo ?? null;
}

/** Generic matchday art for games without an uploaded cover or venue photo. */
export const MATCH_SCENES = {
  football: { src: "/scenes/night-pitch.jpg", alt: "Floodlit seven-a-side pitch at night" },
  futsal: { src: "/scenes/center-spot.jpg", alt: "Ball on the center spot under floodlights" },
} as const;

function isOrganizerLogo(src: string): boolean {
  return src.startsWith("/organizers/");
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
  if (banner && !isOrganizerLogo(banner)) return banner;
  return pitchPhotoForVenue(game.venue_name)?.src ?? banner;
}

/** Always-an-image hero: uploaded cover, venue photo, or the matchday scene for the sport. */
export function matchHeroImage(game: {
  venue_name?: string | null;
  banner_url?: string | null;
  match_type?: string | null;
  format?: string | null;
}): { src: string; alt: string } {
  const cover = gameCoverSrc(game);
  if (cover && !isOrganizerLogo(cover)) return { src: cover, alt: "" };
  const futsal = game.match_type === "futsal" || /futsal|5v5|5 ?v ?5/i.test(game.format ?? "");
  return futsal ? MATCH_SCENES.futsal : MATCH_SCENES.football;
}
