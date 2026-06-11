-- Game cover images: public bucket, organizer-owned uploads under their uid folder

insert into storage.buckets (id, name, public)
values ('game-covers', 'game-covers', true)
on conflict (id) do nothing;

drop policy if exists "Game covers are publicly accessible" on storage.objects;
create policy "Game covers are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'game-covers');

drop policy if exists "Organizers upload game covers" on storage.objects;
create policy "Organizers upload game covers"
  on storage.objects for insert
  with check (
    bucket_id = 'game-covers'
    and auth.uid()::text = (storage.foldername(name))[1]
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'organizer')
  );

drop policy if exists "Organizers update game covers" on storage.objects;
create policy "Organizers update game covers"
  on storage.objects for update
  using (
    bucket_id = 'game-covers'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Organizers delete game covers" on storage.objects;
create policy "Organizers delete game covers"
  on storage.objects for delete
  using (
    bucket_id = 'game-covers'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
