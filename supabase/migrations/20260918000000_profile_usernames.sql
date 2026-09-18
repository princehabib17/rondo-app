-- Unique @usernames on profiles (login resolves username → email).
alter table public.profiles
  add column if not exists username text;

-- Normalize existing empties
update public.profiles
set username = null
where username is not null and trim(username) = '';

create unique index if not exists profiles_username_lower_unique
  on public.profiles (lower(username))
  where username is not null;

alter table public.profiles
  drop constraint if exists profiles_username_format;

alter table public.profiles
  add constraint profiles_username_format
  check (
    username is null
    or username ~ '^[a-z0-9_]{3,20}$'
  );

create or replace function public.handle_new_user()
returns trigger as $$
declare
  meta_username text;
begin
  meta_username := lower(trim(coalesce(new.raw_user_meta_data->>'username', '')));
  if meta_username = '' then
    meta_username := null;
  end if;

  insert into public.profiles (id, email, phone, full_name, avatar_url, username)
  values (
    new.id,
    new.email,
    new.phone,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    meta_username
  )
  on conflict (id) do update set
    email = excluded.email,
    phone = coalesce(public.profiles.phone, excluded.phone),
    full_name = coalesce(public.profiles.full_name, excluded.full_name),
    avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url),
    username = coalesce(public.profiles.username, excluded.username);
  return new;
end;
$$ language plpgsql security definer set search_path = public;
