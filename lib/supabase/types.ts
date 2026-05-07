export type UserRole = "player" | "organizer";
export type Position = "goalkeeper" | "defender" | "midfielder" | "forward" | "any";
export type PreferredFoot = "left" | "right" | "both";
export type GameStatus = "open" | "full" | "in_progress" | "completed" | "cancelled";
export type PaymentType = "online" | "venue";
export type PaymentStatus = "pending" | "paid" | "venue" | "refunded";
export type TimerStatus = "waiting" | "running" | "paused" | "finished";

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  bio: string | null;
  nationality: string | null;
  position: Position | null;
  preferred_foot: PreferredFoot | null;
  created_at: string;
  updated_at: string;
}

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
  banner_url: string | null;
  created_at: string;
  updated_at: string;
  // joined relations
  organizer?: Profile;
  teams?: Team[];
  game_players?: GamePlayer[];
}

export interface Team {
  id: string;
  game_id: string;
  name: string;
  color: string;
  slot_number: number;
  created_at: string;
  // joined
  players?: GamePlayer[];
}

export interface GamePlayer {
  id: string;
  game_id: string;
  user_id: string;
  team_id: string | null;
  payment_status: PaymentStatus;
  paymongo_payment_id: string | null;
  joined_at: string;
  // joined
  profile?: Profile;
  team?: Team;
}

export interface Announcement {
  id: string;
  game_id: string;
  organizer_id: string;
  body: string;
  created_at: string;
  organizer?: Profile;
}

export interface Follow {
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface Message {
  id: string;
  game_id: string;
  user_id: string;
  body: string;
  created_at: string;
  profile?: Profile;
}

export interface TimerSession {
  id: string;
  game_id: string;
  current_round: number;
  current_team_a_id: string | null;
  current_team_b_id: string | null;
  round_start_time: string | null;
  status: TimerStatus;
  rotation_schedule: RotationRound[] | null;
  created_at: string;
  updated_at: string;
}

export interface RotationRound {
  round: number;
  team_a_id: string;
  team_b_id: string;
  team_a_name?: string;
  team_b_name?: string;
}
