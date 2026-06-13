-- =============================================================================
-- RONDO — REELS + SCOUT + ORGANIZATIONS  (ONE FILE FOR SUPABASE SQL EDITOR)
-- =============================================================================
-- Paste this ENTIRE file → Supabase Dashboard → SQL Editor → New Query → Run.
-- Safe to re-run (uses IF NOT EXISTS / DROP IF EXISTS / ON CONFLICT throughout).
--
-- Covers the two newest migrations that are NOT in RUN_ALL_IN_SUPABASE.sql:
--   1. 20260613000000_organizations.sql  (phone column + organizations)
--   2. 20260613000000_player_reels.sql   (reels, likes, scout shortlists)
-- =============================================================================

-- ── Prerequisites (no-ops if already present) ───────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- =============================================================================
-- 1. ORGANIZATIONS + PHONE AUTH
-- =============================================================================

alter table public.profiles
  add column if not exists phone text;

create unique index if not exists profiles_phone_unique
  on public.profiles(phone)
  where phone is not null;

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, phone, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.phone,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do update set
    email = excluded.email,
    phone = coalesce(public.profiles.phone, excluded.phone),
    full_name = coalesce(public.profiles.full_name, excluded.full_name),
    avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url);
  return new;
end;
$$ language plpgsql security definer;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) >= 2),
  slug text not null unique,
  logo_url text,
  verified boolean not null default false,
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'manager' check (role in ('owner', 'admin', 'manager')),
  status text not null default 'requested' check (status in ('active', 'requested', 'invited', 'rejected')),
  requested_at timestamptz not null default now(),
  approved_at timestamptz,
  primary key (organization_id, user_id)
);

alter table public.games
  add column if not exists organization_id uuid references public.organizations(id) on delete set null;

alter table public.tournaments
  add column if not exists organization_id uuid references public.organizations(id) on delete set null;

create index if not exists games_organization_id_idx on public.games(organization_id);
create index if not exists tournaments_organization_id_idx on public.tournaments(organization_id);
create index if not exists organization_members_user_status_idx on public.organization_members(user_id, status);

create or replace function public.slugify_organization_name(input text)
returns text
language sql
immutable
as $$
  select trim(both '-' from regexp_replace(lower(coalesce(input, '')), '[^a-z0-9]+', '-', 'g'));
$$;

create or replace function public.can_manage_organization(org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members om
    where om.organization_id = org_id
      and om.user_id = auth.uid()
      and om.status = 'active'
      and om.role in ('owner', 'admin', 'manager')
  );
$$;

create or replace function public.set_organization_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.organization_members (organization_id, user_id, role, status, approved_at)
  values (new.id, new.created_by, 'owner', 'active', now())
  on conflict (organization_id, user_id)
  do update set role = 'owner', status = 'active', approved_at = now();
  return new;
end;
$$;

drop trigger if exists set_organization_owner on public.organizations;
create trigger set_organization_owner
  after insert on public.organizations
  for each row execute procedure public.set_organization_owner();

drop trigger if exists set_organizations_updated_at on public.organizations;
create trigger set_organizations_updated_at
  before update on public.organizations
  for each row execute procedure public.set_updated_at();

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;

drop policy if exists "Organizations are publicly viewable" on public.organizations;
create policy "Organizations are publicly viewable"
  on public.organizations for select using (true);

drop policy if exists "Users create organizations" on public.organizations;
create policy "Users create organizations"
  on public.organizations for insert
  with check (auth.uid() = created_by);

drop policy if exists "Organization managers update organizations" on public.organizations;
create policy "Organization managers update organizations"
  on public.organizations for update
  using (public.can_manage_organization(id))
  with check (public.can_manage_organization(id));

drop policy if exists "Users can see organization memberships" on public.organization_members;
create policy "Users can see organization memberships"
  on public.organization_members for select
  using (
    user_id = auth.uid()
    or public.can_manage_organization(organization_id)
    or status = 'active'
  );

drop policy if exists "Users can request organization access" on public.organization_members;
create policy "Users can request organization access"
  on public.organization_members for insert
  with check (user_id = auth.uid() and status = 'requested');

drop policy if exists "Organization managers approve members" on public.organization_members;
create policy "Organization managers approve members"
  on public.organization_members for update
  using (public.can_manage_organization(organization_id))
  with check (public.can_manage_organization(organization_id));

drop policy if exists "Organizers can create games" on public.games;
create policy "Organizers can create games" on public.games
  for insert with check (
    auth.uid() = organizer_id
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'organizer')
    and (organization_id is null or public.can_manage_organization(organization_id))
  );

drop policy if exists "Organizers can update their games" on public.games;
create policy "Organizers can update their games" on public.games
  for update using (
    auth.uid() = organizer_id
    or (organization_id is not null and public.can_manage_organization(organization_id))
  );

drop policy if exists "Organizers create tournaments" on public.tournaments;
create policy "Organizers create tournaments"
  on public.tournaments for insert
  with check (
    organizer_id = auth.uid()
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'organizer')
    and (organization_id is null or public.can_manage_organization(organization_id))
  );

drop policy if exists "Organizers update their tournaments" on public.tournaments;
create policy "Organizers update their tournaments"
  on public.tournaments for update
  using (
    organizer_id = auth.uid()
    or (organization_id is not null and public.can_manage_organization(organization_id))
  );

-- =============================================================================
-- 2. PLAYER REELS + LIKES + SCOUT SHORTLISTS
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'player-reels', 'player-reels', true, 52428800,
  '{video/mp4,video/webm,video/quicktime}'
)
on conflict (id) do nothing;

drop policy if exists "Reels publicly readable" on storage.objects;
create policy "Reels publicly readable"
  on storage.objects for select
  using (bucket_id = 'player-reels');

drop policy if exists "Players upload reels" on storage.objects;
create policy "Players upload reels"
  on storage.objects for insert
  with check (
    bucket_id = 'player-reels'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Players delete their reels storage" on storage.objects;
create policy "Players delete their reels storage"
  on storage.objects for delete
  using (
    bucket_id = 'player-reels'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create table if not exists public.player_reels (
  id          uuid default uuid_generate_v4() primary key,
  player_id   uuid references public.profiles(id) on delete cascade not null,
  video_url   text not null,
  caption     text check (char_length(caption) <= 300),
  position    text,
  skill_level text,
  created_at  timestamptz default now()
);

create index if not exists player_reels_player_idx  on public.player_reels (player_id, created_at desc);
create index if not exists player_reels_created_idx on public.player_reels (created_at desc);

alter table public.player_reels enable row level security;

drop policy if exists "Reels publicly viewable" on public.player_reels;
create policy "Reels publicly viewable"
  on public.player_reels for select using (true);

drop policy if exists "Players insert reels" on public.player_reels;
create policy "Players insert reels"
  on public.player_reels for insert
  with check (auth.uid() = player_id);

drop policy if exists "Players delete their reels" on public.player_reels;
create policy "Players delete their reels"
  on public.player_reels for delete
  using (auth.uid() = player_id);

create table if not exists public.reel_likes (
  reel_id    uuid references public.player_reels(id) on delete cascade not null,
  user_id    uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  primary key (reel_id, user_id)
);

alter table public.reel_likes enable row level security;

drop policy if exists "Reel likes publicly viewable" on public.reel_likes;
create policy "Reel likes publicly viewable"
  on public.reel_likes for select using (true);

drop policy if exists "Users like reels" on public.reel_likes;
create policy "Users like reels"
  on public.reel_likes for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users unlike reels" on public.reel_likes;
create policy "Users unlike reels"
  on public.reel_likes for delete
  using (auth.uid() = user_id);

create table if not exists public.scout_shortlists (
  id         uuid default uuid_generate_v4() primary key,
  scout_id   uuid not null,
  player_id  uuid references public.profiles(id) on delete cascade not null,
  note       text check (char_length(note) <= 500),
  created_at timestamptz default now(),
  unique (scout_id, player_id)
);

alter table public.scout_shortlists enable row level security;

drop policy if exists "Scouts view their shortlist" on public.scout_shortlists;
create policy "Scouts view their shortlist"
  on public.scout_shortlists for select
  using (auth.uid() = scout_id);

drop policy if exists "Scouts add to shortlist" on public.scout_shortlists;
create policy "Scouts add to shortlist"
  on public.scout_shortlists for insert
  with check (auth.uid() = scout_id);

drop policy if exists "Scouts remove from shortlist" on public.scout_shortlists;
create policy "Scouts remove from shortlist"
  on public.scout_shortlists for delete
  using (auth.uid() = scout_id);

-- =============================================================================
-- DONE. Reels, scout shortlists, and organizations are ready.
-- =============================================================================
