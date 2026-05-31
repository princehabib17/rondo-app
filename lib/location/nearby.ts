import { haversineKm, type Coords } from "@/lib/feed/filters";
import type { Profile } from "@/lib/supabase/types";

export type NearbyPlayer = Profile & {
  distanceKm: number;
};

export function sortProfilesByDistance(
  profiles: Profile[],
  coords: Coords,
  excludeUserId?: string | null
): NearbyPlayer[] {
  return profiles
    .filter((p) => p.id !== excludeUserId)
    .filter((p) => !p.location_hidden)
    .filter((p) => p.last_lat != null && p.last_lng != null)
    .map((p) => ({
      ...p,
      distanceKm: haversineKm(coords.lat, coords.lng, p.last_lat!, p.last_lng!),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

export function formatPlayerDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m away`;
  return `${km.toFixed(1)} km away`;
}
