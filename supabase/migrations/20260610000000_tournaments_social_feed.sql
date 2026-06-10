-- Tournament module + Social feed (posts, likes, comments)

-- ── Tournaments ──────────────────────────────────────────────────────────────

create table if not exists public.tournaments (
  id uuid default uuid_generate_v4() primary key,
  organizer_id uuid references public.profiles(id) on delete cascade not null,
  name text not null check (char_length(name) between 3 and 120),
  description text,
  format text not null default 'single_elimination'
    check (format in ('single_elimination', 'round_robin')),
  status text not null default 'registration'
    check (status in ('registration', 'active', 'completed', 'cancelled')),
  venue_name text,
  venue_address text,
  starts_at timestamptz not null,
  max_teams integer not null default 8 check (max_teams between 2 and 64),
  team_size integer not null default 5 check (team_size between 1 and 11),
  entry_fee integer not null default 0 check (entry_fee >= 0), -- centavos per team
  banner_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists tournaments_status_starts_idx
  on public.tournaments (status, starts_at);

create index if not exists tournaments_organizer_idx
  on public.tournaments (organizer_id, created_at desc);

drop trigger if exists set_tournaments_updated_at on public.tournaments;
create trigger set_tournaments_updated_at before update on public.tournaments
  for each row execute procedure public.set_updated_at();

create table if not exists public.tournament_teams (
  id uuid default uuid_generate_v4() primary key,
  tournament_id uuid references public.tournaments(id) on delete cascade not null,
  captain_id uuid references public.profiles(id) on delete cascade not null,
  name text not null check (char_length(name) between 2 and 60),
  status text not null default 'registered'
    check (status in ('registered', 'withdrawn')),
  seed integer,
  created_at timestamptz default now(),
  unique (tournament_id, captain_id),
  unique (tournament_id, name)
);

create index if not exists tournament_teams_tournament_idx
  on public.tournament_teams (tournament_id, created_at);

create table if not exists public.tournament_matches (
  id uuid default uuid_generate_v4() primary key,
  tournament_id uuid references public.tournaments(id) on delete cascade not null,
  round integer not null check (round >= 1),
  position integer not null check (position >= 0),
  home_team_id uuid references public.tournament_teams(id) on delete set null,
  away_team_id uuid references public.tournament_teams(id) on delete set null,
  home_score integer check (home_score >= 0),
  away_score integer check (away_score >= 0),
  status text not null default 'scheduled'
    check (status in ('scheduled', 'completed', 'bye')),
  scheduled_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (tournament_id, round, position)
);

create index if not exists tournament_matches_tournament_idx
  on public.tournament_matches (tournament_id, round, position);

drop trigger if exists set_tournament_matches_updated_at on public.tournament_matches;
create trigger set_tournament_matches_updated_at before update on public.tournament_matches
  for each row execute procedure public.set_updated_at();

alter table public.tournaments enable row level security;
alter table public.tournament_teams enable row level security;
alter table public.tournament_matches enable row level security;

create policy "Tournaments are publicly viewable"
  on public.tournaments for select using (true);

create policy "Organizers create tournaments"
  on public.tournaments for insert with check (
    auth.uid() = organizer_id
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'organizer')
  );

create policy "Organizers update their tournaments"
  on public.tournaments for update
  using (auth.uid() = organizer_id)
  with check (auth.uid() = organizer_id);

create policy "Tournament teams are publicly viewable"
  on public.tournament_teams for select using (true);

create policy "Captains register teams while registration is open"
  on public.tournament_teams for insert with check (
    auth.uid() = captain_id
    and exists (
      select 1 from public.tournaments t
      where t.id = tournament_id and t.status = 'registration'
    )
  );

create policy "Captains update their teams"
  on public.tournament_teams for update
  using (auth.uid() = captain_id)
  with check (auth.uid() = captain_id);

create policy "Tournament matches are publicly viewable"
  on public.tournament_matches for select using (true);

create policy "Organizers manage their tournament matches"
  on public.tournament_matches for all
  using (auth.uid() = (select organizer_id from public.tournaments where id = tournament_id))
  with check (auth.uid() = (select organizer_id from public.tournaments where id = tournament_id));

-- ── Social feed ──────────────────────────────────────────────────────────────

create table if not exists public.posts (
  id uuid default uuid_generate_v4() primary key,
  author_id uuid references public.profiles(id) on delete cascade not null,
  game_id uuid references public.games(id) on delete set null,
  tournament_id uuid references public.tournaments(id) on delete set null,
  kind text not null default 'post'
    check (kind in ('post', 'highlight', 'match_result')),
  body text not null check (char_length(body) between 1 and 2000),
  media_url text,
  created_at timestamptz default now()
);

create index if not exists posts_created_idx
  on public.posts (created_at desc);

create index if not exists posts_author_idx
  on public.posts (author_id, created_at desc);

create table if not exists public.post_likes (
  post_id uuid references public.posts(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  primary key (post_id, user_id)
);

create table if not exists public.post_comments (
  id uuid default uuid_generate_v4() primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  author_id uuid references public.profiles(id) on delete cascade not null,
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz default now()
);

create index if not exists post_comments_post_idx
  on public.post_comments (post_id, created_at);

alter table public.posts enable row level security;
alter table public.post_likes enable row level security;
alter table public.post_comments enable row level security;

create policy "Posts are publicly viewable"
  on public.posts for select using (true);

create policy "Users create their own posts"
  on public.posts for insert with check (auth.uid() = author_id);

create policy "Users delete their own posts"
  on public.posts for delete using (auth.uid() = author_id);

create policy "Post likes are publicly viewable"
  on public.post_likes for select using (true);

create policy "Users like posts as themselves"
  on public.post_likes for insert with check (auth.uid() = user_id);

create policy "Users remove their own likes"
  on public.post_likes for delete using (auth.uid() = user_id);

create policy "Post comments are publicly viewable"
  on public.post_comments for select using (true);

create policy "Users comment as themselves"
  on public.post_comments for insert with check (auth.uid() = author_id);

create policy "Users delete their own comments"
  on public.post_comments for delete using (auth.uid() = author_id);
