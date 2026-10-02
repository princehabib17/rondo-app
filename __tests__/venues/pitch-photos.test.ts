import { describe, expect, it } from "vitest";
import { MATCH_SCENES, gameCoverSrc, matchHeroImage, pitchPhotoForVenue } from "@/lib/venues/pitch-photos";
import { existsSync } from "node:fs";
import path from "node:path";

describe("match imagery", () => {
  it("never points at a venue photo that is not shipped", () => {
    for (const venue of ["BGC Turf", "Cherry Turf", "MOA Football Pitch"]) {
      const photo = pitchPhotoForVenue(venue);
      if (photo) expect(existsSync(path.join(process.cwd(), "public", photo.src))).toBe(true);
    }
    expect(pitchPhotoForVenue(null)).toBeNull();
  });

  it("ships every matchday scene it references", () => {
    for (const scene of Object.values(MATCH_SCENES)) {
      expect(existsSync(path.join(process.cwd(), "public", scene.src))).toBe(true);
    }
  });

  it("prefers an uploaded cover over organizer logos and scenes", () => {
    expect(gameCoverSrc({ venue_name: "BGC Turf", banner_url: "https://cdn.example/custom-cover.jpg" })).toBe(
      "https://cdn.example/custom-cover.jpg"
    );
    expect(matchHeroImage({ banner_url: "https://cdn.example/custom-cover.jpg" }).src).toBe(
      "https://cdn.example/custom-cover.jpg"
    );
  });

  it("falls back to the sport's scene instead of an organizer logo", () => {
    expect(matchHeroImage({ banner_url: "/organizers/urban.png", match_type: "football" }).src).toBe(
      MATCH_SCENES.football.src
    );
    expect(matchHeroImage({ banner_url: null, match_type: "futsal" }).src).toBe(MATCH_SCENES.futsal.src);
    expect(matchHeroImage({ banner_url: null, format: "5v5" }).src).toBe(MATCH_SCENES.futsal.src);
  });
});
