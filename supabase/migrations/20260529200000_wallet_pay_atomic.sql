-- Atomic wallet match payment + idempotency

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
