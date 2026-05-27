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
2. Configure `.env.local` (copy from `env.example` and fill values).
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

In the Vercel project **Settings → Environment Variables**, add every variable from `env.example` for **Production** (and Preview if you use it). Then **Redeploy** the latest commit.

Set `NEXT_PUBLIC_APP_URL` to your production URL, e.g. `https://rondo-app.vercel.app`.

PayMongo webhook URL: `https://rondo-app.vercel.app/api/payments/webhook`

## Database / Migrations

Run SQL migrations in Supabase SQL editor (or your normal migration flow), including:

- `supabase/migrations/20250523000000_security_hardening.sql`
- `supabase/migrations/20260527000100_organizer_broadcasts.sql`
- `supabase/migrations/20260527000200_phase2_states_and_support.sql`
- `supabase/migrations/20260527000300_wallet_notifications.sql`
- `supabase/migrations/20260527000400_profile_onboarding_fields.sql`

## Main User Journeys

- **Auth**
  - New user: welcome -> signup -> otp -> onboarding -> feed
  - Returning user: login -> feed
  - Guest: feed browsing only, gated on action routes
- **Player**
  - Browse feed/map -> open game -> join/reserve/pay -> confirmed -> invite/chat
  - View profile wallet summary + matches
  - Submit and track help tickets
- **Organizer**
  - Create/manage games, assign teams, update statuses
  - Post organizer-room broadcasts
  - View game payments breakdown
  - Submit payout requests

## Screens / Route Highlights

- Player: `/feed`, `/feed/map`, `/games/[id]`, `/games/[id]/join`, `/games/[id]/payment`, `/games/[id]/chat`, `/my-games`, `/profile/[id]`, `/help`, `/notifications`
- Organizer: `/organizer/dashboard`, `/organizer/create`, `/organizer/games/[id]/manage`, `/organizer/games/[id]/payments`
- Organizer hubs: `/organizers/[id]`

## Current Limitations

- Tournament module is deferred.
- Social feed posts/highlights are deferred.
- Ticket admin dashboard is manual in v1.
- Wallet payout execution is manual approval workflow (no automatic payout rail).

## Launch Checklist

- Verify all migrations are applied in Supabase.
- Verify Auth providers (including anonymous) are configured as intended.
- Verify PayMongo secret + webhook secret are correct in deployment env.
- Run `npm run build` before release.
- Smoke-test key flows: guest gate, signup/login, join/pay, organizer manage, help tickets, notifications.
