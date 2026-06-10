-- Tournament performance: covering indexes for hot count queries + realtime

-- Round-robin completion check counts scheduled matches per tournament.
create index if not exists tournament_matches_status_idx
  on public.tournament_matches (tournament_id, status);

-- Registration capacity checks count registered teams per tournament.
create index if not exists tournament_teams_status_idx
  on public.tournament_teams (tournament_id, status);

-- Post rate limiting counts a user's recent posts/comments.
create index if not exists post_comments_author_idx
  on public.post_comments (author_id, created_at desc);

-- Broadcast tournament changes so brackets/standings update without polling.
-- Adding a table twice errors, so guard each statement.
do $$
begin
  alter publication supabase_realtime add table public.tournaments;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.tournament_matches;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.tournament_teams;
exception when duplicate_object then null;
end $$;
