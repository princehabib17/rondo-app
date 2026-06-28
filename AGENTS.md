<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

Rondo is a Next.js 16 (App Router, Webpack dev) + Supabase app. There is a single
web service plus a **local Supabase stack** (Auth/Postgres/Storage/Realtime) running
in Docker. Standard scripts live in `package.json` (`dev`, `build`, `lint`, `test`);
middleware is in `proxy.ts` (not `middleware.ts`).

The update script only refreshes npm deps. Docker, the Supabase CLI, `supabase/config.toml`,
the pulled images, `.env.local`, and the local DB volume are provided by the VM snapshot —
you generally only need to (re)start services, not reinstall anything.

### Start the backend + app (run these each session if not already up)

1. **Docker daemon** (no systemd here): `sudo dockerd` in a background tmux session.
   If you hit `permission denied ... docker.sock`, run `sudo chmod 666 /var/run/docker.sock`.
2. **Supabase**: `supabase start` (from repo root). Wait for it to report the API URL
   (http://127.0.0.1:54321). Get keys/URLs anytime with `supabase status`.
3. **Database**: `bash scripts/setup-local-db.sh`. This is idempotent — it no-ops if the
   schema is already loaded (e.g. the DB volume persisted in the snapshot), and loads it
   otherwise. See that script's header for *why* the DB is loaded via `psql` rather than
   the normal migration/seed flow.
4. **`.env.local`**: must exist with the local Supabase keys. If missing, recreate it from
   `supabase status` (`API_URL` → `NEXT_PUBLIC_SUPABASE_URL`, `ANON_KEY`, `SERVICE_ROLE_KEY`)
   plus `NEXT_PUBLIC_APP_URL=http://localhost:3000`. It is gitignored.
5. **App**: `npm run dev` → http://localhost:3000.

### Non-obvious gotchas

- **Schema drift**: `supabase/schema.sql` is a base snapshot that already includes
  migrations up to `wallet_notifications` (20260527000300). Auto-migrations and the seed
  runner are intentionally disabled in `config.toml`; `scripts/setup-local-db.sh` applies
  `schema.sql` + only the migrations from `20260527000400` onward, then re-applies the
  standard Supabase table grants (without those grants the `authenticated` role gets
  "permission denied for table profiles"). `RUN_ALL_IN_SUPABASE.sql` is stale (missing
  `match_type`) — do not rely on it locally.
- **Auth is phone-OTP only** (signup + login). A local test number is wired up so no SMS
  provider is needed: phone `+639171234567`, OTP `123456` (see `[auth.sms.test_otp]` in
  `config.toml`). Twilio is "enabled" with dummy creds purely to turn on phone auth; the
  dummy `SUPABASE_AUTH_SMS_TWILIO_AUTH_TOKEN` is exported from `~/.bashrc`.
- **API UUID validation**: routes like `/api/matches/join` validate ids with Zod
  `.uuid()` (strict RFC 4122). When seeding test rows, use `gen_random_uuid()` — made-up
  ids like `b2222222-...` are rejected with `400 Invalid request`.
- **Seeding test data**: create auth users via the GoTrue admin API
  (`POST http://127.0.0.1:54321/auth/v1/admin/users` with the service-role key) so the
  `handle_new_user` trigger creates their profile, then set `role`/insert games via SQL.
  Clients cannot self-promote to admin/organizer role-protection triggers.
