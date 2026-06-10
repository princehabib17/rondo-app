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

-- ── Tournaments + Social feed (20260610000000) ─────────────────────────────

-- ── Tournaments ──────────────────────────────────────────────────────────────

create table if not exists public.tournaments (
  id uuid default uuid_generate_v4() primary key,
  organizer_id uuid references public.profiles(id) on delete cascade not null,
  name text not null check (char_length(name) between 3 and 120),
  description text,
  format text not null default 'single_elimination'
    check (format in ('single_elimination', 'round_robin')),
  status text not null default 'registration'
    check (status in ('registration', 'active', 'completed', 'cancelled')),
  venue_name text,
  venue_address text,
  starts_at timestamptz not null,
  max_teams integer not null default 8 check (max_teams between 2 and 64),
  team_size integer not null default 5 check (team_size between 1 and 11),
  entry_fee integer not null default 0 check (entry_fee >= 0), -- centavos per team
  banner_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists tournaments_status_starts_idx
  on public.tournaments (status, starts_at);

create index if not exists tournaments_organizer_idx
  on public.tournaments (organizer_id, created_at desc);

drop trigger if exists set_tournaments_updated_at on public.tournaments;
create trigger set_tournaments_updated_at before update on public.tournaments
  for each row execute procedure public.set_updated_at();

create table if not exists public.tournament_teams (
  id uuid default uuid_generate_v4() primary key,
  tournament_id uuid references public.tournaments(id) on delete cascade not null,
  captain_id uuid references public.profiles(id) on delete cascade not null,
  name text not null check (char_length(name) between 2 and 60),
  status text not null default 'registered'
    check (status in ('registered', 'withdrawn')),
  seed integer,
  created_at timestamptz default now(),
  unique (tournament_id, captain_id),
  unique (tournament_id, name)
);

create index if not exists tournament_teams_tournament_idx
  on public.tournament_teams (tournament_id, created_at);

create table if not exists public.tournament_matches (
  id uuid default uuid_generate_v4() primary key,
  tournament_id uuid references public.tournaments(id) on delete cascade not null,
  round integer not null check (round >= 1),
  position integer not null check (position >= 0),
  home_team_id uuid references public.tournament_teams(id) on delete set null,
  away_team_id uuid references public.tournament_teams(id) on delete set null,
  home_score integer check (home_score >= 0),
  away_score integer check (away_score >= 0),
  status text not null default 'scheduled'
    check (status in ('scheduled', 'completed', 'bye')),
  scheduled_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (tournament_id, round, position)
);

create index if not exists tournament_matches_tournament_idx
  on public.tournament_matches (tournament_id, round, position);

drop trigger if exists set_tournament_matches_updated_at on public.tournament_matches;
create trigger set_tournament_matches_updated_at before update on public.tournament_matches
  for each row execute procedure public.set_updated_at();

alter table public.tournaments enable row level security;
alter table public.tournament_teams enable row level security;
alter table public.tournament_matches enable row level security;

drop policy if exists "Tournaments are publicly viewable" on public.tournaments;
create policy "Tournaments are publicly viewable"
  on public.tournaments for select using (true);

drop policy if exists "Organizers create tournaments" on public.tournaments;
create policy "Organizers create tournaments"
  on public.tournaments for insert with check (
    auth.uid() = organizer_id
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'organizer')
  );

drop policy if exists "Organizers update their tournaments" on public.tournaments;
create policy "Organizers update their tournaments"
  on public.tournaments for update
  using (auth.uid() = organizer_id)
  with check (auth.uid() = organizer_id);

drop policy if exists "Tournament teams are publicly viewable" on public.tournament_teams;
create policy "Tournament teams are publicly viewable"
  on public.tournament_teams for select using (true);

drop policy if exists "Captains register teams while registration is open" on public.tournament_teams;
create policy "Captains register teams while registration is open"
  on public.tournament_teams for insert with check (
    auth.uid() = captain_id
    and exists (
      select 1 from public.tournaments t
      where t.id = tournament_id and t.status = 'registration'
    )
  );

drop policy if exists "Captains update their teams" on public.tournament_teams;
create policy "Captains update their teams"
  on public.tournament_teams for update
  using (auth.uid() = captain_id)
  with check (auth.uid() = captain_id);

drop policy if exists "Tournament matches are publicly viewable" on public.tournament_matches;
create policy "Tournament matches are publicly viewable"
  on public.tournament_matches for select using (true);

drop policy if exists "Organizers manage their tournament matches" on public.tournament_matches;
create policy "Organizers manage their tournament matches"
  on public.tournament_matches for all
  using (auth.uid() = (select organizer_id from public.tournaments where id = tournament_id))
  with check (auth.uid() = (select organizer_id from public.tournaments where id = tournament_id));

-- ── Social feed ──────────────────────────────────────────────────────────────

create table if not exists public.posts (
  id uuid default uuid_generate_v4() primary key,
  author_id uuid references public.profiles(id) on delete cascade not null,
  game_id uuid references public.games(id) on delete set null,
  tournament_id uuid references public.tournaments(id) on delete set null,
  kind text not null default 'post'
    check (kind in ('post', 'highlight', 'match_result')),
  body text not null check (char_length(body) between 1 and 2000),
  media_url text,
  created_at timestamptz default now()
);

create index if not exists posts_created_idx
  on public.posts (created_at desc);

create index if not exists posts_author_idx
  on public.posts (author_id, created_at desc);

create table if not exists public.post_likes (
  post_id uuid references public.posts(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  primary key (post_id, user_id)
);

create table if not exists public.post_comments (
  id uuid default uuid_generate_v4() primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  author_id uuid references public.profiles(id) on delete cascade not null,
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz default now()
);

create index if not exists post_comments_post_idx
  on public.post_comments (post_id, created_at);

alter table public.posts enable row level security;
alter table public.post_likes enable row level security;
alter table public.post_comments enable row level security;

drop policy if exists "Posts are publicly viewable" on public.posts;
create policy "Posts are publicly viewable"
  on public.posts for select using (true);

drop policy if exists "Users create their own posts" on public.posts;
create policy "Users create their own posts"
  on public.posts for insert with check (auth.uid() = author_id);

drop policy if exists "Users delete their own posts" on public.posts;
create policy "Users delete their own posts"
  on public.posts for delete using (auth.uid() = author_id);

drop policy if exists "Post likes are publicly viewable" on public.post_likes;
create policy "Post likes are publicly viewable"
  on public.post_likes for select using (true);

drop policy if exists "Users like posts as themselves" on public.post_likes;
create policy "Users like posts as themselves"
  on public.post_likes for insert with check (auth.uid() = user_id);

drop policy if exists "Users remove their own likes" on public.post_likes;
create policy "Users remove their own likes"
  on public.post_likes for delete using (auth.uid() = user_id);

drop policy if exists "Post comments are publicly viewable" on public.post_comments;
create policy "Post comments are publicly viewable"
  on public.post_comments for select using (true);

drop policy if exists "Users comment as themselves" on public.post_comments;
create policy "Users comment as themselves"
  on public.post_comments for insert with check (auth.uid() = author_id);

drop policy if exists "Users delete their own comments" on public.post_comments;
create policy "Users delete their own comments"
  on public.post_comments for delete using (auth.uid() = author_id);

-- ── Tournament perf + realtime (20260610000100) ────────────────────────────

-- Round-robin completion check counts scheduled matches per tournament.
create index if not exists tournament_matches_status_idx
  on public.tournament_matches (tournament_id, status);

-- Registration capacity checks count registered teams per tournament.
create index if not exists tournament_teams_status_idx
  on public.tournament_teams (tournament_id, status);

-- Post rate limiting counts a user's recent posts/comments.
create index if not exists post_comments_author_idx
  on public.post_comments (author_id, created_at desc);

-- Broadcast tournament changes so brackets/standings update without polling.
-- Adding a table twice errors, so guard each statement.
do $$
begin
  alter publication supabase_realtime add table public.tournaments;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.tournament_matches;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.tournament_teams;
exception when duplicate_object then null;
end $$;

-- ── Admin tickets + payment security + indexes (20260610000200) ────────────

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

-- Done. Optional: run supabase/SUPABASE_AUDIT.sql to confirm all checks show OK.
