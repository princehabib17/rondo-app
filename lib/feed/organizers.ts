export interface OrganizerGroup {
  id: string;
  full_name: string | null;
  avatar_url?: string | null;
  verified?: boolean;
}

/** Placeholder groups shown until real organizers exist in the database. */
export const PLACEHOLDER_ORGANIZERS: OrganizerGroup[] = [
  { id: "placeholder-1", full_name: "Football Amigos", verified: true },
  { id: "placeholder-2", full_name: "Football Manila", verified: true },
  { id: "placeholder-3", full_name: "7s League", verified: true },
  { id: "placeholder-4", full_name: "Urban Football", verified: true },
  { id: "placeholder-5", full_name: "Sunday League", verified: true },
];

export function getOrganizerInitials(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}
