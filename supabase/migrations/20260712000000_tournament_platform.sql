-- Tournament platform: team numbers, rosters, goal scorers, honors
--
-- Adds the pieces that turn tournaments from organizer admin into a shared
-- record: every team gets a number players can be assigned against, players
-- join team rosters themselves, results carry who scored (tagging registered
-- players when possible), and finishing a tournament snapshots honors
-- (champion / runner-up / top scorer) onto the winners' profiles.

-- ── Team numbers ─────────────────────────────────────────────────────────────

alter table public.tournament_teams
  add column if not exists team_number integer check (team_number >= 1);

-- Organizers can enter teams on captains' behalf (walk-up registration), so
-- one profile may captain several managed teams. The one-team-per-captain rule
-- for self-registration moves into the register API.
alter table public.tournament_teams
  add column if not exists is_managed boolean not null default false;

alter table public.tournament_teams
  drop constraint if exists tournament_teams_tournament_id_captain_id_key;

-- Backfill existing teams in registration order per tournament.
with numbered as (
  select id,
         row_number() over (partition by tournament_id order by created_at, id) as rn
  from public.tournament_teams
  where team_number is null
)
update public.tournament_teams t
set team_number = numbered.rn
from numbered
where t.id = numbered.id;

create unique index if not exists tournament_teams_number_key
  on public.tournament_teams (tournament_id, team_number);

-- ── Rosters: players add themselves to teams ─────────────────────────────────

create table if not exists public.tournament_team_members (
  id uuid default uuid_generate_v4() primary key,
  tournament_id uuid references public.tournaments(id) on delete cascade not null,
  team_id uuid references public.tournament_teams(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text not null default 'player' check (role in ('captain', 'player')),
  created_at timestamptz default now(),
  -- One team per player per tournament.
  unique (tournament_id, user_id)
);

create index if not exists tournament_team_members_team_idx
  on public.tournament_team_members (team_id, created_at);

create index if not exists tournament_team_members_user_idx
  on public.tournament_team_members (user_id, created_at desc);

alter table public.tournament_team_members enable row level security;

create policy "Rosters are publicly viewable"
  on public.tournament_team_members for select using (true);

-- Players join a roster themselves while the tournament hasn't finished.
create policy "Players join rosters as themselves"
  on public.tournament_team_members for insert with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.tournaments t
      join public.tournament_teams tt on tt.tournament_id = t.id
      where tt.id = team_id
        and tt.status = 'registered'
        and t.id = tournament_id
        and t.status in ('registration', 'active')
    )
  );

-- Players can leave; captains can trim their own roster.
create policy "Players leave or captains remove"
  on public.tournament_team_members for delete using (
    auth.uid() = user_id
    or auth.uid() = (select captain_id from public.tournament_teams where id = team_id)
  );

-- ── Goals: who scored, per match ─────────────────────────────────────────────

create table if not exists public.tournament_goals (
  id uuid default uuid_generate_v4() primary key,
  tournament_id uuid references public.tournaments(id) on delete cascade not null,
  match_id uuid references public.tournament_matches(id) on delete cascade not null,
  team_id uuid references public.tournament_teams(id) on delete cascade not null,
  scorer_id uuid references public.profiles(id) on delete set null,
  scorer_name text check (scorer_name is null or char_length(scorer_name) between 1 and 80),
  goals integer not null default 1 check (goals between 1 and 99),
  created_at timestamptz default now(),
  -- Every goal is attributed somehow: a tagged profile or a written name.
  check (scorer_id is not null or scorer_name is not null)
);

create index if not exists tournament_goals_tournament_idx
  on public.tournament_goals (tournament_id, created_at);

create index if not exists tournament_goals_match_idx
  on public.tournament_goals (match_id);

create index if not exists tournament_goals_scorer_idx
  on public.tournament_goals (scorer_id) where scorer_id is not null;

alter table public.tournament_goals enable row level security;

create policy "Goals are publicly viewable"
  on public.tournament_goals for select using (true);

create policy "Organizers record goals"
  on public.tournament_goals for all
  using (auth.uid() = (select organizer_id from public.tournaments where id = tournament_id))
  with check (auth.uid() = (select organizer_id from public.tournaments where id = tournament_id));

-- ── Honors: trophies that live on profiles ───────────────────────────────────

create table if not exists public.tournament_awards (
  id uuid default uuid_generate_v4() primary key,
  tournament_id uuid references public.tournaments(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  team_id uuid references public.tournament_teams(id) on delete set null,
  kind text not null check (kind in ('champion', 'runner_up', 'top_scorer')),
  -- Snapshots: the honor must survive later renames/deletes.
  tournament_name text not null,
  team_name text,
  detail text,
  created_at timestamptz default now(),
  unique (tournament_id, user_id, kind)
);

create index if not exists tournament_awards_user_idx
  on public.tournament_awards (user_id, created_at desc);

create index if not exists tournament_awards_tournament_idx
  on public.tournament_awards (tournament_id);

alter table public.tournament_awards enable row level security;

create policy "Awards are publicly viewable"
  on public.tournament_awards for select using (true);

-- Awards are granted by the platform (service role) when a tournament
-- completes; no user-facing write policies.

-- ── Realtime: rosters and goals update live for everyone watching ────────────

do $$
begin
  alter publication supabase_realtime add table public.tournament_team_members;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.tournament_goals;
exception when duplicate_object then null;
end $$;
