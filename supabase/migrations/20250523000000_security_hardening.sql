-- Security hardening migration (apply via Supabase SQL editor or CLI)

-- Webhook idempotency
create table if not exists public.webhook_events (
  id text primary key,
  event_type text not null,
  processed_at timestamptz not null default now()
);

alter table public.webhook_events enable row level security;

-- No policies: only service role can access

-- Payment status: only system (service role, auth.uid() null) may set paid
create or replace function public.enforce_game_player_payment_rules()
returns trigger as $$
begin
  if new.payment_status = 'paid' then
    if auth.uid() is not null then
      raise exception 'payment_status paid can only be set by the payment webhook';
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists enforce_game_player_payment on public.game_players;
create trigger enforce_game_player_payment
  before insert or update on public.game_players
  for each row execute procedure public.enforce_game_player_payment_rules();

-- Profiles: prevent client-side role escalation
create or replace function public.protect_profile_role()
returns trigger as $$
begin
  if auth.uid() is not null and old.role is distinct from new.role then
    -- Allow one-time role selection during onboarding (before profile is completed)
    if (old.full_name is null or trim(old.full_name) = '')
       and new.role in ('player', 'organizer') then
      return new;
    end if;
    new.role := old.role;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists protect_profile_role on public.profiles;
create trigger protect_profile_role
  before update on public.profiles
  for each row execute procedure public.protect_profile_role();

-- Drop overly permissive game_players update policy; replace with team-only player updates
drop policy if exists "Players can update their own entry" on public.game_players;

create policy "Players can update their own team" on public.game_players
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Games: require organizer role on insert
drop policy if exists "Organizers can create games" on public.games;
create policy "Organizers can create games" on public.games
  for insert
  with check (
    auth.uid() = organizer_id
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'organizer'
    )
  );

-- Announcements: scope reads to participants
drop policy if exists "Announcements viewable by game participants" on public.announcements;
create policy "Announcements viewable by game participants" on public.announcements
  for select
  using (
    auth.uid() in (select user_id from public.game_players where game_id = announcements.game_id)
    or auth.uid() = (select organizer_id from public.games where id = announcements.game_id)
  );

-- Timer sessions: scope reads to participants
drop policy if exists "Timer sessions viewable by participants" on public.timer_sessions;
create policy "Timer sessions viewable by participants" on public.timer_sessions
  for select
  using (
    auth.uid() in (select user_id from public.game_players where game_id = timer_sessions.game_id)
    or auth.uid() = (select organizer_id from public.games where id = timer_sessions.game_id)
  );

-- Storage: avatars bucket policies
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "Avatar images are publicly accessible" on storage.objects;
create policy "Avatar images are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "Users can upload their own avatar" on storage.objects;
create policy "Users can upload their own avatar"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users can update their own avatar" on storage.objects;
create policy "Users can update their own avatar"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users can delete their own avatar" on storage.objects;
create policy "Users can delete their own avatar"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Legacy flat paths: avatars/{userId}.ext
drop policy if exists "Users can upload legacy avatar path" on storage.objects;
create policy "Users can upload legacy avatar path"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and name like 'avatars/' || auth.uid()::text || '.%'
  );

drop policy if exists "Users can update legacy avatar path" on storage.objects;
create policy "Users can update legacy avatar path"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and name like 'avatars/' || auth.uid()::text || '.%'
  );
