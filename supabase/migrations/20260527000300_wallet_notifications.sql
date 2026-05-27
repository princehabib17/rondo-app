-- Phase 3: wallet ledger, payouts, notifications

create table if not exists public.wallet_transactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  organizer_id uuid references public.profiles(id) on delete set null,
  game_id uuid references public.games(id) on delete set null,
  amount integer not null,
  direction text not null check (direction in ('credit', 'debit')),
  source text not null check (source in ('payment', 'refund', 'payout', 'adjustment')),
  note text,
  created_at timestamptz default now()
);

create table if not exists public.payout_requests (
  id uuid default uuid_generate_v4() primary key,
  organizer_id uuid references public.profiles(id) on delete cascade not null,
  amount integer not null check (amount > 0),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'paid')),
  bank_account_name text,
  bank_name text,
  bank_account_number text,
  note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text not null,
  title text not null,
  body text not null,
  link text,
  read_at timestamptz,
  created_at timestamptz default now()
);

alter table public.wallet_transactions enable row level security;
alter table public.payout_requests enable row level security;
alter table public.notifications enable row level security;

drop policy if exists "Users can view their wallet transactions" on public.wallet_transactions;
create policy "Users can view their wallet transactions"
  on public.wallet_transactions for select
  using (auth.uid() = user_id or auth.uid() = organizer_id);

drop policy if exists "Users can view their payout requests" on public.payout_requests;
create policy "Users can view their payout requests"
  on public.payout_requests for select
  using (auth.uid() = organizer_id);

drop policy if exists "Organizers can create payout requests" on public.payout_requests;
create policy "Organizers can create payout requests"
  on public.payout_requests for insert
  with check (auth.uid() = organizer_id);

drop policy if exists "Users can view their notifications" on public.notifications;
create policy "Users can view their notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

drop policy if exists "Users can mark their notifications read" on public.notifications;
create policy "Users can mark their notifications read"
  on public.notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can insert their own notifications" on public.notifications;
create policy "Users can insert their own notifications"
  on public.notifications for insert
  with check (auth.uid() = user_id);

drop trigger if exists set_payout_requests_updated_at on public.payout_requests;
create trigger set_payout_requests_updated_at
  before update on public.payout_requests
  for each row execute procedure public.set_updated_at();
