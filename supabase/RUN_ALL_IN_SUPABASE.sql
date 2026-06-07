-- =============================================================================
-- RONDO — ONE FILE FOR SUPABASE SQL EDITOR
-- =============================================================================
-- Paste this entire file → Supabase Dashboard → SQL Editor → Run
-- Safe to re-run (uses IF NOT EXISTS / DROP IF EXISTS where needed).
--
-- Prerequisite: base tables already exist (you ran schema.sql when you created
-- the project). This file adds everything the app expects after that.
-- =============================================================================

-- ── Shared trigger helper (wallet payout_requests uses this) ─────────────────

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ── Phase 2: payment states, registration, support tickets ─────────────────

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

alter table public.games
  add column if not exists registration_open boolean not null default true;

alter table public.games
  add column if not exists is_private boolean not null default false;

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

-- ── Phase 3: wallet, payouts, notifications ─────────────────────────────────

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

-- ── Match type + skill level ─────────────────────────────────────────────────

alter table public.games
  add column if not exists match_type text
    check (match_type in ('football', 'futsal'));

alter table public.games
  add column if not exists skill_level text
    check (skill_level in ('beginner', 'intermediate', 'advanced', 'pro'));

update public.games
set match_type = case
  when format ~* '(^|[^0-9])(5v5|4v4|3v3|futsal)' then 'futsal'
  else 'football'
end
where match_type is null;

create index if not exists games_match_type_idx on public.games (match_type);
create index if not exists games_skill_level_idx on public.games (skill_level);
create index if not exists games_is_private_idx on public.games (is_private);

-- ── Match rules, waitlist, profile location ──────────────────────────────────

alter table public.games
  add column if not exists allow_pay_later boolean not null default false;

alter table public.profiles
  add column if not exists organizer_verified boolean not null default false;

alter table public.profiles
  add column if not exists location_hidden boolean not null default false;

alter table public.profiles
  add column if not exists last_lat double precision;

alter table public.profiles
  add column if not exists last_lng double precision;

create table if not exists public.game_waitlist (
  id uuid default uuid_generate_v4() primary key,
  game_id uuid references public.games(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  team_id uuid references public.teams(id) on delete set null,
  status text not null default 'waiting' check (status in ('waiting', 'refused')),
  created_at timestamptz default now(),
  unique(game_id, user_id)
);

create index if not exists game_waitlist_game_id_idx on public.game_waitlist (game_id);

alter table public.game_waitlist enable row level security;

drop policy if exists "Waitlist viewable for game viewers" on public.game_waitlist;
create policy "Waitlist viewable for game viewers"
  on public.game_waitlist for select using (true);

drop policy if exists "Users can join waitlist" on public.game_waitlist;
create policy "Users can join waitlist"
  on public.game_waitlist for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own waitlist row" on public.game_waitlist;
create policy "Users can update own waitlist row"
  on public.game_waitlist for update using (auth.uid() = user_id);

drop policy if exists "Users can leave waitlist" on public.game_waitlist;
create policy "Users can leave waitlist"
  on public.game_waitlist for delete using (auth.uid() = user_id);

drop policy if exists "Organizers manage waitlist for their games" on public.game_waitlist;
create policy "Organizers manage waitlist for their games"
  on public.game_waitlist for all using (
    auth.uid() = (select organizer_id from public.games where id = game_id)
  );

drop policy if exists "Announcements viewable by game participants" on public.announcements;
drop policy if exists "Announcements publicly viewable" on public.announcements;
create policy "Announcements publicly viewable"
  on public.announcements for select using (true);

-- ── Direct messages (1:1) ───────────────────────────────────────────────────

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

drop policy if exists "Users read their direct messages" on public.direct_messages;
create policy "Users read their direct messages"
  on public.direct_messages for select
  using (auth.uid() = sender_id or auth.uid() = recipient_id);

drop policy if exists "Users send direct messages" on public.direct_messages;
create policy "Users send direct messages"
  on public.direct_messages for insert
  with check (auth.uid() = sender_id);

drop policy if exists "Recipients mark messages read" on public.direct_messages;
create policy "Recipients mark messages read"
  on public.direct_messages for update
  using (auth.uid() = recipient_id)
  with check (auth.uid() = recipient_id);

-- ── Atomic wallet match payment ─────────────────────────────────────────────

create table if not exists public.wallet_payment_intents (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  idempotency_key text not null,
  game_id uuid references public.games(id) on delete cascade not null,
  status text not null default 'processing'
    check (status in ('processing', 'completed', 'failed')),
  result jsonb,
  created_at timestamptz default now(),
  unique (user_id, idempotency_key)
);

create index if not exists wallet_payment_intents_game_idx
  on public.wallet_payment_intents (game_id);

alter table public.wallet_payment_intents enable row level security;

create or replace function public.pay_match_with_wallet(
  p_user_id uuid,
  p_game_id uuid,
  p_team_id uuid,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  g record;
  v_balance bigint;
  v_total int;
  v_team_count int;
  v_per_team int;
  v_existing_status text;
  v_roster_status text;
  v_price int;
  v_result jsonb;
  v_intent_id uuid;
begin
  if p_idempotency_key is null or length(trim(p_idempotency_key)) < 8 then
    return jsonb_build_object('ok', false, 'code', 'INVALID', 'error', 'Invalid idempotency key');
  end if;

  select result into v_result
  from public.wallet_payment_intents
  where user_id = p_user_id
    and idempotency_key = p_idempotency_key
    and status = 'completed';

  if v_result is not null then
    return v_result;
  end if;

  begin
    insert into public.wallet_payment_intents (user_id, idempotency_key, game_id, status)
    values (p_user_id, p_idempotency_key, p_game_id, 'processing')
    returning id into v_intent_id;
  exception
    when unique_violation then
      select result, status into v_result, v_roster_status
      from public.wallet_payment_intents
      where user_id = p_user_id and idempotency_key = p_idempotency_key;

      if v_roster_status = 'completed' and v_result is not null then
        return v_result;
      end if;
      return jsonb_build_object(
        'ok', false,
        'code', 'IN_PROGRESS',
        'error', 'Payment already processing. Wait a moment and try again.'
      );
  end;

  select * into g
  from public.games
  where id = p_game_id
  for update;

  if not found then
    v_result := jsonb_build_object('ok', false, 'code', 'INVALID', 'error', 'Match not found');
    update public.wallet_payment_intents set status = 'failed', result = v_result where id = v_intent_id;
    return v_result;
  end if;

  if g.payment_type is distinct from 'online' then
    v_result := jsonb_build_object('ok', false, 'code', 'INVALID', 'error', 'This match does not use wallet payment');
    update public.wallet_payment_intents set status = 'failed', result = v_result where id = v_intent_id;
    return v_result;
  end if;

  if g.status is distinct from 'open' then
    v_result := jsonb_build_object('ok', false, 'code', 'INVALID', 'error', 'Match is not open for registration');
    update public.wallet_payment_intents set status = 'failed', result = v_result where id = v_intent_id;
    return v_result;
  end if;

  if g.registration_open is false then
    v_result := jsonb_build_object('ok', false, 'code', 'INVALID', 'error', 'Registration is closed');
    update public.wallet_payment_intents set status = 'failed', result = v_result where id = v_intent_id;
    return v_result;
  end if;

  v_price := g.price_per_player;

  if p_team_id is not null then
    if not exists (
      select 1 from public.teams t
      where t.id = p_team_id and t.game_id = p_game_id
    ) then
      v_result := jsonb_build_object('ok', false, 'code', 'INVALID', 'error', 'Invalid team for this match');
      update public.wallet_payment_intents set status = 'failed', result = v_result where id = v_intent_id;
      return v_result;
    end if;

    v_per_team := greatest(1, ceil(g.max_players::numeric / greatest(g.num_teams, 1))::int);
    select count(*)::int into v_team_count
    from public.game_players gp
    where gp.game_id = p_game_id
      and gp.team_id = p_team_id
      and gp.user_id <> p_user_id;

    if v_team_count >= v_per_team then
      v_result := jsonb_build_object('ok', false, 'code', 'TEAM_FULL', 'error', 'That team is full');
      update public.wallet_payment_intents set status = 'failed', result = v_result where id = v_intent_id;
      return v_result;
    end if;
  end if;

  select payment_status into v_existing_status
  from public.game_players
  where game_id = p_game_id and user_id = p_user_id;

  if v_existing_status = 'paid' then
    v_result := jsonb_build_object('ok', false, 'code', 'ALREADY_PAID', 'error', 'Already paid for this match');
    update public.wallet_payment_intents set status = 'failed', result = v_result where id = v_intent_id;
    return v_result;
  end if;

  if v_existing_status is null then
    select count(*)::int into v_total from public.game_players where game_id = p_game_id;
    if v_total >= g.max_players then
      v_result := jsonb_build_object('ok', false, 'code', 'GAME_FULL', 'error', 'Match is full');
      update public.wallet_payment_intents set status = 'failed', result = v_result where id = v_intent_id;
      return v_result;
    end if;
  end if;

  select coalesce(sum(case when direction = 'credit' then amount else -amount end), 0)::bigint
  into v_balance
  from public.wallet_transactions
  where user_id = p_user_id;

  if v_balance < v_price then
    v_result := jsonb_build_object(
      'ok', false,
      'code', 'INSUFFICIENT_BALANCE',
      'error', 'Insufficient wallet balance',
      'balanceCentavos', v_balance
    );
    update public.wallet_payment_intents set status = 'failed', result = v_result where id = v_intent_id;
    return v_result;
  end if;

  insert into public.wallet_transactions (
    user_id, organizer_id, game_id, amount, direction, source, note
  ) values (
    p_user_id, g.organizer_id, p_game_id, v_price, 'debit', 'payment',
    'wallet_pay:' || p_idempotency_key
  );

  v_roster_status := case when g.is_private then 'pending_approval' else 'paid' end;

  if not g.is_private then
    insert into public.wallet_transactions (
      user_id, organizer_id, game_id, amount, direction, source, note
    ) values (
      g.organizer_id, g.organizer_id, p_game_id, v_price, 'credit', 'payment',
      'game_earning:' || p_game_id::text || ':' || p_user_id::text
    );
  end if;

  insert into public.game_players (game_id, user_id, team_id, payment_status, paymongo_payment_id)
  values (p_game_id, p_user_id, p_team_id, v_roster_status, null)
  on conflict (game_id, user_id) do update set
    team_id = coalesce(excluded.team_id, game_players.team_id),
    payment_status = excluded.payment_status,
    paymongo_payment_id = null;

  v_result := jsonb_build_object(
    'ok', true,
    'code', 'PAID',
    'balanceAfter', v_balance - v_price,
    'paymentStatus', v_roster_status
  );

  update public.wallet_payment_intents
  set status = 'completed', result = v_result
  where id = v_intent_id;

  return v_result;
end;
$$;

revoke all on function public.pay_match_with_wallet(uuid, uuid, uuid, text) from public;
grant execute on function public.pay_match_with_wallet(uuid, uuid, uuid, text) to service_role;

-- Done. Optional: run supabase/SUPABASE_AUDIT.sql to confirm all checks show OK.
