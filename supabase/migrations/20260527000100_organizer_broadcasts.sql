-- Organizer-level broadcast room messages
create table if not exists public.organizer_broadcasts (
  id uuid default uuid_generate_v4() primary key,
  organizer_id uuid references public.profiles(id) on delete cascade,
  organizer_key text not null,
  category text not null default 'general' check (category in ('general', 'game_on', 'cancelled', 'rules', 'tournament_notice')),
  body text not null,
  created_at timestamptz default now()
);

alter table public.organizer_broadcasts enable row level security;

drop policy if exists "Organizer broadcasts are publicly viewable" on public.organizer_broadcasts;
create policy "Organizer broadcasts are publicly viewable"
  on public.organizer_broadcasts for select
  using (true);

drop policy if exists "Organizers can post their broadcasts" on public.organizer_broadcasts;
create policy "Organizers can post their broadcasts"
  on public.organizer_broadcasts for insert
  with check (auth.uid() = organizer_id);

drop policy if exists "Organizers can edit their broadcasts" on public.organizer_broadcasts;
create policy "Organizers can edit their broadcasts"
  on public.organizer_broadcasts for update
  using (auth.uid() = organizer_id);

drop policy if exists "Organizers can delete their broadcasts" on public.organizer_broadcasts;
create policy "Organizers can delete their broadcasts"
  on public.organizer_broadcasts for delete
  using (auth.uid() = organizer_id);
