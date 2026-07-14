-- The tournament room let a player join a team's roster but still shut them
-- out of the room itself: both the read and post policies only recognized
-- the organizer and team captains. Extend both to any rostered player
-- (tournament_team_members), matching what "join this team" actually promises.

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
        or exists (
          select 1
          from public.tournament_team_members ttm
          where ttm.tournament_id = t.id
            and ttm.user_id = auth.uid()
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
        or exists (
          select 1
          from public.tournament_team_members ttm
          where ttm.tournament_id = t.id
            and ttm.user_id = auth.uid()
        )
      )
  )
);
