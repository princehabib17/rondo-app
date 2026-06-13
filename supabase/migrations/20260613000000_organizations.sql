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
