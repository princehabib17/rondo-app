export type MatchType = "football" | "futsal";

export interface VenueSeed {
  name: string;
  address: string;
  lat: number;
  lng: number;
}

export interface ScheduleSlot {
  /** 0 = Sunday … 6 = Saturday */
  weekdays: number[];
  hour: number;
  minute: number;
  priceCentavos: number;
  venue: VenueSeed;
  title: string;
  description?: string;
  format?: string;
  matchType?: MatchType;
  maxPlayers?: number;
  /** When set, creates multiple games at the same slot (e.g. chill + competitive fields). */
  variants?: { titleSuffix: string; description?: string }[];
}

export interface OrganizerSeed {
  slug: string;
  email: string;
  full_name: string;
  avatar_url: string;
  phone?: string;
  bio: string;
  verified: boolean;
  preferred_areas: string;
  game_preference: "football" | "futsal" | "both";
  organizationName: string;
  schedules: ScheduleSlot[];
}

const VENUES = {
  bgcTurf: {
    name: "BGC Turf",
    address: "Bonifacio Global City, Taguig, Metro Manila",
    lat: 14.5495,
    lng: 121.0478,
  },
  moa: {
    name: "MOA Football Pitch",
    address: "Mall of Asia Complex, Pasay, Metro Manila",
    lat: 14.5352,
    lng: 120.9822,
  },
  mckinleyHills: {
    name: "McKinley Hills Turf",
    address: "McKinley Hill, Taguig, Metro Manila",
    lat: 14.5469,
    lng: 121.0505,
  },
  axisResidences: {
    name: "Axis Residences",
    address: "Axis Residences, Mandaluyong, Metro Manila",
    lat: 14.5765,
    lng: 121.0532,
  },
  cherryTurf: {
    name: "Cherry Turf",
    address: "Cherry Sports, Mandaluyong, Metro Manila",
    lat: 14.5708,
    lng: 121.0389,
  },
  eastMetro: {
    name: "East Metro Turf",
    address: "Pasig City, Metro Manila",
    lat: 14.5764,
    lng: 121.0845,
  },
} as const satisfies Record<string, VenueSeed>;

/** Real-world placeholder organizers with recurring schedules. */
export const PLACEHOLDER_ORGANIZER_SEEDS: OrganizerSeed[] = [
  {
    slug: "urban",
    email: "urban@organizers.rondo",
    full_name: "Urban Football",
    avatar_url: "/organizers/urban.png",
    phone: "09154191784",
    bio: "Open play at BGC Turf. Weekly sessions with chill and competitive sides on select nights. Field sharing available for select slots.",
    verified: true,
    preferred_areas: "BGC, Taguig",
    game_preference: "football",
    organizationName: "Urban Football",
    schedules: [
      {
        weekdays: [2],
        hour: 20,
        minute: 0,
        priceCentavos: 30000,
        venue: VENUES.bgcTurf,
        title: "Open Play — Tuesday Night",
        format: "7v7",
        matchType: "football",
      },
      {
        weekdays: [3],
        hour: 20,
        minute: 0,
        priceCentavos: 30000,
        venue: VENUES.bgcTurf,
        title: "Open Play — Wednesday Night",
        format: "7v7",
        matchType: "football",
      },
      {
        weekdays: [4],
        hour: 20,
        minute: 0,
        priceCentavos: 30000,
        venue: VENUES.bgcTurf,
        title: "Open Play — Thursday Night",
        description: "Two fields available — chill side and competitive side.",
        format: "7v7",
        matchType: "football",
        variants: [
          { titleSuffix: "Chill Side", description: "Relaxed pace, all levels welcome." },
          { titleSuffix: "Competitive Side", description: "Higher intensity run. Bring your A game." },
        ],
      },
      {
        weekdays: [5],
        hour: 20,
        minute: 0,
        priceCentavos: 30000,
        venue: VENUES.bgcTurf,
        title: "Open Play — Friday Night (8–10 PM)",
        format: "7v7",
        matchType: "football",
      },
      {
        weekdays: [5],
        hour: 22,
        minute: 0,
        priceCentavos: 30000,
        venue: VENUES.bgcTurf,
        title: "Open Play — Friday Late (10 PM–12 AM)",
        format: "7v7",
        matchType: "football",
      },
      {
        weekdays: [6],
        hour: 22,
        minute: 0,
        priceCentavos: 25000,
        venue: VENUES.bgcTurf,
        title: "Open Play — Saturday Late",
        description: "Two fields available — chill side and competitive side. ₱250/player.",
        format: "7v7",
        matchType: "football",
        variants: [
          { titleSuffix: "Chill Side" },
          { titleSuffix: "Competitive Side" },
        ],
      },
      {
        weekdays: [0],
        hour: 18,
        minute: 0,
        priceCentavos: 30000,
        venue: VENUES.bgcTurf,
        title: "Open Play — Sunday Evening",
        format: "7v7",
        matchType: "football",
      },
    ],
  },
  {
    slug: "liman-style",
    email: "liman-style@organizers.rondo",
    full_name: "Liman Style",
    avatar_url: "/organizers/liman-style.png",
    bio: "Weekly open play at MOA. Wednesday and Saturday nights, 9–11 PM.",
    verified: true,
    preferred_areas: "MOA, Pasay",
    game_preference: "football",
    organizationName: "Liman Style",
    schedules: [
      {
        weekdays: [3],
        hour: 21,
        minute: 0,
        priceCentavos: 30000,
        venue: VENUES.moa,
        title: "Open Play — Wednesday Night",
        format: "7v7",
        matchType: "football",
      },
      {
        weekdays: [6],
        hour: 21,
        minute: 0,
        priceCentavos: 30000,
        venue: VENUES.moa,
        title: "Open Play — Saturday Night",
        format: "7v7",
        matchType: "football",
      },
    ],
  },
  {
    slug: "east-football-united",
    email: "east-football-united@organizers.rondo",
    full_name: "East Football United",
    avatar_url: "/organizers/east-football-united.png",
    bio: "Tuesday, Thursday, and Friday night football. 9–11 PM.",
    verified: true,
    preferred_areas: "Pasig, East Metro",
    game_preference: "football",
    organizationName: "East Football United",
    schedules: [
      {
        weekdays: [2],
        hour: 21,
        minute: 0,
        priceCentavos: 30000,
        venue: VENUES.eastMetro,
        title: "Open Play — Tuesday Night",
        format: "7v7",
        matchType: "football",
      },
      {
        weekdays: [4],
        hour: 21,
        minute: 0,
        priceCentavos: 30000,
        venue: VENUES.eastMetro,
        title: "Open Play — Thursday Night",
        format: "7v7",
        matchType: "football",
      },
      {
        weekdays: [5],
        hour: 21,
        minute: 0,
        priceCentavos: 30000,
        venue: VENUES.eastMetro,
        title: "Open Play — Friday Night",
        format: "7v7",
        matchType: "football",
      },
    ],
  },
  {
    slug: "tsl",
    email: "tsl@organizers.rondo",
    full_name: "TSL",
    avatar_url: "/organizers/tsl.png",
    bio: "Thursday night football at McKinley Hills. 8–10 PM, ₱250/player.",
    verified: true,
    preferred_areas: "McKinley Hill, BGC, Taguig",
    game_preference: "football",
    organizationName: "TSL",
    schedules: [
      {
        weekdays: [4],
        hour: 20,
        minute: 0,
        priceCentavos: 25000,
        venue: VENUES.mckinleyHills,
        title: "Open Play — Thursday Night",
        format: "7v7",
        matchType: "football",
      },
    ],
  },
  {
    slug: "football-amigos",
    email: "football-amigos@organizers.rondo",
    full_name: "Football Amigos",
    avatar_url: "/organizers/football-amigos.png",
    bio: "Futsal at Axis Residences (Wed & Sat) and Cherry Turf (Sun) in Mandaluyong.",
    verified: true,
    preferred_areas: "Mandaluyong",
    game_preference: "futsal",
    organizationName: "Football Amigos",
    schedules: [
      {
        weekdays: [3],
        hour: 22,
        minute: 0,
        priceCentavos: 30000,
        venue: VENUES.axisResidences,
        title: "Futsal — Wednesday Night",
        description: "10 PM–12:30 AM at Axis Residences.",
        format: "5v5",
        matchType: "futsal",
        maxPlayers: 10,
      },
      {
        weekdays: [6],
        hour: 22,
        minute: 0,
        priceCentavos: 30000,
        venue: VENUES.axisResidences,
        title: "Futsal — Saturday Night",
        description: "10 PM–12:30 AM at Axis Residences.",
        format: "5v5",
        matchType: "futsal",
        maxPlayers: 10,
      },
      {
        weekdays: [0],
        hour: 18,
        minute: 0,
        priceCentavos: 30000,
        venue: VENUES.cherryTurf,
        title: "Futsal — Sunday Early",
        description: "6–8 PM at Cherry Turf.",
        format: "5v5",
        matchType: "futsal",
        maxPlayers: 10,
      },
      {
        weekdays: [0],
        hour: 20,
        minute: 0,
        priceCentavos: 30000,
        venue: VENUES.cherryTurf,
        title: "Futsal — Sunday Night",
        description: "8–10 PM at Cherry Turf.",
        format: "5v5",
        matchType: "futsal",
        maxPlayers: 10,
      },
    ],
  },
];

const MANILA_OFFSET = "+08:00";
const MANILA_WEEKDAY: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

/** Build an ISO timestamp in Asia/Manila without extra dependencies. */
export function manilaIso(year: number, month: number, day: number, hour: number, minute: number): string {
  return `${year}-${pad2(month)}-${pad2(day)}T${pad2(hour)}:${pad2(minute)}:00${MANILA_OFFSET}`;
}

function getManilaCalendarParts(date: Date): { year: number; month: number; day: number; weekday: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    weekday: "short",
  }).formatToParts(date);

  const map: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== "literal") map[part.type] = part.value;
  }

  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    weekday: MANILA_WEEKDAY[map.weekday] ?? 0,
  };
}

function addManilaDays(
  anchor: { year: number; month: number; day: number },
  days: number
): { year: number; month: number; day: number; weekday: number } {
  const noonMs = Date.parse(manilaIso(anchor.year, anchor.month, anchor.day, 12, 0));
  return getManilaCalendarParts(new Date(noonMs + days * 24 * 60 * 60 * 1000));
}

export function upcomingSlotDates(
  weekdays: number[],
  hour: number,
  minute: number,
  weeksAhead: number,
  from = new Date()
): string[] {
  const slots: string[] = [];
  const fromMs = from.getTime();
  const anchor = getManilaCalendarParts(from);
  const maxDays = weeksAhead * 7;

  for (let offset = 0; offset <= maxDays; offset += 1) {
    const day = addManilaDays(anchor, offset);
    if (!weekdays.includes(day.weekday)) continue;

    const iso = manilaIso(day.year, day.month, day.day, hour, minute);
    if (Date.parse(iso) > fromMs) {
      slots.push(iso);
    }
  }

  return slots;
}

export interface GameInsertRow {
  organizer_id: string;
  organization_id: string;
  title: string;
  description: string | null;
  venue_name: string;
  venue_address: string;
  venue_lat: number;
  venue_lng: number;
  date_time: string;
  price_per_player: number;
  max_players: number;
  num_teams: number;
  format: string;
  round_duration_minutes: number;
  payment_type: "online";
  status: "open";
  match_type: MatchType;
  registration_open: boolean;
  banner_url: string | null;
}

export function buildGamesForOrganizer(
  organizerId: string,
  organizationId: string,
  seed: OrganizerSeed,
  weeksAhead = 3,
  from = new Date()
): GameInsertRow[] {
  const games: GameInsertRow[] = [];

  for (const schedule of seed.schedules) {
    const dates = upcomingSlotDates(schedule.weekdays, schedule.hour, schedule.minute, weeksAhead, from);
    const format = schedule.format ?? "7v7";
    const matchType = schedule.matchType ?? "football";
    const maxPlayers = schedule.maxPlayers ?? (matchType === "futsal" ? 10 : 14);
    const variants = schedule.variants?.length
      ? schedule.variants
      : [{ titleSuffix: "", description: schedule.description }];

    for (const dateTime of dates) {
      for (const variant of variants) {
        const title = variant.titleSuffix
          ? `${schedule.title} (${variant.titleSuffix})`
          : schedule.title;

        games.push({
          organizer_id: organizerId,
          organization_id: organizationId,
          title,
          description: variant.description ?? schedule.description ?? seed.bio,
          venue_name: schedule.venue.name,
          venue_address: schedule.venue.address,
          venue_lat: schedule.venue.lat,
          venue_lng: schedule.venue.lng,
          date_time: dateTime,
          price_per_player: schedule.priceCentavos,
          max_players: maxPlayers,
          num_teams: 2,
          format,
          round_duration_minutes: matchType === "futsal" ? 8 : 10,
          payment_type: "online",
          status: "open",
          match_type: matchType,
          registration_open: true,
          banner_url: seed.avatar_url,
        });
      }
    }
  }

  return games.sort((a, b) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime());
}
