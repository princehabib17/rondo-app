-- ── Copy pass: placeholder listings drop the em-dash (20261002000000) ───────
-- Only the seeded placeholder organizers' games are touched; titles written by
-- real organizers are their own words. Safe to re-run.
update public.games g
set title = regexp_replace(g.title, '\s+—\s+', ' · ', 'g')
from public.profiles p
where p.id = g.organizer_id
  and p.email like '%@organizers.rondo'
  and g.title like '%—%';

update public.games g
set description = regexp_replace(g.description, '\s+—\s+', ': ', 'g')
from public.profiles p
where p.id = g.organizer_id
  and p.email like '%@organizers.rondo'
  and g.description like '%—%';
