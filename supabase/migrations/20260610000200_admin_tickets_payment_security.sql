-- Admin role + ticket management, payment anti-fraud logging, scalability indexes

-- ── Admin role ───────────────────────────────────────────────────────────────
-- Grant with SQL (service role / SQL editor only — protect_profile_role blocks
-- clients from changing their own role):
--   update public.profiles set role = 'admin' where id = '<user-uuid>';

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check check (role in ('player', 'organizer', 'admin'));

create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$ language sql stable security definer set search_path = public;

-- ── Admin access to support tickets ─────────────────────────────────────────

drop policy if exists "Admins view all support tickets" on public.support_tickets;
create policy "Admins view all support tickets"
  on public.support_tickets for select using (public.is_admin());

drop policy if exists "Admins update support tickets" on public.support_tickets;
create policy "Admins update support tickets"
  on public.support_tickets for update
  using (public.is_admin())
  with check (public.is_admin());

-- Admins notify users about ticket replies / status changes.
drop policy if exists "Admins notify users" on public.notifications;
create policy "Admins notify users"
  on public.notifications for insert with check (public.is_admin());

-- ── Ticket replies (user-visible responses + internal admin notes) ──────────

create table if not exists public.ticket_replies (
  id uuid default uuid_generate_v4() primary key,
  ticket_id uuid references public.support_tickets(id) on delete cascade not null,
  author_id uuid references public.profiles(id) on delete cascade not null,
  body text not null check (char_length(body) between 1 and 4000),
  is_internal boolean not null default false,
  created_at timestamptz default now()
);

create index if not exists ticket_replies_ticket_idx
  on public.ticket_replies (ticket_id, created_at);

alter table public.ticket_replies enable row level security;

drop policy if exists "Ticket participants read replies" on public.ticket_replies;
create policy "Ticket participants read replies"
  on public.ticket_replies for select using (
    public.is_admin()
    or (
      not is_internal
      and auth.uid() = (select user_id from public.support_tickets where id = ticket_id)
    )
  );

drop policy if exists "Ticket participants write replies" on public.ticket_replies;
create policy "Ticket participants write replies"
  on public.ticket_replies for insert with check (
    auth.uid() = author_id
    and (
      public.is_admin()
      or (
        not is_internal
        and auth.uid() = (select user_id from public.support_tickets where id = ticket_id)
      )
    )
  );

-- ── Payment attempts (rate limiting + anomaly detection) ────────────────────
-- Written exclusively by the service role from API routes; admins can read.

create table if not exists public.payment_attempts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  kind text not null check (kind in ('wallet_topup', 'wallet_pay', 'payout_request')),
  amount integer not null check (amount >= 0),
  status text not null default 'initiated'
    check (status in ('initiated', 'failed', 'succeeded')),
  flagged boolean not null default false,
  flag_reason text,
  created_at timestamptz default now()
);

create index if not exists payment_attempts_user_idx
  on public.payment_attempts (user_id, created_at desc);

create index if not exists payment_attempts_flagged_idx
  on public.payment_attempts (flagged, created_at desc);

alter table public.payment_attempts enable row level security;

drop policy if exists "Admins view payment attempts" on public.payment_attempts;
create policy "Admins view payment attempts"
  on public.payment_attempts for select using (public.is_admin());

-- ── Scalability indexes for existing hot queries ─────────────────────────────

-- Feed: open games ordered by kickoff.
create index if not exists games_status_date_idx
  on public.games (status, date_time);

-- Organizer dashboard: their games, newest first.
create index if not exists games_organizer_date_idx
  on public.games (organizer_id, date_time desc);

-- My games: lookups by player (game_id side is covered by the
-- unique (game_id, user_id) constraint).
create index if not exists game_players_user_idx
  on public.game_players (user_id, joined_at desc);

-- Squad chat history.
create index if not exists messages_game_idx
  on public.messages (game_id, created_at);

-- Notification inbox.
create index if not exists notifications_user_idx
  on public.notifications (user_id, created_at desc);

-- Followers lookup (the follows PK covers the follower side).
create index if not exists follows_following_idx
  on public.follows (following_id);

-- Wallet balance + history scans.
create index if not exists wallet_transactions_user_idx
  on public.wallet_transactions (user_id, created_at desc);

-- Help center: user's tickets, and admin filtering by status.
create index if not exists support_tickets_user_idx
  on public.support_tickets (user_id, created_at desc);

create index if not exists support_tickets_status_idx
  on public.support_tickets (status, created_at desc);

-- Payout review queues.
create index if not exists payout_requests_organizer_idx
  on public.payout_requests (organizer_id, created_at desc);

create index if not exists payout_requests_status_idx
  on public.payout_requests (status, created_at desc);
