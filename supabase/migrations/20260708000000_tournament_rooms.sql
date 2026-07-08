create table if not exists public.tournament_messages (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null default 'text' check (kind in ('text', 'announcement', 'match_result', 'system')),
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);

create index if not exists tournament_messages_tournament_created_idx
  on public.tournament_messages (tournament_id, created_at desc);

alter table public.tournament_messages enable row level security;

drop policy if exists "Tournament participants can read room messages" on public.tournament_messages;
create policy "Tournament participants can read room messages"
on public.tournament_messages
for select
using (
  exists (
    select 1
    from public.tournaments t
    where t.id = tournament_id
      and (
        t.organizer_id = auth.uid()
        or exists (
          select 1
          from public.tournament_teams tt
          where tt.tournament_id = t.id
            and tt.captain_id = auth.uid()
            and tt.status = 'registered'
        )
      )
  )
);

drop policy if exists "Tournament participants can post room messages" on public.tournament_messages;
create policy "Tournament participants can post room messages"
on public.tournament_messages
for insert
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.tournaments t
    where t.id = tournament_id
      and (
        t.organizer_id = auth.uid()
        or exists (
          select 1
          from public.tournament_teams tt
          where tt.tournament_id = t.id
            and tt.captain_id = auth.uid()
            and tt.status = 'registered'
        )
      )
  )
);

do $$
begin
  alter publication supabase_realtime add table public.tournament_messages;
exception when duplicate_object then null;
end $$;

