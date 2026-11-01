# Rondo skill audit — 2026-09-06

Target: published site `https://rondo-app.vercel.app` (master).
Skills: savage-visual, flow-autopsy, hallmark audit.
Evidence: `.agents/skills/_evidence/2026-09-06T07-57-01` (36 shots) plus flow dirs `07-58-11` / `07-58-17` / `07-58-23`.

---

## SAVAGE VISUAL — Rondo — 2026-09-06

Score: **44/100 → NOT SHIPPABLE**
Evidence: 36 captures across 6 routes × 3 viewports (320 / 390 / 768). No horizontal scroll.

### KILL

1. **Guest auth hangs.** Home “Continue as guest” stays on “OPENING FEED”; signup stays on “Opening guest access…”. Never reaches a joinable match. — `audit-j1-guest-hang.png` / `audit-j2-guest-hang.png` — fix: fail the guest path in <2s with a human error when Supabase is down; do not spin forever (`lib/auth/guest.ts`, `app/page.tsx`).
2. **`/community` is the login screen.** Same pixels as `/login`. Guest browse is a lie. — `audit-community-is-login.png` vs `audit-login-390.png` — fix: make `/community` public like `/feed`, or show an honest gate that keeps `next=/community`.
3. **Signup primary looks disabled.** “GET OTP” is `variant="secondary"` — dark brown-grey on black. First-time users will not tap it. — `audit-signup-390.png` — fix: `RondoButton variant="primary"` in `app/(auth)/signup/page.tsx:156`.

### FIX

4. **Gold used in too many roles on one screen** (G1 −8). Login: tab fill, SEND OTP, Create account link, Watch highlights tile, logo mark. — `audit-login-390.png` — fix: gold = one action pulse only; tabs/links/tiles go ink.
5. **Phone placeholder reads as a filled number** (G3/F5). Send OTP on empty field shows “Enter a valid phone number with country code” while `+63 917 123 4567` looks typed. — `audit-j6-otp-error.png` — fix: use a dimmer placeholder (`09xx…`) or a real empty state.
6. **Feed empty CTA clipped by bottom nav** (G7 −10). Second “BROWSE TOURNAMENTS” sits under the tab bar. — `audit-feed-390.png` — fix: pad the last card above BottomNav.
7. **ALL-CAPS chrome** (G10 −6). Headlines, buttons, section labels, empty titles. — every 390 capture — fix: sentence case on body/actions; keep caps for 1–2 labels max.
8. **Tournaments hero is a different product** (G12 −8). “MATCHDAY SHELF” / “CITY BRACKET BOARD” / three zero-stat tiles vs Rondo home. — `audit-tournaments-390.png` — fix: same wordmark + one live number or drop the fake board.

### POLISH

9. Accent still reads mustard/tan, not Matchday yellow `#e8d24a`, on production CTAs. — `audit-home-390.png`
10. Facebook social control is a blue square; Apple/Google are outlined circles. — `audit-login-390.png`
11. Log in on landing is a small ghost under a huge primary (G5). — `audit-home-390.png`

One good thing: 320px does not horizontally scroll; landing photo + “Find games near you.” is a clear job.

---

## FLOW AUTOPSY — Rondo — 2026-09-06

Journeys run: 3 scripted + 3 blocked | completed: 0 to value | abandoned: 6
Score: **52/100 → USER-HOSTILE**

| J | Result |
|---|---|
| J1 Cold open → joinable match | **ABANDONED** at guest hang. 1 tap / 5.8s. Still on home, “OPENING FEED”. `audit-j1-guest-hang.png` / `flow-j1-guest.webm` |
| J2 Guest → join wall | **ABANDONED**. Create account (1 tap) then Continue as guest (2 taps / 5.3s). Stuck “Opening guest access…”. No `next=` wall because guest never finishes. `audit-j2-guest-hang.png` |
| J3 Signup → onboarding → feed | **NOT RUN** — guest/OTP cannot complete on production (Supabase host dead). |
| J4 Feed → join → pay | **NOT RUN** — no joinable match exists; guest cannot enter a paid path. |
| J5 Organizer create match | **NOT RUN** — organizer surface is auth-gated. |
| J6 Recovery | **PARTIAL**. Empty Send OTP → red validation (placeholder looks filled). Direct `/feed` is an empty catalog, not a recovery. 1 tap / 8.5s. `audit-j6-otp-error.png` / `audit-feed-390.png` |

### KILL

- F6/F10 guest hang, no failure within 1s. Video J1.
- F1 never saw a match with price + slots. Feed empty + guest dead.
- F3 `/community` is a login dump with no “why” and no preserved browse. `audit-community-is-login.png`

### FIX

- F5 jargon: “OTP”, “passkey”, “RPC”-grade errors on first screens. `audit-login-390.png`
- F2 community/login has no visible `next=` explanation for a first-time user.

### POLISH

- F7 landing CTAs sit in the thumb zone (good). Keep them; kill the hang.

---

## HALLMARK AUDIT

No `design.md`. One stamp: `app/(organizer)/organizer/tournaments/create/page.tsx` (`genre: app-flow`). Product screens are unstamped — **major: missing system reference** if you claim a design system; otherwise variety-drift only.

### Critical

| Tell | Where | Fix |
|---|---|---|
| Full-viewport hero (`min-h-[100dvh]`, stacked brand + title + 3 CTAs) | `app/page.tsx` 38–80 | Hero = content height; one primary, log in as text, guest as last resort after it works |
| Kitchen-sink auth (passkey + phone/email + guest tiles + social) | `app/(auth)/login/page.tsx` | One path on first paint; the rest behind “More options” |
| Dead-looking primary (secondary variant on the only submit) | `app/(auth)/signup/page.tsx` 156–158 | `variant="primary"` |
| Structural lie: community route paints login | `/community` capture | Public community or an honest gate |

### Major

| Tell | Where | Fix |
|---|---|---|
| 3-equal stat tiles (icon + 0 + label) | tournaments hero capture; tournament card chrome | Drop zeros or show one real count |
| Card-in-card empty states | feed Next Up / Around you | One surface, one CTA |
| Pure black product canvas | login/signup/feed/tournaments | Use `--bg-page` athletic light, or night tokens that are not `#000` |
| Type: ALL-CAPS as body/action voice | all auth + feed + tournaments | Sentence case |

### Minor

| Tell | Where | Fix |
|---|---|---|
| Social icon shape mismatch | `SocialLoginButtons.tsx` | One control shape |
| “MATCHDAY SHELF” dialect | tournaments header | Say Rondo |

**4 critical · 4 major · 2 minor**

---

## What this is not

J3–J5 need a live Supabase project. Production still cannot resolve `kkmokdrjoephfdopizes.supabase.co`. Until that is restored, no skill can certify signup, pay, or organizer create.
