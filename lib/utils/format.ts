import { format, formatDistanceToNow } from "date-fns";
import { COUNTRY_OPTIONS, getFlagEmoji as flagFromNationality } from "@/lib/countries";

export function formatGameDate(dateString: string): string {
  return format(new Date(dateString), "EEEE, MMMM d 'at' h:mm a");
}

export function formatGameTime(dateString: string): string {
  return format(new Date(dateString), "h:mm a");
}

export function formatRelativeTime(dateString: string): string {
  return formatDistanceToNow(new Date(dateString), { addSuffix: true });
}

export function formatPrice(centavos: number): string {
  return `₱${(centavos / 100).toLocaleString("en-PH")}`;
}

export function formatDuration(minutes: number): string {
  return `${minutes} min`;
}

export function getFlagEmoji(nationality: string | null | undefined): string {
  return flagFromNationality(nationality);
}

export const NATIONALITIES = COUNTRY_OPTIONS.map((country) => country.name);
