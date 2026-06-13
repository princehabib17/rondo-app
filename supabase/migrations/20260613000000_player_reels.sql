-- Player reels: storage bucket, table, likes, scout shortlists

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
