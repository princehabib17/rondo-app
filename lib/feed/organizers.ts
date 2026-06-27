export interface OrganizerGroup {
  id: string;
  full_name: string | null;
  avatar_url?: string | null;
  verified?: boolean;
}

/** Placeholder groups shown until real organizers exist in the database. */
export const PLACEHOLDER_ORGANIZERS: OrganizerGroup[] = [
  { id: "urban", full_name: "Urban Football", avatar_url: "/organizers/urban.png", verified: true },
  { id: "tsl", full_name: "TSL", avatar_url: "/organizers/tsl.png", verified: true },
  { id: "liman-style", full_name: "Liman Style", avatar_url: "/organizers/liman-style.png", verified: true },
  { id: "east-football-united", full_name: "East Football United", avatar_url: "/organizers/east-football-united.png", verified: true },
  { id: "golazo", full_name: "Golazo", avatar_url: "/organizers/golazo.png", verified: true },
  { id: "football-amigos", full_name: "Football Amigos", avatar_url: "/organizers/football-amigos.png", verified: true },
  { id: "elitepro", full_name: "ElitePro", avatar_url: "/organizers/elitepro.png", verified: true },
  { id: "futsal-mnl", full_name: "Futsal MNL", avatar_url: "/organizers/futsal-mnl.png", verified: true },
];

export function getOrganizerInitials(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}
