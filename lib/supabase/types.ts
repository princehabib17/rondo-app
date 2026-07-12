export type UserRole = "player" | "organizer" | "admin";
export type Position = "goalkeeper" | "defender" | "midfielder" | "forward" | "any";
export type PreferredFoot = "left" | "right" | "both";
export type SkillLevel = "beginner" | "intermediate" | "advanced" | "pro";
export type GameStatus = "open" | "full" | "in_progress" | "completed" | "cancelled";
export type PaymentType = "online" | "venue";
export type MatchType = "football" | "futsal";
export type PaymentStatus =
  | "pending"
  | "pending_payment"
  | "reserved"
  | "pending_approval"
  | "approved"
  | "rejected"
  | "paid"
  | "venue"
  | "refund_requested"
  | "refunded"
  | "cancelled"
  | "no_show";
export type TimerStatus = "waiting" | "running" | "paused" | "finished";

export interface Profile {
  id: string;
  email: string | null;
  phone?: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  bio: string | null;
  nationality: string | null;
  position: Position | null;
  preferred_foot: PreferredFoot | null;
  skill_level?: SkillLevel | null;
  preferred_areas?: string | null;
  game_preference?: "football" | "futsal" | "both" | null;
  organizer_verified?: boolean;
  location_hidden?: boolean;
  last_lat?: number | null;
  last_lng?: number | null;
  created_at: string;
  updated_at: string;
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

export interface OrganizationMember {
  organization_id: string;
  user_id: string;
  role: "owner" | "admin" | "manager";
  status: "active" | "requested" | "invited" | "rejected";
  requested_at: string;
  approved_at: string | null;
  organization?: Organization;
}

export interface Game {
  id: string;
  organizer_id: string;
  organization_id?: string | null;
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
  match_type?: MatchType | null;
  skill_level?: SkillLevel | null;
  registration_open?: boolean;
  is_private?: boolean;
  allow_pay_later?: boolean;
  banner_url: string | null;
  created_at: string;
  updated_at: string;
  // joined relations
  organizer?: Profile;
  organization?: Organization | null;
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

/** PayMongo webhook idempotency record (service role only). */
export interface WebhookEvent {
  id: string;
  event_type: string;
  processed_at: string;
}

export interface SupportTicket {
  id: string;
  user_id: string;
  game_id: string | null;
  type:
    | "payment_issue"
    | "refund_request"
    | "game_cancelled"
    | "organizer_issue"
    | "player_issue"
    | "app_issue"
    | "other";
  description: string;
  refund_requested: boolean;
  status: "open" | "in_review" | "resolved" | "refund_pending" | "refunded" | "closed";
  admin_note: string | null;
  created_at: string;
  updated_at: string;
}

export interface WalletTransaction {
  id: string;
  user_id: string;
  organizer_id: string | null;
  game_id: string | null;
  amount: number;
  direction: "credit" | "debit";
  source: "payment" | "refund" | "payout" | "adjustment";
  note: string | null;
  created_at: string;
}

export interface PayoutRequest {
  id: string;
  organizer_id: string;
  amount: number;
  status: "pending" | "approved" | "rejected" | "paid";
  bank_account_name: string | null;
  bank_name: string | null;
  bank_account_number: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface GameWaitlistEntry {
  id: string;
  game_id: string;
  user_id: string;
  team_id: string | null;
  status: "waiting" | "refused";
  created_at: string;
  profile?: Profile;
}

export interface DirectMessage {
  id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
  sender?: Profile;
  recipient?: Profile;
}

export type TournamentFormat = "single_elimination" | "round_robin";
export type TournamentStatus = "registration" | "active" | "completed" | "cancelled";
export type TournamentMatchStatus = "scheduled" | "completed" | "bye";
export type TournamentMessageKind = "text" | "announcement" | "match_result" | "system";
export type PostKind = "post" | "highlight" | "match_result";

export interface Tournament {
  id: string;
  organizer_id: string;
  organization_id?: string | null;
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
  created_at: string;
  updated_at: string;
  // joined relations
  organizer?: Profile;
  organization?: Organization | null;
  tournament_teams?: TournamentTeam[];
}

export interface TournamentTeam {
  id: string;
  tournament_id: string;
  captain_id: string;
  name: string;
  status: "registered" | "withdrawn";
  seed: number | null;
  team_number: number | null;
  is_managed?: boolean;
  created_at: string;
  // joined
  captain?: Profile;
  tournament_team_members?: TournamentTeamMember[];
}

export interface TournamentTeamMember {
  id: string;
  tournament_id: string;
  team_id: string;
  user_id: string;
  role: "captain" | "player";
  created_at: string;
  // joined
  profile?: Profile;
}

export interface TournamentGoal {
  id: string;
  tournament_id: string;
  match_id: string;
  team_id: string;
  scorer_id: string | null;
  scorer_name: string | null;
  goals: number;
  created_at: string;
  // joined
  scorer?: Profile | null;
}

export type TournamentAwardKind = "champion" | "runner_up" | "top_scorer";

export interface TournamentAward {
  id: string;
  tournament_id: string;
  user_id: string;
  team_id: string | null;
  kind: TournamentAwardKind;
  tournament_name: string;
  team_name: string | null;
  detail: string | null;
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
  status: TournamentMatchStatus;
  scheduled_at: string | null;
  created_at: string;
  updated_at: string;
  // joined
  home_team?: TournamentTeam | null;
  away_team?: TournamentTeam | null;
}

export interface TournamentMessage {
  id: string;
  tournament_id: string;
  user_id: string;
  kind: TournamentMessageKind;
  body: string;
  created_at: string;
  // joined
  author?: Profile;
}

export interface Post {
  id: string;
  author_id: string;
  game_id: string | null;
  tournament_id: string | null;
  kind: PostKind;
  body: string;
  media_url: string | null;
  created_at: string;
  // joined
  author?: Profile;
  game?: Pick<Game, "id" | "title" | "venue_name" | "date_time"> | null;
  tournament?: Pick<Tournament, "id" | "name" | "status" | "venue_name" | "starts_at"> | null;
  post_likes?: { user_id: string }[];
  post_comments?: { count: number }[];
}

export interface PostComment {
  id: string;
  post_id: string;
  author_id: string;
  body: string;
  created_at: string;
  // joined
  author?: Profile;
}

export interface PlayerReel {
  id: string;
  player_id: string;
  video_url: string;
  caption: string | null;
  position: string | null;
  skill_level: string | null;
  created_at: string;
  // joined
  player?: Profile;
  reel_likes?: { user_id: string }[];
}

export interface ScoutShortlist {
  id: string;
  scout_id: string;
  player_id: string;
  note: string | null;
  created_at: string;
  player?: Profile;
}

export type ScoutReactionKind = "like" | "save" | "scout";

export interface ScoutClip {
  id: string;
  player_id: string;
  video_url: string;
  thumbnail_url: string | null;
  caption: string;
  position: string | null;
  skill_tags: string[];
  is_public: boolean;
  created_at: string;
  updated_at: string;
  // joined
  player?: Profile;
  scout_clip_reactions?: { user_id: string; kind: ScoutReactionKind }[];
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
