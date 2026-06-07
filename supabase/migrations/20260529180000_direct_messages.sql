-- Personal 1:1 messages between players (not squad chat)

create table if not exists public.direct_messages (
  id uuid default uuid_generate_v4() primary key,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  recipient_id uuid references public.profiles(id) on delete cascade not null,
  body text not null,
  read_at timestamptz,
  created_at timestamptz default now(),
  check (sender_id <> recipient_id)
);

create index if not exists direct_messages_pair_idx
  on public.direct_messages (sender_id, recipient_id, created_at desc);

create index if not exists direct_messages_recipient_idx
  on public.direct_messages (recipient_id, created_at desc);

alter table public.direct_messages enable row level security;

create policy "Users read their direct messages"
  on public.direct_messages for select
  using (auth.uid() = sender_id or auth.uid() = recipient_id);

create policy "Users send direct messages"
  on public.direct_messages for insert
  with check (auth.uid() = sender_id);

create policy "Recipients mark messages read"
  on public.direct_messages for update
  using (auth.uid() = recipient_id)
  with check (auth.uid() = recipient_id);
