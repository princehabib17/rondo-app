-- Phase 4: extended onboarding profile fields

alter table public.profiles
  add column if not exists skill_level text check (skill_level in ('beginner', 'intermediate', 'advanced', 'pro'));

alter table public.profiles
  add column if not exists preferred_areas text;

alter table public.profiles
  add column if not exists game_preference text check (game_preference in ('football', 'futsal', 'both'));
