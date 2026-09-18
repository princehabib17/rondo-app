# Rondo App

Rondo is a mobile-first football/futsal coordination app built with Next.js App Router + Supabase.
It supports player and organizer journeys: discovery, join/payment, match chat, organizer operations, help tickets, wallet ledger records, notifications, and live timer screens.

## Stack

- Next.js 16 App Router (Turbopack build)
- React + TypeScript
- Supabase (Auth, Postgres, Storage, Realtime)
- Tailwind CSS
- PayMongo checkout integration

## Local Setup

1. Install dependencies:
   - `npm install`
2. Configure `.env.local` (copy from `.env.example` and fill values).
3. Run the app:
   - `npm run dev`
4. Open:
   - `http://localhost:3000`

## Environment Variables

Required (current implementation):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL`
- `PAYMONGO_SECRET_KEY`
- `PAYMONGO_WEBHOOK_SECRET_KEY`

## Vercel deployment

In the Vercel project **Settings → Environment Variables**, add every variable from `.env.example` for **Production** (and Preview if you use it). Then **Redeploy** the latest commit.

Set `NEXT_PUBLIC_APP_URL` to your production URL, e.g. `https://rondo-app.vercel.app`.

PayMongo webhook URL: `https://rondo-app.vercel.app/api/payments/webhook`

## Database / Migrations

The code reads ~36 tables, one RPC, and four storage buckets. If the project is
missing any of them, screens come up empty, API routes answer
`Could not find the table 'public.…' in the schema cache`, and actions fail.

Two files, in this order, in Supabase → SQL Editor:

1. `supabase/schema.sql` — **fresh projects only**. Base tables, triggers, avatars bucket.
2. `supabase/RUN_ALL_IN_SUPABASE.sql` — everything else, **safe to re-run**. Covers every
   file under `supabase/migrations/` plus organizations, reels, scout clips, and
   tournament rooms. Re-run it after every deploy that adds a migration.

Then confirm with either:

- `supabase/SUPABASE_AUDIT.sql` in the SQL Editor — every row must read `OK`; or
- `GET /api/health` with header `x-seed-secret: <SEED_SECRET>` — returns
  `{"ok":true}` or a `missing` list naming exactly what to create.

`supabase/migrations/*.sql` remain as the per-change history for `supabase db push`
workflows; the runner file is generated from them by hand, and
`__tests__/supabase/schema-manifest.test.ts` fails CI if code references a table the
runner does not create.

## Fixing production (Supabase + Vercel)

Symptoms: every screen empty or erroring, `/api/reels` returning 500, guest sign-in
failing in the browser while `POST /api/auth/guest` returns 200.

1. Open the [Supabase dashboard](https://supabase.com/dashboard). If the project is
   paused, restore it; if deleted, create a new one and run `supabase/schema.sql`.
2. Run `supabase/RUN_ALL_IN_SUPABASE.sql`, then `supabase/SUPABASE_AUDIT.sql` (all `OK`).
3. Authentication → Providers: enable **Phone** (with an SMS provider) and any social
   providers you use. Enable **Passkeys** for Face ID / Touch ID. Guest sign-in does
   **not** need the Anonymous provider — it uses `SUPABASE_SERVICE_ROLE_KEY` server-side.
4. Copy Project URL, anon key, and service role key.
5. Vercel → rondo-app → Settings → Environment Variables, for **Production** (and Preview):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_APP_URL=https://rondo-app.vercel.app`
   - `SEED_SECRET` (for `/api/health` and `/api/seed`)
6. Redeploy Production (env changes do not apply until a new deploy).
7. Smoke: `GET /api/health` with `x-seed-secret` → `{"ok":true}`. Guest from `/` reaches
   `/feed`; within a minute the feed shows placeholder open games.

## Main User Journeys

- **Auth**
  - New user: welcome -> signup (email + username default, or phone OTP) -> onboarding -> feed
  - Returning user: login (passkey / phone / email-or-username / social) -> feed
  - Guest: feed browsing only, gated on action routes
  - Passkeys: register from Profile → Passkeys; sign in from `/login` via Face ID, Touch ID, Windows Hello, or a security key
  - Phone SMS needs a configured Supabase phone provider; if texts fail, signup switches to Email
  - Usernames are unique on `profiles.username`; password login resolves `@handle` → email server-side
- **Player**
  - Browse feed/map -> open game -> join/reserve/pay -> confirmed -> invite/chat
  - Browse tournaments -> register a team -> follow bracket/standings
  - Post to the community feed (posts/highlights), like and comment
  - View profile wallet summary + matches
  - Submit and track help tickets
- **Organizer**
  - Create/manage games, assign teams, update statuses
  - Create tournaments (knockout or league), start fixtures, record results
  - Post organizer-room broadcasts
  - View game payments breakdown
  - Submit payout requests

## Screens / Route Highlights

- Player: `/feed`, `/feed/map`, `/games/[id]`, `/games/[id]/join`, `/games/[id]/payment`, `/games/[id]/chat`, `/my-games`, `/profile/[id]`, `/help`, `/notifications`, `/tournaments`, `/tournaments/[id]`, `/community` (social feed + players)
- Organizer: `/organizer/dashboard`, `/organizer/create`, `/organizer/games/[id]/manage`, `/organizer/games/[id]/payments`, `/organizer/tournaments`, `/organizer/tournaments/create`, `/organizer/tournaments/[id]/manage`
- Organizer hubs: `/organizers/[id]`
- Admin: `/admin/tickets`, `/admin/tickets/[id]`

## Admin Access

Grant the admin role via the Supabase SQL editor (clients cannot self-promote —
the `protect_profile_role` trigger blocks it):

```sql
update public.profiles set role = 'admin' where id = '<user-uuid>';
```

Admins get the ticket dashboard at `/admin/tickets`: filter/sort/search tickets,
change status, reply to users, and leave internal notes (hidden from users by RLS).

## Payment Security

- PayMongo webhooks are signature-verified (`lib/paymongo/verify-signature.ts`).
- Card payments run through PayMongo's hosted Checkout Sessions, which apply
  3D Secure automatically.
- Payment endpoints (top-up, wallet pay, payout) are rate limited (5 attempts /
  10 min per user) and every attempt is logged to `payment_attempts` with
  anomaly flags (failure streaks, high-value attempts from new accounts) for
  admin review.

## Performance Monitoring

Use the Supabase Dashboard → Reports → Query Performance (pg_stat_statements)
to find slow queries. Hot list queries are covered by indexes (see
`20260610000200_admin_tickets_payment_security.sql`); list endpoints paginate
with range queries.

## Current Limitations

- Tournament entry fees are informational in v1 (no checkout on team registration).
- Social feed media is link-based in v1 (no direct upload).
- Wallet payout execution is manual approval workflow (no automatic payout rail).

## Launch Checklist

- Run `supabase/RUN_ALL_IN_SUPABASE.sql`, then `SUPABASE_AUDIT.sql` or `/api/health` shows no `MISSING`.
- Verify Auth providers (Phone/SMS, social) are configured as intended.
- Enable **Authentication → Passkeys** in the Supabase Dashboard (Relying Party ID = your bare domain, Origins = production + localhost).
- Verify PayMongo secret + webhook secret are correct in deployment env.
- Run `npm run build` before release.
- Smoke-test key flows: guest gate, signup/login, join/pay, organizer manage, help tickets, notifications.
