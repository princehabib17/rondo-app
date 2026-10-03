# Onboarding & account UX — work list

Ordered backlog so we can ship one item at a time. **Intended user flow** is listed first; **build order** follows what we agreed to tackle first.

## Current baseline (mobile)

| Area | Today |
| --- | --- |
| First screen | `welcome` — static image + Get Started / Sign in / Guest |
| Auth | `signup` → optional `otp` → `onboarding/role` |
| Onboarding | role → profile (name/username/photo) → location → skill |
| Progress | 4 yellow segment bars on role/profile/location/skill only |
| Account | Sign out on profile; **no** delete-account or switch-account |
| Splash / loading | Spinner on `index`; no branded loading animation, no video |
| Missing fields | gender/sex, birth date (ruler), notification permission screen, dedicated crop UX beyond system editor |

---

## Intended user flow (screens)

1. **Splash / first screen** — branded loading + video
2. **Intro slides** — Find your level → Find players near you → Win tournaments
3. **Create account**
4. **Gender / sex**
5. **Level**
6. **Username**
7. **Profile photo** (with crop)
8. **Birth date** (iOS-style ruler / drum picker)
9. **Enable location**
10. **Enable notifications**
11. Done → main app

Shared chrome on every onboarding step after splash: **progress bar** showing how far through the flow they are.

Account settings (post-onboarding, always available):

- **Delete account** — obvious, hard to miss
- **Switch account** — obvious, hard to miss

---

## Build order (work one by one)

### 1. Intro onboarding slides
Value prop carousel before account creation.

- Slide copy direction: **Find your level** · **Find players near you** · **Win tournaments**
- Full-bleed visuals; one headline + one short line per slide
- CTA into create-account / get started

### 2. Loading animation
Branded loading state (replace bare spinner where the app boots or transitions through onboarding).

### 3. Progress bar on every onboarding screen
Single shared progress component; fill updates per step so the whole flow feels continuous (not only role→skill).

### 4. Account delete — make obvious
Clear destructive path in account/settings (confirm + irreversible warning). Not buried under Sign out.

### 5. Account switch — make obvious
Clear entry to sign out / add or switch to another account from profile/settings.

### 6. Splash video
Video on splash **or** the first screen users see (welcome / cold open). Loops or plays once into intro slides.

### 7. Gender / sex screen
Dedicated onboarding step (one job, one CTA).

### 8. Level screen
Dedicated skill/level step (can evolve from today’s skill screen; keep it single-purpose).

### 9. Username screen
Dedicated username step (split out of the current combined profile form).

### 10. Profile image + crop
Photo pick with an explicit crop step (square avatar), not only the default system editor if we need fuller control.

### 11. Birth date — iOS ruler
Drum / ruler-style date picker (iOS feel) on its own screen.

### 12. Enable location screen
Permission explainer + system prompt (evolve today’s location step).

### 13. Enable notifications screen
Permission explainer + system prompt (new).

### 14. Create account screen
Polish / place create-account correctly in the new flow (after intro slides, before profile questions).

---

## Suggested next move

Start **#1 Intro slides** on mobile: new route(s) before `signup`, three slides with the copy above, then hand off to create account.

When #1 is done, check it off here and move to #2.
