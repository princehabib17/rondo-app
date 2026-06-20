# Run Rondo locally

## Web app

1. Open terminal in this folder.
2. Run: `npm run dev`
3. Open: http://localhost:3000

Your keys are in `.env.local` (do not commit that file).

## Mobile app

1. Open terminal in this folder.
2. Run: `npm run mobile:install`
3. Copy `mobile/.env.example` to `mobile/.env` and fill the Expo values.
4. Run: `npm run mobile:start`

The mobile app is a separate Expo project in `mobile/`. It does not run inside
the Next.js dev server.

## Online payments (no webhook needed on your laptop)

After you pay on PayMongo, the app checks PayMongo automatically and marks you as paid.

## One-time database setup (Supabase)

In Supabase → SQL Editor, run the file:
`supabase/migrations/20250523000000_security_hardening.sql`

Without this, some features may error.

## Guest sign-in (one-time in Supabase)

Authentication → Providers → **Anonymous** → Enable.
