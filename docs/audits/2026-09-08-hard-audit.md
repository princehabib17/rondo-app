# Hard audit — Rondo production — 2026-09-08

Read-only re-audit of **https://rondo-app.vercel.app** after PRs #47/#48.
Pixels and journeys only. No product edits in this branch.

Evidence:

- Shots: `.agents/skills/_evidence/2026-09-08T09-53-25/` — 48 captures, 8 routes × 320/390/768
- G8 500ms: `.agents/skills/_evidence/2026-09-08-g8-500ms/`
- J1 guest: `.agents/skills/_evidence/2026-09-08T09-54-46/`
- J3 signup: `.agents/skills/_evidence/2026-09-08T09-54-55/`
- J2 join: `.agents/skills/_evidence/2026-09-08T09-55-04/`

What still holds from the last pass: community is public, primary buttons are sentence-case gold, phone placeholder is `09xx xxx xxxx`, MATCHDAY SHELF is gone, guest no longer hangs forever.

What does not hold: guest still cannot enter the app, Get code still does not send SMS, the city is still empty, the feed last CTA is still clipped by BottomNav.

---

## SAVAGE VISUAL — Rondo — 2026-09-08

Score: **58/100 → NOT SHIPPABLE**
Evidence: `2026-09-08T09-53-25`, 48 captures across 8 routes × 3 viewports. G6 320: no page horizontal scroll.

### KILL

1. Feed last CTA is clipped by BottomNav at the 390 fold — `14-feed-390-fold.png` / `14-feed-390-full.png` — gold “Browse tournaments” on Around You is cut in half by the floating nav. Same at 320 (`13-feed-320-fold.png`). `AppShell` padding `pb-[calc(8rem+…)]` is not enough for two `EmptyState` cards with `py-12`. Fix: shrink empty-state padding or raise shell padding until the last primary sits fully above the nav.
2. `/otp` with no phone number claims “We sent a code to **your phone**” and the field placeholder is `1 2 3 4 5 6` — reads as a pre-filled code — `20-otp-390-fold.png`. `app/(auth)/otp/page.tsx` ~106–116. Fix: require a phone in the query, show the actual number, use an empty boxed OTP, not a fake code.
3. Login has no single primary action — `08-login-390-fold.png`. Passkey first, then “Or continue with”, Phone/Email, gold Send code, guest tiles, then a second “Or continue with” for social. `app/(auth)/login/page.tsx` ~201–336 + `components/auth/SocialLoginButtons.tsx` ~33. Fix: one primary (phone), everything else one quieter cluster.
4. Community shows two identical gold **Sign up** buttons on an empty feed — `11-community-390-fold.png`. `app/(player)/community/page.tsx` 281 and 304. Fix: one CTA.

### FIX

- Gold used as Scout chip, “My matches” link, “Street map” link, Browse CTA, and selected nav pill on one screen (`14-feed-390-fold.png`). G1. Keep gold for the one primary per view.
- Quezon chip clipped at the map chip row (`23-feed-map-390-fold.png`). G7. Last chip must fully fit or the row must show a fade + scroll affordance.
- ALL-CAPS empty titles via `.rondo-title` / `.rondo-hero-title` / `.rondo-label` (`app/globals.css` 270–284, 408–412) — NOTHING BOOKED, QUIET AROUND HERE, NO POSTS YET, NO GAMES ON THE MAP, ENTER CODE. G10.
- Tournaments lives off the player tab bar (`components/layout/BottomNav.tsx` 29–59 — calendar is `/my-games`). Visiting `/tournaments` lights up nothing (`17-tournaments-390-fold.png`).
- Empty tournaments copy says “Start one”; the button says “Explore matches” (`app/(player)/tournaments/page.tsx` 171–181). Those are opposite actions, and Explore matches returns to the empty feed.

### POLISH

- Landing, login, and product chrome share a mark and gold, but the cinematic full-bleed home and the black card stack do not feel like one app. G12.
- Community empty photo is directed; feed/map empty states are a soccer-ball icon on a void. Uneven.

Gates: G1 −8 · G2 −10 · G7 −10 · G10 −6 · G12 −8. G3/G4/G5/G6/G8/G9/G11 not deducted (empty states have CTAs; 320 no page hscroll; 500ms home is painted, feed shows LOADING + chrome not a blank frame; no broken images).

One good thing: home hierarchy is clear — gold Create account, Log in secondary, guest quiet — and the sentence-case gold buttons from #47 held.

---

## FLOW AUTOPSY — Rondo — 2026-09-08

Journeys run: 3 | completed to football: 0 | abandoned: 3
Score: **60/100 → USER-HOSTILE**

`POST https://rondo-app.vercel.app/api/auth/guest` returns **200**. The **browser** still cannot sign in as guest. Server keys work; the published `NEXT_PUBLIC` Supabase client does not.

### Per journey

**J1 Cold open → joinable match — ABANDONED at guest (1 tap / 8.2s)**
Evidence: `j1-guest-03-after-wait.png`, `j1-guest.webm`
- Tap Continue as guest.
- Button goes to “Opening feed…”, then red: *“Auth service is unreachable right now. Check that the Supabase project is live and the app URL keys are up to date.”*
- Still on `/`. Never a match card. F1, F5, F10.

**J2 Guest → join — ABANDONED at empty city (2 taps / 6.9s)**
Evidence: `j2-join-01-feed-ready.png`, `j2-join-04-join-attempt.png`, `j2-join.webm`
- `/feed` is NOTHING BOOKED / QUIET AROUND HERE; Around You CTA clipped.
- Browse tournaments → ALL·0 / OPEN·0 / LIVE·0 / COMPLETED·0.
- The word “Join” in “Join open brackets…” stole the tap. No joinable match exists. F1, F3.

**J3 Signup → phone code — ABANDONED at SMS (1 tap / 8.6s); dumped into role**
Evidence: `j3-signup-04-after-get-code.png` (Sending code…), `j3-signup-05-after-wait.png` (HOW WILL YOU USE RONDO?), `j3-signup.webm`
- Name + `09171234567` + Get code.
- Never `/otp`. Never an SMS. Lands on role select. This is the `/api/auth/phone` email/password fallback, not phone login. F4, F5.

**J4 Find → join → pay** — not runnable. No games.
**J5 Organizer create** — not runnable. Guest cannot enter; no organizer session.

### KILL

1. Guest is dead on production despite a live guest API — J1 end frame. Align Vercel `NEXT_PUBLIC_SUPABASE_URL` + anon key with the live project, enable Anonymous auth or make `signInWithPassword` after `/api/auth/guest` actually reach that project.
2. Get code does not send SMS — J3. `app/(auth)/signup/page.tsx` 81–118. Do not sign the user in on OTP failure. Stay on `/otp` or show “phone login isn’t on yet” — never pretend a code was sent.
3. There is no joinable match in the published city — J2. Feed, tournaments, and map are empty loops.

### FIX

- Guest error copy names Supabase and “app URL keys” (`lib/auth/format-auth-error.ts` 27–28). Say the app can’t reach login, offer Create account.
- Role interrogation before any football (`app/(onboarding)/onboarding/role/page.tsx`). Player copy says “court”.
- “Opening feed…” / “Sending code…” lie about the outcome (guest never opens; code never sends).

### POLISH

- Player nav has no Tournaments tab, so the main empty-state CTA dumps you onto an unhighlighted route.

---

## HALLMARK AUDIT — production pixels + named files

Do not edit. Do not redesign.

```
[critical] Full-viewport centred hero — app/page.tsx:39-80
  min-h-[100dvh] cinematic still, one line (“FIND GAMES NEAR YOU.”), stacked CTAs. The default LLM landing.
  → Hero height = content. Bias the type. Put a real nearby match in the frame, not just a promise.

[critical] Italic headers — app/(onboarding)/onboarding/role/page.tsx:159
  “FIND MY NEXT GAME” / “RUN BETTER GAMES” are font-black italic uppercase. Hallmark gate 38a.
  → Roman headers. Weight or gold, not italic display.

[critical] Pure black, pure white — app/globals.css + every product capture
  Pitch-black pages with white stencil type. Flat, synthetic, same on login/feed/otp.
  → Tint the ground toward the gold anchor. Keep contrast; drop #000.

[critical] Honest copy / OTP lie — app/(auth)/otp/page.tsx:105-116
  “We sent a code to your phone” + placeholder “1 2 3 4 5 6” with no number in the URL.
  → No screen may claim a code was sent unless it was. Empty OTP boxes. Show the number.

[critical] Honest copy / fake phone login — app/(auth)/signup/page.tsx:81-118
  Get code signs the user in via email/password fallback and skips /otp.
  → Failure of signInWithOtp stays on signup with a true error. No silent account.

[critical] Empty product — feed, tournaments, map, community captures
  A football app with zero matches, zero tournaments, zero map pins, zero posts.
  → Seed the published city or the marketing line “Find games near you” is a lie.

[major] Duplicate “Or continue with” — app/(auth)/login/page.tsx:229 + components/auth/SocialLoginButtons.tsx:33
  Same divider twice on one screen.
  → One divider, one cluster of alternatives.

[major] Duplicate primary CTA — app/(player)/community/page.tsx:281,304
  Two gold Sign up buttons on the same empty view.
  → One.

[major] Accent as five jobs — components/feed/HomeSections.tsx + BottomNav + Scout chip
  Gold = primary button, text links, scout chip, selected nav.
  → One semantic role per screen.

[major] ALL-CAPS body — components/rondo/primitives.tsx:254 + app/globals.css:270-284
  Empty-state titles forced uppercase via .rondo-title.
  → Sentence case for empty states. Display caps only on the true hero.

[major] Tab mismatch — components/layout/BottomNav.tsx:48-52 vs /tournaments
  Tournaments is a destination with no selected tab.
  → Highlight Matches or add the route the CTA actually opens.

[major] CTA contradicts body — app/(player)/tournaments/page.tsx:175-181
  “Start one” vs button “Explore matches”.
  → If they can start one, the button starts one. If they cannot, stop saying start.

[major] Chip clip — 23-feed-map-390-fold.png
  Quezon cut off at the viewport edge.
  → Fade + pan, or fewer chips.

[major] Wrong sport in copy — app/(onboarding)/onboarding/role/page.tsx:24
  “get back on the court” under football footage.
  → Pitch. Not court.

[minor] Card-in-card — community guest banner inside a surface plus empty-state surface
  Two stacked gold CTAs in nested cards.
  → One containment layer.

[minor] Loading shout — feed 500ms frame
  Tiny “LOADING” in tracked caps on a void.
  → Skeleton of the two home cards, not a word.

[minor] Join copy steals taps — app/(player)/tournaments/page.tsx:119
  “Join open brackets…” is the only “Join” on an empty page; the runner hit it.
  → Don’t put Join in dead prose when there is nothing to join.
```

Summary — **6 critical · 8 major · 3 minor**
Verdict — **ships as slop** (template landing + italic headers + lying auth) **and user-hostile** (cannot guest, cannot SMS, cannot see a match).

---

## Ranked ship-blockers

1. Guest fails in the browser while `/api/auth/guest` is 200 — published client keys / Anonymous provider.
2. Get code does not SMS; it creates a session and skips OTP.
3. Published city has no joinable match — J1 and J2 cannot complete.
4. Feed Around You CTA clipped by BottomNav.
5. `/otp` lies (“your phone” + fake `1 2 3 4 5 6`).
