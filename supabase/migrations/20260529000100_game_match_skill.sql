-- Adds match type + skill level to games so the feed can filter and badge them.
-- Safe to run multiple times.

alter table public.games
  add column if not exists match_type text
    check (match_type in ('football', 'futsal'));

alter table public.games
  add column if not exists skill_level text
    check (skill_level in ('beginner', 'intermediate', 'advanced', 'pro'));

-- Backfill match_type from format for existing rows (5/4/3-a-side => futsal).
update public.games
set match_type = case
  when format ~* '(^|[^0-9])(5v5|4v4|3v3|futsal)' then 'futsal'
  else 'football'
end
where match_type is null;

create index if not exists games_match_type_idx on public.games (match_type);
create index if not exists games_skill_level_idx on public.games (skill_level);
create index if not exists games_is_private_idx on public.games (is_private);
