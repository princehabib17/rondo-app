-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Enable PostGIS for location queries (optional, use simple lat/lng for now)

-- ============================================================
-- USERS (extends Supabase auth.users)
-- ============================================================
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  full_name text,
  avatar_url text,
  role text not null default 'player' check (role in ('player', 'organizer')),
  bio text,
  nationality text,
  position text check (position in ('goalkeeper', 'defender', 'midfielder', 'forward', 'any')),
  preferred_foot text check (preferred_foot in ('left', 'right', 'both')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- GAMES
-- ============================================================
create table public.games (
  id uuid default uuid_generate_v4() primary key,
  organizer_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  venue_name text not null,
  venue_address text not null,
  venue_lat double precision,
  venue_lng double precision,
  date_time timestamptz not null,
  price_per_player integer not null default 0, -- in centavos (PHP)
  max_players integer not null default 10,
  num_teams integer not null default 2,
  format text not null default '5v5', -- e.g. '5v5', '7v7', '11v11'
  round_duration_minutes integer not null default 8,
  payment_type text not null default 'venue' check (payment_type in ('online', 'venue')),
  status text not null default 'open' check (status in ('open', 'full', 'in_progress', 'completed', 'cancelled')),
  banner_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- TEAMS (per game)
-- ============================================================
create table public.teams (
  id uuid default uuid_generate_v4() primary key,
  game_id uuid references public.games(id) on delete cascade not null,
  name text not null, -- e.g. 'Red', 'Blue', 'Yellow'
  color text not null, -- hex color
  slot_number integer not null, -- 1, 2, 3, 4...
  created_at timestamptz default now()
);

-- ============================================================
-- GAME PLAYERS (roster)
-- ============================================================
create table public.game_players (
  id uuid default uuid_generate_v4() primary key,
  game_id uuid references public.games(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  team_id uuid references public.teams(id) on delete set null,
  payment_status text not null default 'pending' check (payment_status in ('pending', 'paid', 'venue', 'refunded')),
  paymongo_payment_id text,
  joined_at timestamptz default now(),
  unique(game_id, user_id)
);

-- ============================================================
-- ANNOUNCEMENTS (organizer broadcasts)
-- ============================================================
create table public.announcements (
  id uuid default uuid_generate_v4() primary key,
  game_id uuid references public.games(id) on delete cascade not null,
  organizer_id uuid references public.profiles(id) on delete cascade not null,
  body text not null,
  created_at timestamptz default now()
);

-- ============================================================
-- FOLLOWS
-- ============================================================
create table public.follows (
  follower_id uuid references public.profiles(id) on delete cascade,
  following_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (follower_id, following_id),
  check (follower_id != following_id)
);

-- ============================================================
-- MESSAGES (in-app chat per game)
-- ============================================================
create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  game_id uuid references public.games(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  body text not null,
  created_at timestamptz default now()
);

-- ============================================================
-- TIMER SESSIONS (round-robin match timer)
-- ============================================================
create table public.timer_sessions (
  id uuid default uuid_generate_v4() primary key,
  game_id uuid references public.games(id) on delete cascade not null unique,
  current_round integer not null default 1,
  current_team_a_id uuid references public.teams(id),
  current_team_b_id uuid references public.teams(id),
  round_start_time timestamptz,
  status text not null default 'waiting' check (status in ('waiting', 'running', 'paused', 'finished')),
  rotation_schedule jsonb, -- array of {round, team_a_id, team_b_id}
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- RLS POLICIES
-- ============================================================

alter table public.profiles enable row level security;
alter table public.games enable row level security;
alter table public.teams enable row level security;
alter table public.game_players enable row level security;
alter table public.announcements enable row level security;
alter table public.follows enable row level security;
alter table public.messages enable row level security;
alter table public.timer_sessions enable row level security;

-- profiles: anyone can read, only owner can update
create policy "Public profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can insert their own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update their own profile" on public.profiles for update using (auth.uid() = id);

-- games: anyone can read open games, organizer can manage their own
create policy "Games are publicly viewable" on public.games for select using (true);
create policy "Organizers can create games" on public.games for insert with check (auth.uid() = organizer_id);
create policy "Organizers can update their games" on public.games for update using (auth.uid() = organizer_id);
create policy "Organizers can delete their games" on public.games for delete using (auth.uid() = organizer_id);

-- teams: readable by all, managed by game organizer
create policy "Teams are publicly viewable" on public.teams for select using (true);
create policy "Organizers can manage teams" on public.teams for insert with check (
  auth.uid() = (select organizer_id from public.games where id = game_id)
);
create policy "Organizers can update teams" on public.teams for update using (
  auth.uid() = (select organizer_id from public.games where id = game_id)
);

-- game_players: readable by all, players manage their own
create policy "Game players are publicly viewable" on public.game_players for select using (true);
create policy "Authenticated users can join games" on public.game_players for insert with check (auth.uid() = user_id);
create policy "Players can update their own entry" on public.game_players for update using (auth.uid() = user_id);
create policy "Organizers can manage all players in their game" on public.game_players for update using (
  auth.uid() = (select organizer_id from public.games where id = game_id)
);

-- announcements: readable by game players, created by organizer
create policy "Announcements viewable by game participants" on public.announcements for select using (true);
create policy "Organizers can create announcements" on public.announcements for insert with check (
  auth.uid() = organizer_id
);

-- follows: readable by all, managed by follower
create policy "Follows are publicly viewable" on public.follows for select using (true);
create policy "Users can follow others" on public.follows for insert with check (auth.uid() = follower_id);
create policy "Users can unfollow" on public.follows for delete using (auth.uid() = follower_id);

-- messages: only game participants can read and write
create policy "Game messages visible to participants" on public.messages for select using (
  auth.uid() in (select user_id from public.game_players where game_id = messages.game_id)
  or auth.uid() = (select organizer_id from public.games where id = messages.game_id)
);
create policy "Participants can send messages" on public.messages for insert with check (
  auth.uid() in (select user_id from public.game_players where game_id = messages.game_id)
  or auth.uid() = (select organizer_id from public.games where id = messages.game_id)
);

-- timer_sessions: readable by all game participants
create policy "Timer sessions viewable by participants" on public.timer_sessions for select using (true);
create policy "Organizers can manage timer" on public.timer_sessions for all using (
  auth.uid() = (select organizer_id from public.games where id = game_id)
);

-- ============================================================
-- TRIGGER: auto-create profile on signup
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- TRIGGER: updated_at
-- ============================================================
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_profiles_updated_at before update on public.profiles
  for each row execute procedure public.set_updated_at();
create trigger set_games_updated_at before update on public.games
  for each row execute procedure public.set_updated_at();
create trigger set_timer_updated_at before update on public.timer_sessions
  for each row execute procedure public.set_updated_at();
