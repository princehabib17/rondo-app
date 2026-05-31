import type { Game, MatchType, SkillLevel } from "@/lib/supabase/types";

export type SkillGroup = "casual" | "intermediate" | "serious";
export type PrivacyFilter = "all" | "public" | "private";
export type SortKey = "soonest" | "distance" | "price_low" | "price_high";
export type DateFilter = "any" | "today" | "tomorrow" | "weekend" | "week";
export type TimeFilter = "any" | "morning" | "afternoon" | "evening";
export type PriceFilter = "any" | "free" | "under200" | "200to400" | "over400";

export interface FeedFilters {
  areas: string[];
  matchTypes: MatchType[];
  skill: SkillGroup | null;
  privacy: PrivacyFilter;
  date: DateFilter;
  time: TimeFilter;
  price: PriceFilter;
  sort: SortKey;
}

export const DEFAULT_FILTERS: FeedFilters = {
  areas: [],
  matchTypes: [],
  skill: null,
  privacy: "all",
  date: "any",
  time: "any",
  price: "any",
  sort: "soonest",
};

/** Metro Manila football/futsal hubs, plus aliases for matching venue text. */
export const FEED_AREAS: { label: string; aliases: string[] }[] = [
  { label: "BGC", aliases: ["bgc", "bonifacio global", "fort bonifacio", "taguig"] },
  { label: "Makati", aliases: ["makati"] },
  { label: "Mandaluyong", aliases: ["mandaluyong"] },
  { label: "Ortigas", aliases: ["ortigas"] },
  { label: "Quezon City", aliases: ["quezon city", "q.c", "qc", "diliman", "katipunan"] },
  { label: "Pasig", aliases: ["pasig", "kapitolyo"] },
  { label: "Taguig", aliases: ["taguig", "mckinley", "bgc"] },
  { label: "Manila", aliases: ["manila", "ermita", "malate", "binondo"] },
  { label: "Parañaque", aliases: ["paranaque", "parañaque", "bf homes"] },
  { label: "San Juan", aliases: ["san juan"] },
  { label: "Pasay", aliases: ["pasay", "moa", "mall of asia"] },
  { label: "Alabang", aliases: ["alabang", "muntinlupa", "filinvest"] },
];

const SKILL_TO_GROUP: Record<SkillLevel, SkillGroup> = {
  beginner: "casual",
  intermediate: "intermediate",
  advanced: "serious",
  pro: "serious",
};

export const SKILL_GROUP_LABEL: Record<SkillGroup, string> = {
  casual: "Casual",
  intermediate: "Intermediate",
  serious: "Serious",
};

/** Derive match type from the format string when the column is absent. */
export function deriveMatchType(format: string | null | undefined): MatchType {
  const f = (format ?? "").toLowerCase();
  if (/(^|[^0-9])(5v5|4v4|3v3)/.test(f) || f.includes("futsal")) return "futsal";
  return "football";
}

export function getMatchType(game: Game): MatchType {
  return game.match_type ?? deriveMatchType(game.format);
}

export function getSkillGroup(game: Game): SkillGroup | null {
  return game.skill_level ? SKILL_TO_GROUP[game.skill_level] : null;
}

export function getPlayerCount(game: Game): number {
  return game.game_players?.length ?? 0;
}

export function isAlmostFull(game: Game): boolean {
  const count = getPlayerCount(game);
  const ratio = game.max_players > 0 ? count / game.max_players : 0;
  return ratio >= 0.8 && count < game.max_players;
}

export function isFull(game: Game): boolean {
  return getPlayerCount(game) >= game.max_players;
}

export function gameMatchesArea(game: Game, areaLabel: string): boolean {
  const area = FEED_AREAS.find((a) => a.label === areaLabel);
  if (!area) return true;
  const haystack = `${game.venue_name} ${game.venue_address}`.toLowerCase();
  return area.aliases.some((alias) => haystack.includes(alias));
}

/** Great-circle distance in kilometres. */
export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export interface Coords {
  lat: number;
  lng: number;
}

export function gameDistanceKm(game: Game, coords: Coords | null): number | null {
  if (!coords || game.venue_lat == null || game.venue_lng == null) return null;
  return haversineKm(coords.lat, coords.lng, game.venue_lat, game.venue_lng);
}

function matchesDate(game: Game, filter: DateFilter): boolean {
  if (filter === "any") return true;
  const d = new Date(game.date_time);
  const now = new Date();

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (filter === "today") return sameDay(d, now);
  if (filter === "tomorrow") {
    const t = new Date(now);
    t.setDate(now.getDate() + 1);
    return sameDay(d, t);
  }
  if (filter === "weekend") {
    const day = d.getDay(); // 0 Sun, 6 Sat
    const withinWeek = d.getTime() - now.getTime() <= 7 * 24 * 60 * 60 * 1000;
    return (day === 0 || day === 6) && withinWeek && d.getTime() >= now.getTime();
  }
  // week
  return (
    d.getTime() >= now.getTime() &&
    d.getTime() - now.getTime() <= 7 * 24 * 60 * 60 * 1000
  );
}

function matchesTime(game: Game, filter: TimeFilter): boolean {
  if (filter === "any") return true;
  const hour = new Date(game.date_time).getHours();
  if (filter === "morning") return hour >= 5 && hour < 12;
  if (filter === "afternoon") return hour >= 12 && hour < 17;
  return hour >= 17 || hour < 5; // evening / night
}

function matchesPrice(game: Game, filter: PriceFilter): boolean {
  if (filter === "any") return true;
  const p = game.price_per_player;
  if (filter === "free") return p === 0;
  if (filter === "under200") return p > 0 && p < 20000;
  if (filter === "200to400") return p >= 20000 && p <= 40000;
  return p > 40000; // over400
}

export interface FilterContext {
  coords: Coords | null;
}

export function applyFeedFilters(
  games: Game[],
  filters: FeedFilters,
  ctx: FilterContext
): Game[] {
  return games.filter((game) => {
    if (filters.areas.length > 0 && !filters.areas.some((a) => gameMatchesArea(game, a)))
      return false;

    if (filters.matchTypes.length > 0 && !filters.matchTypes.includes(getMatchType(game)))
      return false;

    if (filters.skill) {
      const group = getSkillGroup(game);
      if (group !== filters.skill) return false;
    }

    if (filters.privacy === "public" && game.is_private) return false;
    if (filters.privacy === "private" && !game.is_private) return false;

    if (!matchesDate(game, filters.date)) return false;
    if (!matchesTime(game, filters.time)) return false;
    if (!matchesPrice(game, filters.price)) return false;

    return true;
  });
}

export function sortFeedGames(
  games: Game[],
  sort: SortKey,
  ctx: FilterContext
): Game[] {
  const copy = [...games];
  if (sort === "price_low") return copy.sort((a, b) => a.price_per_player - b.price_per_player);
  if (sort === "price_high") return copy.sort((a, b) => b.price_per_player - a.price_per_player);
  if (sort === "distance" && ctx.coords) {
    return copy.sort((a, b) => {
      const da = gameDistanceKm(a, ctx.coords) ?? Number.POSITIVE_INFINITY;
      const db = gameDistanceKm(b, ctx.coords) ?? Number.POSITIVE_INFINITY;
      return da - db;
    });
  }
  // soonest (default)
  return copy.sort(
    (a, b) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime()
  );
}

/** Number of active (non-default) filter groups, for the chip badge. */
export function countActiveFilters(filters: FeedFilters): number {
  let n = 0;
  if (filters.areas.length > 0) n += 1;
  if (filters.matchTypes.length > 0) n += 1;
  if (filters.skill) n += 1;
  if (filters.privacy !== "all") n += 1;
  if (filters.date !== "any") n += 1;
  if (filters.time !== "any") n += 1;
  if (filters.price !== "any") n += 1;
  if (filters.sort !== "soonest") n += 1;
  return n;
}

/** Human chips for the active filters, each with a key to clear it. */
export type ActiveChip = { key: string; label: string };

const DATE_LABEL: Record<DateFilter, string> = {
  any: "",
  today: "Today",
  tomorrow: "Tomorrow",
  weekend: "This weekend",
  week: "This week",
};
const TIME_LABEL: Record<TimeFilter, string> = {
  any: "",
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
};
const PRICE_LABEL: Record<PriceFilter, string> = {
  any: "",
  free: "Free",
  under200: "Under ₱200",
  "200to400": "₱200–₱400",
  over400: "Over ₱400",
};
const SORT_LABEL: Record<SortKey, string> = {
  soonest: "",
  distance: "Nearest first",
  price_low: "Price: low to high",
  price_high: "Price: high to low",
};

export function getActiveChips(filters: FeedFilters): ActiveChip[] {
  const chips: ActiveChip[] = [];
  filters.areas.forEach((a) => chips.push({ key: `area:${a}`, label: a }));
  filters.matchTypes.forEach((m) =>
    chips.push({ key: `match:${m}`, label: m === "futsal" ? "Futsal" : "Football" })
  );
  if (filters.skill) chips.push({ key: "skill", label: SKILL_GROUP_LABEL[filters.skill] });
  if (filters.privacy !== "all")
    chips.push({ key: "privacy", label: filters.privacy === "private" ? "Private" : "Public" });
  if (filters.date !== "any") chips.push({ key: "date", label: DATE_LABEL[filters.date] });
  if (filters.time !== "any") chips.push({ key: "time", label: TIME_LABEL[filters.time] });
  if (filters.price !== "any") chips.push({ key: "price", label: PRICE_LABEL[filters.price] });
  if (filters.sort !== "soonest") chips.push({ key: "sort", label: SORT_LABEL[filters.sort] });
  return chips;
}

export function clearChip(filters: FeedFilters, key: string): FeedFilters {
  if (key.startsWith("area:")) {
    const area = key.slice(5);
    return { ...filters, areas: filters.areas.filter((a) => a !== area) };
  }
  if (key.startsWith("match:")) {
    const m = key.slice(6) as MatchType;
    return { ...filters, matchTypes: filters.matchTypes.filter((x) => x !== m) };
  }
  switch (key) {
    case "skill":
      return { ...filters, skill: null };
    case "privacy":
      return { ...filters, privacy: "all" };
    case "date":
      return { ...filters, date: "any" };
    case "time":
      return { ...filters, time: "any" };
    case "price":
      return { ...filters, price: "any" };
    case "sort":
      return { ...filters, sort: "soonest" };
    default:
      return filters;
  }
}
