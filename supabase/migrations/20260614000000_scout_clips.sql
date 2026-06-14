-- Player scout video feed

create table if not exists public.scout_clips (
  id uuid default uuid_generate_v4() primary key,
  player_id uuid references public.profiles(id) on delete cascade not null,
  video_url text not null check (video_url ~ '^https://'),
  thumbnail_url text check (thumbnail_url is null or thumbnail_url ~ '^https://'),
  caption text not null check (char_length(caption) between 1 and 280),
  position text check (position is null or char_length(position) <= 40),
  skill_tags text[] not null default '{}',
  is_public boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists scout_clips_public_created_idx
  on public.scout_clips (is_public, created_at desc);

create index if not exists scout_clips_player_idx
  on public.scout_clips (player_id, created_at desc);

drop trigger if exists set_scout_clips_updated_at on public.scout_clips;
create trigger set_scout_clips_updated_at before update on public.scout_clips
  for each row execute procedure public.set_updated_at();

create table if not exists public.scout_clip_reactions (
  clip_id uuid references public.scout_clips(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  kind text not null check (kind in ('like', 'save', 'scout')),
  created_at timestamptz default now(),
  primary key (clip_id, user_id, kind)
);

create index if not exists scout_clip_reactions_user_idx
  on public.scout_clip_reactions (user_id, kind, created_at desc);

alter table public.scout_clips enable row level security;
alter table public.scout_clip_reactions enable row level security;

create policy "Public scout clips are viewable"
  on public.scout_clips for select using (is_public = true or auth.uid() = player_id);

create policy "Players create their own scout clips"
  on public.scout_clips for insert with check (auth.uid() = player_id);

create policy "Players update their own scout clips"
  on public.scout_clips for update
  using (auth.uid() = player_id)
  with check (auth.uid() = player_id);

create policy "Players delete their own scout clips"
  on public.scout_clips for delete using (auth.uid() = player_id);

create policy "Scout reactions are publicly countable"
  on public.scout_clip_reactions for select using (true);

create policy "Users react as themselves"
  on public.scout_clip_reactions for insert with check (auth.uid() = user_id);

create policy "Users remove their own scout reactions"
  on public.scout_clip_reactions for delete using (auth.uid() = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'scout-clips',
  'scout-clips',
  true,
  104857600,
  array['video/mp4', 'video/webm', 'video/quicktime']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Scout clip videos are publicly readable"
  on storage.objects for select using (bucket_id = 'scout-clips');

create policy "Users upload their own scout clip videos"
  on storage.objects for insert with check (
    bucket_id = 'scout-clips'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users update their own scout clip videos"
  on storage.objects for update using (
    bucket_id = 'scout-clips'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users delete their own scout clip videos"
  on storage.objects for delete using (
    bucket_id = 'scout-clips'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
