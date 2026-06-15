// Database row types — mirror the Supabase schema (supabase/schema.sql + migrations).
// Money is always in centavos (PHP × 100).

export type Role = 'player' | 'organizer';
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'pro';
export type Position = 'goalkeeper' | 'defender' | 'midfielder' | 'forward' | 'any';
export type GamePreference = 'football' | 'futsal' | 'both';

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: Role;
  bio: string | null;
  nationality: string | null;
  position: Position | null;
  preferred_foot: 'left' | 'right' | 'both' | null;
  skill_level: SkillLevel | null;
  preferred_areas: string | null;
  game_preference: GamePreference | null;
  created_at: string;
  updated_at: string;
}

export type GameStatus = 'open' | 'full' | 'in_progress' | 'completed' | 'cancelled';
export type PaymentType = 'online' | 'venue';

export interface Game {
  id: string;
  organizer_id: string;
  title: string;
  description: string | null;
  venue_name: string;
  venue_address: string;
  venue_lat: number | null;
  venue_lng: number | null;
  date_time: string;
  price_per_player: number; // centavos
  max_players: number;
  num_teams: number;
  format: string;
  round_duration_minutes: number;
  payment_type: PaymentType;
  status: GameStatus;
  registration_open: boolean;
  is_private: boolean;
  banner_url: string | null;
  organization_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: string;
  game_id: string;
  name: string;
  color: string;
  slot_number: number;
  created_at: string;
}

export type GamePlayerStatus =
  | 'pending' | 'pending_payment' | 'reserved' | 'pending_approval'
  | 'approved' | 'rejected' | 'paid' | 'venue'
  | 'refund_requested' | 'refunded' | 'cancelled' | 'no_show';

export interface GamePlayer {
  id: string;
  game_id: string;
  user_id: string;
  team_id: string | null;
  payment_status: GamePlayerStatus;
  paymongo_payment_id: string | null;
  joined_at: string;
}

export interface Announcement {
  id: string;
  game_id: string;
  organizer_id: string;
  body: string;
  created_at: string;
}

export interface WalletTransaction {
  id: string;
  user_id: string;
  organizer_id: string | null;
  game_id: string | null;
  amount: number; // centavos
  direction: 'credit' | 'debit';
  source: 'payment' | 'refund' | 'payout' | 'adjustment';
  note: string | null;
  created_at: string;
}

export interface PayoutRequest {
  id: string;
  organizer_id: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  bank_account_name: string | null;
  bank_name: string | null;
  bank_account_number: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface AppNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  read_at: string | null;
  created_at: string;
}

export interface Message {
  id: string;
  game_id: string;
  user_id: string;
  body: string;
  created_at: string;
}

export interface DirectMessage {
  id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
}

export type TournamentFormat = 'single_elimination' | 'round_robin';
export type TournamentStatus = 'registration' | 'active' | 'completed' | 'cancelled';

export interface Tournament {
  id: string;
  organizer_id: string;
  name: string;
  description: string | null;
  format: TournamentFormat;
  status: TournamentStatus;
  venue_name: string | null;
  venue_address: string | null;
  starts_at: string;
  max_teams: number;
  team_size: number;
  entry_fee: number; // centavos per team
  banner_url: string | null;
  organization_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface TournamentTeam {
  id: string;
  tournament_id: string;
  captain_id: string;
  name: string;
  status: 'registered' | 'withdrawn';
  seed: number | null;
  created_at: string;
}

export interface TournamentMatch {
  id: string;
  tournament_id: string;
  round: number;
  position: number;
  home_team_id: string | null;
  away_team_id: string | null;
  home_score: number | null;
  away_score: number | null;
  status: 'scheduled' | 'completed' | 'bye';
  scheduled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: string;
  author_id: string;
  game_id: string | null;
  tournament_id: string | null;
  kind: 'post' | 'highlight' | 'match_result';
  body: string;
  media_url: string | null;
  created_at: string;
}

export interface PostComment {
  id: string;
  post_id: string;
  author_id: string;
  body: string;
  created_at: string;
}

export interface PlayerReel {
  id: string;
  player_id: string;
  video_url: string;
  caption: string | null;
  position: string | null;
  skill_level: string | null;
  created_at: string;
}

export interface ScoutShortlist {
  id: string;
  scout_id: string;
  player_id: string;
  note: string | null;
  created_at: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  verified: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// Common joined shapes returned by queries
export type GameWithOrganizer = Game & { organizer: Pick<Profile, 'id' | 'full_name' | 'avatar_url'> | null };
export type GamePlayerWithProfile = GamePlayer & { profile: Pick<Profile, 'id' | 'full_name' | 'avatar_url' | 'skill_level' | 'position'> | null };
export type PostWithAuthor = Post & {
  author: Pick<Profile, 'id' | 'full_name' | 'avatar_url'> | null;
  like_count: number;
  comment_count: number;
  liked_by_me: boolean;
};
