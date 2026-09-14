-- Rondo: schema audit (run in Supabase → SQL Editor → Run)
-- Returns one row per check. Anything with status = MISSING means the app will
-- error on the screens that use it. Fix: run supabase/RUN_ALL_IN_SUPABASE.sql
-- (safe to re-run) — it creates every object listed here.
--
-- Same list as GET /api/health (lib/supabase/schema-manifest.ts). Keep in sync.

with expected_tables(name) as (
  values
    ('profiles'), ('games'), ('teams'), ('game_players'), ('announcements'),
    ('organizer_broadcasts'), ('support_tickets'), ('ticket_replies'),
    ('wallet_transactions'), ('wallet_payment_intents'), ('payout_requests'),
    ('payment_attempts'), ('notifications'), ('follows'), ('messages'),
    ('direct_messages'), ('timer_sessions'), ('webhook_events'), ('game_waitlist'),
    ('tournaments'), ('tournament_teams'), ('tournament_matches'),
    ('tournament_team_members'), ('tournament_goals'), ('tournament_awards'),
    ('tournament_messages'), ('posts'), ('post_likes'), ('post_comments'),
    ('organizations'), ('organization_members'), ('player_reels'), ('reel_likes'),
    ('scout_shortlists'), ('scout_clips'), ('scout_clip_reactions')
),
expected_columns(table_name, column_name) as (
  values
    ('profiles', 'phone'), ('profiles', 'location_hidden'), ('profiles', 'last_lat'),
    ('profiles', 'last_lng'), ('profiles', 'organizer_verified'),
    ('profiles', 'preferred_areas'), ('profiles', 'game_preference'),
    ('games', 'match_type'), ('games', 'skill_level'), ('games', 'allow_pay_later'),
    ('games', 'registration_open'), ('games', 'is_private'),
    ('games', 'organization_id'), ('games', 'banner_url'),
    ('tournaments', 'organization_id'), ('tournament_teams', 'team_number'),
    ('tournament_teams', 'is_managed')
),
expected_functions(name) as (
  values
    ('set_updated_at'), ('handle_new_user'), ('protect_profile_role'), ('is_admin'),
    ('pay_match_with_wallet'), ('can_manage_organization'), ('set_organization_owner'),
    ('slugify_organization_name')
),
expected_buckets(name) as (
  values ('avatars'), ('game-covers'), ('player-reels'), ('scout-clips')
),
checks as (
  select 'table: ' || e.name as check_name,
    case when exists (
      select 1 from information_schema.tables t
      where t.table_schema = 'public' and t.table_name = e.name
    ) then 'OK' else 'MISSING' end as status
  from expected_tables e

  union all
  select 'column: ' || e.table_name || '.' || e.column_name,
    case when exists (
      select 1 from information_schema.columns c
      where c.table_schema = 'public'
        and c.table_name = e.table_name
        and c.column_name = e.column_name
    ) then 'OK' else 'MISSING' end
  from expected_columns e

  union all
  select 'function: ' || e.name,
    case when exists (
      select 1 from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = e.name
    ) then 'OK' else 'MISSING' end
  from expected_functions e

  union all
  select 'bucket: ' || e.name,
    case when exists (select 1 from storage.buckets b where b.id = e.name)
      then 'OK' else 'MISSING' end
  from expected_buckets e

  union all
  select 'profiles.role is nullable (onboarding can run)',
    case when exists (
      select 1 from information_schema.columns c
      where c.table_schema = 'public' and c.table_name = 'profiles'
        and c.column_name = 'role' and c.is_nullable = 'YES'
    ) then 'OK' else 'MISSING' end

  union all
  select 'game_players.payment_status accepts reserved/pending_payment',
    case when exists (
      select 1 from information_schema.check_constraints cc
      join information_schema.constraint_column_usage ccu on cc.constraint_name = ccu.constraint_name
      where ccu.table_schema = 'public' and ccu.table_name = 'game_players'
        and ccu.column_name = 'payment_status' and cc.check_clause like '%reserved%'
    ) then 'OK' else 'MISSING' end

  union all
  select 'realtime: tournament_messages published',
    case when exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'tournament_messages'
    ) then 'OK' else 'MISSING' end
)
select check_name, status,
  case when status = 'MISSING' then 'Run supabase/RUN_ALL_IN_SUPABASE.sql' else '' end as fix_action
from checks
order by status desc, check_name;
