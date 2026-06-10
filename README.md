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

Run SQL migrations in Supabase SQL editor (or your normal migration flow), including:

- `supabase/migrations/20250523000000_security_hardening.sql`
- `supabase/migrations/20260527000100_organizer_broadcasts.sql`
- `supabase/migrations/20260527000200_phase2_states_and_support.sql`
- `supabase/migrations/20260527000300_wallet_notifications.sql`
- `supabase/migrations/20260527000400_profile_onboarding_fields.sql`
- `supabase/migrations/20260610000000_tournaments_social_feed.sql`
- `supabase/migrations/20260610000100_tournament_perf_realtime.sql`
- `supabase/migrations/20260610000200_admin_tickets_payment_security.sql`

Or run `supabase/RUN_ALL_IN_SUPABASE.sql` as one file (safe to re-run).

## Main User Journeys

- **Auth**
  - New user: welcome -> signup -> otp -> onboarding -> feed
  - Returning user: login -> feed
  - Guest: feed browsing only, gated on action routes
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

- Verify all migrations are applied in Supabase.
- Verify Auth providers (including anonymous) are configured as intended.
- Verify PayMongo secret + webhook secret are correct in deployment env.
- Run `npm run build` before release.
- Smoke-test key flows: guest gate, signup/login, join/pay, organizer manage, help tickets, notifications.
