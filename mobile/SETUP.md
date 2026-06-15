# Rondo Mobile — Setup

The mobile app (Expo / React Native) talks **directly to your Supabase project** for
auth, reads, and most writes, and calls the **Next.js API routes** for the few
service-role operations (wallet payment, top-up, online checkout via PayMongo).

## 1. Environment variables

Copy `.env.example` → `.env` and fill in:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
EXPO_PUBLIC_API_URL=https://your-deployed-nextjs-app.vercel.app
```

- The first two come from your Supabase project (Settings → API). They are the
  **same** values the web app uses as `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- `EXPO_PUBLIC_API_URL` is wherever your Next.js app is deployed (or your LAN dev
  URL like `http://192.168.x.x:3000` while developing). Only the wallet/payment
  screens use it.

Without these, the app still **boots** (placeholder client) so you can browse the
UI, but no real data loads.

## 2. Database

The schema lives in `../supabase`. If you haven't already, run the migrations
against your Supabase project (SQL editor or CLI). The combined file
`../supabase/RUN_ALL_IN_SUPABASE.sql` applies everything.

The app reads/writes these tables with RLS: `profiles`, `games`, `teams`,
`game_players`, `game_waitlist`, `announcements`, `messages`, `direct_messages`,
`wallet_transactions`, `payout_requests`, `notifications`, `follows`,
`tournaments`, `tournament_teams`, `tournament_matches`, `posts`, `post_likes`,
`post_comments`, `player_reels`, `reel_likes`, `scout_shortlists`,
`support_tickets`, `organizations`.

## 3. Seed data (optional but recommended)

The app shows empty states until there's data. Use the web app's
`POST /api/seed` route (or create a game/tournament from the organizer flow once
signed in) to populate it.

## 4. Auth note (phone OTP)

Sign-up uses Supabase **phone OTP** (`signInWithOtp` / `verifyOtp`). Enable the
**Phone** auth provider in Supabase (Authentication → Providers) and configure an
SMS provider (Twilio, etc.), or use Supabase's test numbers for development.

## 5. Mobile → API auth bridge

The web `lib/supabase/server.ts` was updated to read an `Authorization: Bearer
<access_token>` header, so the existing API routes authenticate mobile requests
(the app sends the Supabase session token automatically — see `lib/api.ts`).

## 6. Run

```bash
npm install --legacy-peer-deps
npx expo start      # scan the QR with Expo Go (iOS), or --tunnel across networks
```
