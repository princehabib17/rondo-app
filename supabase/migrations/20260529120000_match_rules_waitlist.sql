-- Match rules, waitlist, profile location/verified, public organizer announcements

alter table public.games
  add column if not exists allow_pay_later boolean not null default false;

alter table public.profiles
  add column if not exists organizer_verified boolean not null default false;

alter table public.profiles
  add column if not exists location_hidden boolean not null default false;

alter table public.profiles
  add column if not exists last_lat double precision;

alter table public.profiles
  add column if not exists last_lng double precision;

-- Flat waitlist: notify all when a spot opens; first to claim wins
create table if not exists public.game_waitlist (
  id uuid default uuid_generate_v4() primary key,
  game_id uuid references public.games(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  team_id uuid references public.teams(id) on delete set null,
  status text not null default 'waiting' check (status in ('waiting', 'refused')),
  created_at timestamptz default now(),
  unique(game_id, user_id)
);

create index if not exists game_waitlist_game_id_idx on public.game_waitlist (game_id);

alter table public.game_waitlist enable row level security;

create policy "Waitlist viewable for game viewers"
  on public.game_waitlist for select using (true);

create policy "Users can join waitlist"
  on public.game_waitlist for insert with check (auth.uid() = user_id);

create policy "Users can update own waitlist row"
  on public.game_waitlist for update using (auth.uid() = user_id);

create policy "Users can leave waitlist"
  on public.game_waitlist for delete using (auth.uid() = user_id);

create policy "Organizers manage waitlist for their games"
  on public.game_waitlist for all using (
    auth.uid() = (select organizer_id from public.games where id = game_id)
  );

-- Organizer room (announcements) readable by anyone viewing open matches
drop policy if exists "Announcements viewable by game participants" on public.announcements;

create policy "Announcements publicly viewable"
  on public.announcements for select using (true);
