#!/usr/bin/env bash
#
# Loads the Rondo database schema into the LOCAL Supabase Postgres.
#
# Why this exists:
#   The repo ships a base `supabase/schema.sql` plus additive `supabase/migrations/*`.
#   The migrations assume the base tables already exist, and `schema.sql` itself is a
#   snapshot that already contains everything up to the `wallet_notifications` migration
#   (20260527000300). So the correct local order is:
#     schema.sql  ->  migrations from 20260527000400 onward.
#   We apply these with `psql` (sequential simple-query protocol) instead of the Supabase
#   seed runner, because the seed runner batches/prepares all statements in a file at once,
#   which breaks migrations that add a column/table and then reference it in the same file
#   (e.g. 20260529000100_game_match_skill.sql).
#
#   It also applies the standard Supabase table grants (anon/authenticated/service_role).
#   Hosted Supabase grants these automatically; locally, tables created via psql as the
#   `postgres` superuser do NOT get them, so the authenticated role would hit
#   "permission denied for table profiles" without this step.
#
# Prerequisites: `supabase start` has already brought up the local stack.
# Safe to skip automatically if the schema is already loaded.

set -euo pipefail

CONTAINER="supabase_db_workspace"
SUPA_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../supabase" && pwd)"

psql_run() {
  docker exec -i "$CONTAINER" psql -v ON_ERROR_STOP=1 -U postgres -d postgres "$@"
}

if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER}$"; then
  echo "ERROR: ${CONTAINER} is not running. Run 'supabase start' first." >&2
  exit 1
fi

# Idempotency guard: bail out if the schema is already present.
if psql_run -tAc "select to_regclass('public.games')" | grep -q "games"; then
  echo "Schema already loaded (public.games exists). Nothing to do."
  exit 0
fi

FILES=(
  "$SUPA_DIR/schema.sql"
  "$SUPA_DIR/migrations/20260527000400_profile_onboarding_fields.sql"
  "$SUPA_DIR/migrations/20260529000100_game_match_skill.sql"
  "$SUPA_DIR/migrations/20260529120000_match_rules_waitlist.sql"
  "$SUPA_DIR/migrations/20260529180000_direct_messages.sql"
  "$SUPA_DIR/migrations/20260529200000_wallet_pay_atomic.sql"
  "$SUPA_DIR/migrations/20260608000001_fix_profile_role_default.sql"
  "$SUPA_DIR/migrations/20260610000000_tournaments_social_feed.sql"
  "$SUPA_DIR/migrations/20260610000100_tournament_perf_realtime.sql"
  "$SUPA_DIR/migrations/20260610000200_admin_tickets_payment_security.sql"
  "$SUPA_DIR/migrations/20260611000000_game_covers.sql"
  "$SUPA_DIR/migrations/20260613000000_organizations.sql"
  "$SUPA_DIR/migrations/20260613000000_player_reels.sql"
)

for f in "${FILES[@]}"; do
  echo "Applying $(basename "$f")..."
  psql_run < "$f" > /dev/null
done

echo "Applying Supabase role grants..."
psql_run > /dev/null <<'SQL'
grant usage on schema public to anon, authenticated, service_role;
grant select, insert, update, delete on all tables in schema public to anon, authenticated, service_role;
grant usage, select on all sequences in schema public to anon, authenticated, service_role;
grant execute on all functions in schema public to anon, authenticated, service_role;
alter default privileges in schema public grant select, insert, update, delete on tables to anon, authenticated, service_role;
alter default privileges in schema public grant usage, select on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;
SQL

echo "Done. Database loaded."
