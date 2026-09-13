# Run Rondo locally

1. Open terminal in this folder.
2. Copy `.env.example` to `.env.local` and fill in the Supabase values (do not commit that file).
3. Run: `npm run dev`
4. Open: http://localhost:3000

## One-time database setup (Supabase)

In Supabase → SQL Editor, run in this order:

1. `supabase/schema.sql` — only on a brand-new project.
2. `supabase/RUN_ALL_IN_SUPABASE.sql` — always; safe to re-run. This is the only
   migration bundle. It contains every file in `supabase/migrations/` plus
   organizations, reels, scout clips, and tournament rooms.

Check it worked: run `supabase/SUPABASE_AUDIT.sql` — every row must say `OK`.
Or, with the app running and `SEED_SECRET` set, open
`http://localhost:3000/api/health` with header `x-seed-secret: <SEED_SECRET>`.

Without the bundle, screens are empty and API routes answer
`Could not find the table 'public.…' in the schema cache`.

## Guest sign-in

Works out of the box as long as `SUPABASE_SERVICE_ROLE_KEY` is set. No dashboard
toggle is needed (the Anonymous provider is not used).

## Phone codes

Authentication → Providers → **Phone** → enable and connect an SMS provider
(Twilio, MessageBird, etc.). Until then "Get code" shows an honest error instead
of pretending a code was sent.

## Online payments (no webhook needed on your laptop)

After you pay on PayMongo, the app checks PayMongo automatically and marks you as paid.
