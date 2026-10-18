export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export const MIN_AGE = 13;
export const MAX_AGE = 80;

export type BirthParts = { year: number; month: number; day: number };

export function daysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

export function clampDay(year: number, monthIndex: number, day: number): number {
  const max = daysInMonth(year, monthIndex);
  return Math.min(Math.max(1, day), max);
}

export function toIsoDate(parts: BirthParts): string {
  const day = clampDay(parts.year, parts.month, parts.day);
  const mm = String(parts.month + 1).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${parts.year}-${mm}-${dd}`;
}

export function fromIsoDate(iso: string): BirthParts | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  if (month < 0 || month > 11) return null;
  return { year, month, day: clampDay(year, month, day) };
}

export function yearRange(now = new Date()): { min: number; max: number } {
  const year = now.getFullYear();
  return { min: year - MAX_AGE, max: year - MIN_AGE };
}

export function defaultBirthParts(now = new Date()): BirthParts {
  const year = now.getFullYear() - 18;
  const month = now.getMonth();
  const day = clampDay(year, month, now.getDate());
  return { year, month, day };
}

export function isOldEnough(parts: BirthParts, now = new Date()): boolean {
  const cutoff = new Date(now.getFullYear() - MIN_AGE, now.getMonth(), now.getDate());
  const birth = new Date(parts.year, parts.month, clampDay(parts.year, parts.month, parts.day));
  return birth <= cutoff;
}

export function clampBirthParts(parts: BirthParts, now = new Date()): BirthParts {
  const { min, max } = yearRange(now);
  const year = Math.min(max, Math.max(min, parts.year));
  const month = Math.min(11, Math.max(0, parts.month));
  return { year, month, day: clampDay(year, month, parts.day) };
}
