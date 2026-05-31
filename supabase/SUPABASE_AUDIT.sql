-- Rondo: schema audit (run in Supabase → SQL Editor → Run)
-- Returns one row per check. Fix anything with status = MISSING.

select * from (
  -- ── Core tables (from schema.sql / early migrations) ─────────────────────
  select 'table: profiles' as check_name,
    case when exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'profiles')
      then 'OK' else 'MISSING' end as status,
    'Run supabase/schema.sql (fresh project) or restore base schema' as fix_action
  union all
  select 'table: games',
    case when exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'games')
      then 'OK' else 'MISSING' end,
    'Run supabase/schema.sql'
  union all
  select 'table: game_players',
    case when exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'game_players')
      then 'OK' else 'MISSING' end,
    'Run supabase/schema.sql'
  union all
  select 'table: wallet_transactions',
    case when exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'wallet_transactions')
      then 'OK' else 'MISSING' end,
    'Run migrations/20260527000300_wallet_notifications.sql'
  union all
  select 'table: notifications',
    case when exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'notifications')
      then 'OK' else 'MISSING' end,
    'Run migrations/20260527000300_wallet_notifications.sql'

  -- ── Match skill / type (20260529000100 or COMBINED part 1) ───────────────
  union all
  select 'games.match_type',
    case when exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'games' and column_name = 'match_type')
      then 'OK' else 'MISSING' end,
    'Run COMBINED_run_in_supabase.sql or 20260529000100_game_match_skill.sql'
  union all
  select 'games.skill_level',
    case when exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'games' and column_name = 'skill_level')
      then 'OK' else 'MISSING' end,
    'Run COMBINED_run_in_supabase.sql or 20260529000100_game_match_skill.sql'

  -- ── Rules, waitlist, profile location (COMBINED part 2) ───────────────────
  union all
  select 'games.allow_pay_later',
    case when exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'games' and column_name = 'allow_pay_later')
      then 'OK' else 'MISSING' end,
    'Run COMBINED_run_in_supabase.sql or 20260529120000_match_rules_waitlist.sql'
  union all
  select 'profiles.location_hidden',
    case when exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'location_hidden')
      then 'OK' else 'MISSING' end,
    'Run COMBINED_run_in_supabase.sql or 20260529120000_match_rules_waitlist.sql'
  union all
  select 'profiles.last_lat / last_lng',
    case when exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'last_lat')
      and exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'last_lng')
      then 'OK' else 'MISSING' end,
    'Run COMBINED_run_in_supabase.sql or 20260529120000_match_rules_waitlist.sql'
  union all
  select 'table: game_waitlist',
    case when exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'game_waitlist')
      then 'OK' else 'MISSING' end,
    'Run COMBINED_run_in_supabase.sql or 20260529120000_match_rules_waitlist.sql'

  -- ── Direct messages (COMBINED part 3) ───────────────────────────────────
  union all
  select 'table: direct_messages',
    case when exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'direct_messages')
      then 'OK' else 'MISSING' end,
    'Run COMBINED_run_in_supabase.sql or 20260529180000_direct_messages.sql'

  -- ── Wallet atomic pay (NOT in COMBINED — run separately) ──────────────────
  union all
  select 'table: wallet_payment_intents',
    case when exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'wallet_payment_intents')
      then 'OK' else 'MISSING' end,
    'Run migrations/20260529200000_wallet_pay_atomic.sql'
  union all
  select 'function: pay_match_with_wallet',
    case when exists (
      select 1 from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = 'pay_match_with_wallet'
    ) then 'OK' else 'MISSING' end,
    'Run migrations/20260529200000_wallet_pay_atomic.sql'

  -- ── Payment status values (phase 2) ─────────────────────────────────────
  union all
  select 'game_players.payment_status (reserved/pending_payment)',
    case when exists (
      select 1 from information_schema.check_constraints cc
      join information_schema.constraint_column_usage ccu on cc.constraint_name = ccu.constraint_name
      where ccu.table_schema = 'public' and ccu.table_name = 'game_players' and ccu.column_name = 'payment_status'
        and cc.check_clause like '%reserved%'
    ) then 'OK' else 'MISSING' end,
    'Run migrations/20260527000200_phase2_states_and_support.sql'
) audit
order by status desc, check_name;
