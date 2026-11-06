/** Current Rondo matches are in Philippine venues; use venue time on every device. */
export const VENUE_TIME_ZONE = "Asia/Manila";
export function venueTime(value: string | Date): string {
  return new Intl.DateTimeFormat("en-US", { timeZone: VENUE_TIME_ZONE, hour: "numeric", minute: "2-digit", hour12: true }).format(new Date(value));
}
export function venueDate(value: string | Date): string {
  return new Intl.DateTimeFormat("en-US", { timeZone: VENUE_TIME_ZONE, weekday: "short", month: "short", day: "numeric" }).format(new Date(value));
}
export function venueDay(value: string | Date, now = new Date()): string {
  const dayKey = (date: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: VENUE_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
  const date = new Date(value);
  if (dayKey(date) === dayKey(now)) return "Today";
  if (dayKey(date) === dayKey(new Date(now.getTime() + 86400000))) return "Tomorrow";
  return venueDate(date);
}
