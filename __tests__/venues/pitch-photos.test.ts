import { describe, expect, it } from "vitest";
import { BGC_TURF_PITCH_PHOTO, gameCoverSrc, pitchPhotoForVenue } from "@/lib/venues/pitch-photos";
describe("BGC Turf pitch photo", () => {
  it("maps the BGC Turf venue to the pitch photo", () => {
    expect(pitchPhotoForVenue("BGC Turf")).toEqual({
      src: BGC_TURF_PITCH_PHOTO,
      alt: "BGC Turf football pitch",
      label: "BGC Turf",
    });
    expect(pitchPhotoForVenue("  bgc turf ")).toMatchObject({ src: BGC_TURF_PITCH_PHOTO });
    expect(pitchPhotoForVenue("Cherry Turf")).toBeNull();
    expect(pitchPhotoForVenue(null)).toBeNull();
  });

  it("uses the pitch photo when the stored banner is an organizer logo", () => {
    expect(
      gameCoverSrc({ venue_name: "BGC Turf", banner_url: "/organizers/urban.png" })
    ).toBe(BGC_TURF_PITCH_PHOTO);
    expect(
      gameCoverSrc({ venue_name: "BGC Turf", banner_url: "https://cdn.example/custom-cover.jpg" })
    ).toBe("https://cdn.example/custom-cover.jpg");
    expect(
      gameCoverSrc({ venue_name: "Cherry Turf", banner_url: "/organizers/football-amigos.png" })
    ).toBe("/organizers/football-amigos.png");
    expect(gameCoverSrc({ venue_name: "BGC Turf", banner_url: null })).toBe(BGC_TURF_PITCH_PHOTO);
  });
});
