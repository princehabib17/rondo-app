import { format, formatDistanceToNow } from "date-fns";

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

export function getFlagEmoji(nationality: string): string {
  // Map country names to ISO 3166-1 alpha-2 codes
  const countryMap: Record<string, string> = {
    Philippines: "PH",
    "United States": "US",
    Brazil: "BR",
    Spain: "ES",
    England: "GB",
    Japan: "JP",
    "South Korea": "KR",
    Australia: "AU",
    Nigeria: "NG",
    Argentina: "AR",
    France: "FR",
    Germany: "DE",
    Italy: "IT",
    Portugal: "PT",
    Netherlands: "NL",
    Indonesia: "ID",
    Malaysia: "MY",
    Thailand: "TH",
    Vietnam: "VN",
    Singapore: "SG",
  };
  const code = countryMap[nationality] ?? nationality.slice(0, 2).toUpperCase();
  return code
    .toUpperCase()
    .split("")
    .map((char) => String.fromCodePoint(0x1f1e6 + char.charCodeAt(0) - 65))
    .join("");
}

export const NATIONALITIES = [
  "Philippines", "United States", "Brazil", "Spain", "England",
  "Japan", "South Korea", "Australia", "Nigeria", "Argentina",
  "France", "Germany", "Italy", "Portugal", "Netherlands",
  "Indonesia", "Malaysia", "Thailand", "Vietnam", "Singapore",
];
