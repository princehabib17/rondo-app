-- DEPRECATED — use supabase/RUN_ALL_IN_SUPABASE.sql instead (one file, everything).
-- This file is kept for reference only; content is a subset of RUN_ALL.

-- ── 1. Match type + skill level ─────────────────────────────────────────────

alter table public.games
  add column if not exists match_type text
    check (match_type in ('football', 'futsal'));

alter table public.games
  add column if not exists skill_level text
    check (skill_level in ('beginner', 'intermediate', 'advanced', 'pro'));

update public.games
set match_type = case
  when format ~* '(^|[^0-9])(5v5|4v4|3v3|futsal)' then 'futsal'
  else 'football'
end
where match_type is null;

create index if not exists games_match_type_idx on public.games (match_type);
create index if not exists games_skill_level_idx on public.games (skill_level);
create index if not exists games_is_private_idx on public.games (is_private);

-- ── 2. Match rules, waitlist, profile fields, announcements ─────────────────

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

drop policy if exists "Waitlist viewable for game viewers" on public.game_waitlist;
create policy "Waitlist viewable for game viewers"
  on public.game_waitlist for select using (true);

drop policy if exists "Users can join waitlist" on public.game_waitlist;
create policy "Users can join waitlist"
  on public.game_waitlist for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own waitlist row" on public.game_waitlist;
create policy "Users can update own waitlist row"
  on public.game_waitlist for update using (auth.uid() = user_id);

drop policy if exists "Users can leave waitlist" on public.game_waitlist;
create policy "Users can leave waitlist"
  on public.game_waitlist for delete using (auth.uid() = user_id);

drop policy if exists "Organizers manage waitlist for their games" on public.game_waitlist;
create policy "Organizers manage waitlist for their games"
  on public.game_waitlist for all using (
    auth.uid() = (select organizer_id from public.games where id = game_id)
  );

drop policy if exists "Announcements viewable by game participants" on public.announcements;
drop policy if exists "Announcements publicly viewable" on public.announcements;
create policy "Announcements publicly viewable"
  on public.announcements for select using (true);

-- ── 3. Personal 1:1 messages ────────────────────────────────────────────────

create table if not exists public.direct_messages (
  id uuid default uuid_generate_v4() primary key,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  recipient_id uuid references public.profiles(id) on delete cascade not null,
  body text not null,
  read_at timestamptz,
  created_at timestamptz default now(),
  check (sender_id <> recipient_id)
);

create index if not exists direct_messages_pair_idx
  on public.direct_messages (sender_id, recipient_id, created_at desc);

create index if not exists direct_messages_recipient_idx
  on public.direct_messages (recipient_id, created_at desc);

alter table public.direct_messages enable row level security;

drop policy if exists "Users read their direct messages" on public.direct_messages;
create policy "Users read their direct messages"
  on public.direct_messages for select
  using (auth.uid() = sender_id or auth.uid() = recipient_id);

drop policy if exists "Users send direct messages" on public.direct_messages;
create policy "Users send direct messages"
  on public.direct_messages for insert
  with check (auth.uid() = sender_id);

drop policy if exists "Recipients mark messages read" on public.direct_messages;
create policy "Recipients mark messages read"
  on public.direct_messages for update
  using (auth.uid() = recipient_id)
  with check (auth.uid() = recipient_id);
