-- Enable UUID extension
create extension if not exists "uuid-ossp";

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
  price_per_player integer not null default 0,
  max_players integer not null default 10,
  num_teams integer not null default 2,
  format text not null default '5v5',
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
  name text not null,
  color text not null,
  slot_number integer not null,
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
-- ANNOUNCEMENTS
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
-- MESSAGES
-- ============================================================
create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  game_id uuid references public.games(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  body text not null,
  created_at timestamptz default now()
);

-- ============================================================
-- TIMER SESSIONS
-- ============================================================
create table public.timer_sessions (
  id uuid default uuid_generate_v4() primary key,
  game_id uuid references public.games(id) on delete cascade not null unique,
  current_round integer not null default 1,
  current_team_a_id uuid references public.teams(id),
  current_team_b_id uuid references public.teams(id),
  round_start_time timestamptz,
  status text not null default 'waiting' check (status in ('waiting', 'running', 'paused', 'finished')),
  rotation_schedule jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- WEBHOOK IDEMPOTENCY
-- ============================================================
create table public.webhook_events (
  id text primary key,
  event_type text not null,
  processed_at timestamptz not null default now()
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
alter table public.webhook_events enable row level security;

create policy "Public profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can insert their own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update their own profile" on public.profiles for update using (auth.uid() = id);

create policy "Games are publicly viewable" on public.games for select using (true);
create policy "Organizers can create games" on public.games for insert with check (
  auth.uid() = organizer_id
  and exists (select 1 from public.profiles where id = auth.uid() and role = 'organizer')
);
create policy "Organizers can update their games" on public.games for update using (auth.uid() = organizer_id);
create policy "Organizers can delete their games" on public.games for delete using (auth.uid() = organizer_id);

create policy "Teams are publicly viewable" on public.teams for select using (true);
create policy "Organizers can manage teams" on public.teams for insert with check (
  auth.uid() = (select organizer_id from public.games where id = game_id)
);
create policy "Organizers can update teams" on public.teams for update using (
  auth.uid() = (select organizer_id from public.games where id = game_id)
);

create policy "Game players are publicly viewable" on public.game_players for select using (true);
create policy "Authenticated users can join games" on public.game_players for insert with check (auth.uid() = user_id);
create policy "Players can update their own team" on public.game_players for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Organizers can manage all players in their game" on public.game_players for update using (
  auth.uid() = (select organizer_id from public.games where id = game_id)
);

create policy "Announcements viewable by game participants" on public.announcements for select using (
  auth.uid() in (select user_id from public.game_players where game_id = announcements.game_id)
  or auth.uid() = (select organizer_id from public.games where id = announcements.game_id)
);
create policy "Organizers can create announcements" on public.announcements for insert with check (auth.uid() = organizer_id);

create policy "Follows are publicly viewable" on public.follows for select using (true);
create policy "Users can follow others" on public.follows for insert with check (auth.uid() = follower_id);
create policy "Users can unfollow" on public.follows for delete using (auth.uid() = follower_id);

create policy "Game messages visible to participants" on public.messages for select using (
  auth.uid() in (select user_id from public.game_players where game_id = messages.game_id)
  or auth.uid() = (select organizer_id from public.games where id = messages.game_id)
);
create policy "Participants can send messages" on public.messages for insert with check (
  auth.uid() in (select user_id from public.game_players where game_id = messages.game_id)
  or auth.uid() = (select organizer_id from public.games where id = messages.game_id)
);

create policy "Timer sessions viewable by participants" on public.timer_sessions for select using (
  auth.uid() in (select user_id from public.game_players where game_id = timer_sessions.game_id)
  or auth.uid() = (select organizer_id from public.games where id = timer_sessions.game_id)
);
create policy "Organizers can manage timer" on public.timer_sessions for all using (
  auth.uid() = (select organizer_id from public.games where id = game_id)
);

-- ============================================================
-- TRIGGERS
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
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

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

create or replace function public.enforce_game_player_payment_rules()
returns trigger as $$
begin
  if new.payment_status = 'paid' and auth.uid() is not null then
    raise exception 'payment_status paid can only be set by the payment webhook';
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger enforce_game_player_payment
  before insert or update on public.game_players
  for each row execute procedure public.enforce_game_player_payment_rules();

create or replace function public.protect_profile_role()
returns trigger as $$
begin
  if auth.uid() is not null and old.role is distinct from new.role then
    if (old.full_name is null or trim(old.full_name) = '')
       and new.role in ('player', 'organizer') then
      return new;
    end if;
    new.role := old.role;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger protect_profile_role
  before update on public.profiles
  for each row execute procedure public.protect_profile_role();

-- Storage: avatars bucket (run after enabling storage in Supabase dashboard)
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "Avatar images are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Users can upload their own avatar"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can update their own avatar"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete their own avatar"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can upload legacy avatar path"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and name like 'avatars/' || auth.uid()::text || '.%'
  );

create policy "Users can update legacy avatar path"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and name like 'avatars/' || auth.uid()::text || '.%'
  );
