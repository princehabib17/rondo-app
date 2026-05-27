-- Phase 2: payment states + organizer controls support + help tickets

-- Expand payment status values
alter table public.game_players
  drop constraint if exists game_players_payment_status_check;

alter table public.game_players
  add constraint game_players_payment_status_check
  check (
    payment_status in (
      'pending',
      'pending_payment',
      'reserved',
      'pending_approval',
      'approved',
      'rejected',
      'paid',
      'venue',
      'refund_requested',
      'refunded',
      'cancelled',
      'no_show'
    )
  );

-- Registration controls for organizers
alter table public.games
  add column if not exists registration_open boolean not null default true;

alter table public.games
  add column if not exists is_private boolean not null default false;

-- Player support tickets (manual handling MVP)
create table if not exists public.support_tickets (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  game_id uuid references public.games(id) on delete set null,
  type text not null check (type in ('payment_issue', 'refund_request', 'game_cancelled', 'organizer_issue', 'player_issue', 'app_issue', 'other')),
  description text not null,
  refund_requested boolean not null default false,
  status text not null default 'open' check (status in ('open', 'in_review', 'resolved', 'refund_pending', 'refunded', 'closed')),
  admin_note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.support_tickets enable row level security;

drop policy if exists "Users can create their own support tickets" on public.support_tickets;
create policy "Users can create their own support tickets"
  on public.support_tickets for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can view their own support tickets" on public.support_tickets;
create policy "Users can view their own support tickets"
  on public.support_tickets for select
  using (auth.uid() = user_id);

drop policy if exists "Users can update their own open support tickets" on public.support_tickets;
create policy "Users can update their own open support tickets"
  on public.support_tickets for update
  using (auth.uid() = user_id and status in ('open', 'in_review'))
  with check (auth.uid() = user_id);

create or replace function public.set_support_tickets_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_support_tickets_updated_at on public.support_tickets;
create trigger set_support_tickets_updated_at
  before update on public.support_tickets
  for each row execute procedure public.set_support_tickets_updated_at();
