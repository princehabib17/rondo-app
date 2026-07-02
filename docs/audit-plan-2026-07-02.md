# Rondo App — Codebase Audit & Remediation Plan (2026-07-02)

Audit of the web app (app/, components/, lib/, proxy.ts) plus lint state of mobile/.
Baseline at audit time: TypeScript clean, 43/43 tests passing, ESLint 0 errors / 33 warnings.

## Findings (prioritized)

### P0 — Security

**F1. Seed endpoints fail open without `SEED_SECRET`**
`app/api/seed/route.ts:60-66`, `app/api/seed/organizers/route.ts`
Both routes only require the Bearer token *if* `SEED_SECRET` is set. If the env var
is missing, any unauthenticated caller can invoke them (proxy.ts exempts `/api/seed`
from auth). They use the service-role client to create auth users with published
passwords (`Test1234!`, `OrganizerSeed123!`) and overwrite matching profiles.
**Fix:** fail closed — return 503 when `SEED_SECRET` is not configured; keep the
Bearer check when it is.

**F2. Private-match approval can be bypassed on join**
`app/api/matches/join/route.ts:7-11`
The client picks its own `payment_status` (`pending_approval` | `reserved` | `venue`).
Product semantics (`lib/match/rules.ts:requiresApproval`) say private games require
organizer approval, and the waitlist routes enforce it (`needsApproval = is_private`),
but the join route fetches `is_private` and never uses it — any signed-in user can
send `"reserved"`/`"venue"` for a private game and skip approval entirely.
**Fix:** server derives the status — when `game.is_private`, force
`payment_status = "pending_approval"` regardless of the request body (on both the
insert and the already-joined update path).

### P1 — Correctness / robustness

**F3. Join capacity check is not atomic**
`app/api/matches/join/route.ts:36-107`
The comment claims the capacity check is "transaction-safe", but it's
check-then-insert; two concurrent joins can both pass the count and oversell the
match (the unique constraint only prevents duplicates, not overflow).
**Fix (no migration):** after insert, re-count; if over `max_players` (or per-team
cap), delete own row and return 409. Long-term: move to an RPC like
`pay_match_with_wallet`.

**F4. Webhook dedup is check-then-insert**
`app/api/payments/webhook/route.ts:44-61`
Duplicate detection reads `webhook_events` then inserts at the end of processing.
Two concurrent deliveries of the same event both pass the check and both process.
Top-ups are partially guarded by `hasTopUpBeenCredited`, but that is itself
check-then-insert.
**Fix:** insert the event id first and treat a 23505 unique violation as
"duplicate, ack and exit"; process only after owning the insert.

**F5. Guest account creation is unauthenticated and unlimited**
`app/api/auth/guest/route.ts`
Public (exempted in proxy.ts) and creates a real Supabase auth user per call, with
no rate limiting — trivially abusable to flood the auth table.
**Fix:** add a lightweight per-IP throttle (best-effort in-memory limiter; note
serverless limitation in a comment).

**F6. `pay-game` doesn't 404 on missing game**
`app/api/wallet/pay-game/route.ts:36-46`
A null game silently records a 0-amount payment attempt and proceeds to the RPC.
**Fix:** return 404 before the anti-fraud check when the game doesn't exist.

### P2 — Hygiene

**F7. 33 ESLint warnings** (8 in the web app, 25 in `mobile/`): unused
imports/vars, two `jsx-a11y/alt-text` on `<Image>` in
`mobile/app/organizer/create/index.tsx`, `react-hooks/exhaustive-deps` in
`app/(player)/games/[id]/confirmed/page.tsx` and two mobile `useMemo` cases.
**Fix:** drive to zero warnings without behavior changes.

### Reviewed, no action needed

- `payments/confirm` verifies session metadata against the caller — OK.
- `tournaments/[id]/result` enforces organizer ownership — OK.
- Direct PayMongo match checkout is intentionally disabled (410, wallet-only).
- Realtime channel cleanup is centralized in `lib/realtime.ts` — balanced.
- No service-role usage or `dangerouslySetInnerHTML` in client components.
- `account/delete`, tournament start/register authz — OK.

## Execution plan (Sonnet subagents, disjoint file scopes)

- **WP1 — Security & API correctness** (F1, F2, F3, F5, F6): `app/api/seed/*`,
  `app/api/matches/join/route.ts`, `app/api/auth/guest/route.ts`,
  `app/api/wallet/pay-game/route.ts`; also clears the `_org` unused-var warning in
  the seed organizers file it owns. Adds unit tests where logic is extractable.
- **WP2 — Webhook idempotency** (F4): `app/api/payments/webhook/route.ts` only.
- **WP3 — Lint zero-warnings** (F7): everything except files owned by WP1/WP2.

Verification gate after all packages land: `eslint` (0 warnings), `tsc --noEmit`,
`vitest run` all green.
