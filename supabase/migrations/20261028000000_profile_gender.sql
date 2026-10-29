alter table public.profiles
  add column if not exists gender text
  check (gender is null or gender in ('male', 'female', 'other', 'prefer_not_to_say'));

comment on column public.profiles.gender is 'Player gender for matchmaking display: male | female | other | prefer_not_to_say';
