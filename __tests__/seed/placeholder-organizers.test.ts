import { describe, expect, it } from "vitest";
import {
  PLACEHOLDER_ORGANIZER_SEEDS,
  buildGamesForOrganizer,
  manilaIso,
  upcomingSlotDates,
} from "@/lib/seed/placeholder-organizers";

describe("placeholder organizer seed", () => {
  it("builds Manila timestamps with +08:00 offset", () => {
    expect(manilaIso(2026, 6, 27, 21, 0)).toBe("2026-06-27T21:00:00+08:00");
  });

  it("returns upcoming Wednesday slots in Manila time", () => {
    const from = new Date("2026-06-27T10:00:00+08:00"); // Friday in Manila
    const slots = upcomingSlotDates([3], 21, 0, 2, from);
    expect(slots[0]).toBe("2026-07-01T21:00:00+08:00");
    expect(slots[1]).toBe("2026-07-08T21:00:00+08:00");
  });

  it("creates Urban Thursday as two field variants", () => {
    const urban = PLACEHOLDER_ORGANIZER_SEEDS.find((seed) => seed.slug === "urban");
    expect(urban).toBeDefined();

    const games = buildGamesForOrganizer(
      "org-user",
      "org-id",
      urban!,
      1,
      new Date("2026-06-23T00:00:00+08:00")
    );

    const thursdayGames = games.filter((game) => game.title.includes("Thursday"));
    expect(thursdayGames).toHaveLength(2);
    expect(thursdayGames.map((game) => game.title)).toEqual(
      expect.arrayContaining([
        "Open Play — Thursday Night (Chill Side)",
        "Open Play — Thursday Night (Competitive Side)",
      ])
    );
  });

  it("creates Football Amigos futsal sessions", () => {
    const amigos = PLACEHOLDER_ORGANIZER_SEEDS.find((seed) => seed.slug === "football-amigos");
    expect(amigos).toBeDefined();

    const games = buildGamesForOrganizer(
      "org-user",
      "org-id",
      amigos!,
      1,
      new Date("2026-06-27T00:00:00+08:00")
    );

    expect(games.some((game) => game.match_type === "futsal" && game.venue_name === "Axis Residences")).toBe(
      true
    );
    expect(games.some((game) => game.venue_name === "Cherry Turf")).toBe(true);
  });
});
