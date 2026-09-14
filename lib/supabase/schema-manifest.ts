/**
 * Every database object the web app touches. Single source of truth for:
 *  - GET /api/health (probes each one against the live project)
 *  - __tests__/supabase/schema-manifest.test.ts (asserts RUN_ALL_IN_SUPABASE.sql
 *    creates each one, and that code does not reference anything not listed here)
 *  - supabase/SUPABASE_AUDIT.sql (hand-mirrored; keep in sync)
 *
 * When you add a table, RPC, or bucket to the app: add it here AND to
 * supabase/RUN_ALL_IN_SUPABASE.sql, or the test fails.
 */

export const EXPECTED_TABLES = [
  "profiles",
  "games",
  "teams",
  "game_players",
  "announcements",
  "organizer_broadcasts",
  "support_tickets",
  "ticket_replies",
  "wallet_transactions",
  "wallet_payment_intents",
  "payout_requests",
  "payment_attempts",
  "notifications",
  "follows",
  "messages",
  "direct_messages",
  "timer_sessions",
  "webhook_events",
  "game_waitlist",
  "tournaments",
  "tournament_teams",
  "tournament_matches",
  "tournament_team_members",
  "tournament_goals",
  "tournament_awards",
  "tournament_messages",
  "posts",
  "post_likes",
  "post_comments",
  "organizations",
  "organization_members",
  "player_reels",
  "reel_likes",
  "scout_shortlists",
  "scout_clips",
  "scout_clip_reactions",
] as const;

/** Columns added by later migrations that list/feed queries depend on. */
export const EXPECTED_COLUMNS: ReadonlyArray<readonly [table: string, column: string]> = [
  ["profiles", "phone"],
  ["profiles", "location_hidden"],
  ["profiles", "last_lat"],
  ["profiles", "last_lng"],
  ["profiles", "organizer_verified"],
  ["profiles", "preferred_areas"],
  ["profiles", "game_preference"],
  ["games", "match_type"],
  ["games", "skill_level"],
  ["games", "allow_pay_later"],
  ["games", "registration_open"],
  ["games", "is_private"],
  ["games", "organization_id"],
  ["games", "banner_url"],
  ["tournaments", "organization_id"],
  ["tournament_teams", "team_number"],
  ["tournament_teams", "is_managed"],
];

export const EXPECTED_RPCS = ["pay_match_with_wallet"] as const;

export const EXPECTED_BUCKETS = ["avatars", "game-covers", "player-reels", "scout-clips"] as const;

export type ExpectedTable = (typeof EXPECTED_TABLES)[number];
