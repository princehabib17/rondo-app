# Mystery-Shopper Audit — Organizer Journey

**Shopper brief:** I signed up to run 5-a-side games. I'm judging Rondo the way I'd
judge a venue I'm about to trust with my money — first impressions, whether I ever
feel lost, and whether it looks *built* or *assembled*. Slop is the cardinal sin.
Every finding below is backed by a file:line or a captured screenshot; nothing is
vibes.

**Method:** walked Landing → Signup → Login → Feed → Tournaments → Organizer
Dashboard → Payout at 320/390/768px. Graded against three rubrics already in this
repo: Hallmark slop gates (`.agents/skills/hallmark`), the Matchday design system
(`docs/rondo-design-system.md`), and savage-visual's hard gates.

**Environment caveat (itself a finding — see D0):** run with placeholder Supabase
creds. Data-backed routes (`/feed`, `/tournaments`, `/organizer/*`) throw
`fetchOpenGames failed: TypeError: fetch failed` and the dev server drops the
connection mid-navigation. A real first-time organizer with a flaky connection
sees the same white "can't be reached" frame I did. Evidence:
`scratchpad/rondo-feed.png` (empty feed), Chrome error frames captured for
`/login` and `/signup`.

---

## Verdict

**Store rating: 2.4 / 5 — "promising brand, unfinished shop floor."**

The identity is genuinely strong (floodlit black + gold, condensed jersey type).
But the moment I try to *operate* as an organizer, three things break the spell:
the app tells on itself with AI-slop tells, it dumps five different jobs onto one
screen, and it has visible runtime errors. A perfectionist does not ship a
dashboard that says "Create Match" five times.

---

## Findings, ranked by damage

### 🔴 KILL

**S1 — Italic display headings everywhere = the #1 AI-slop tell.**
The organizer dashboard sets its hero name, earnings figure, "Next up", "Your
Games", and the empty state all in `uppercase italic` Barlow
(`app/(organizer)/organizer/dashboard/page.tsx:167,171,228,253,281` — 7 occurrences;
payout page has 2 more). Hallmark gate **38a** names italicised display type as one
of the most reliable machine-made signatures. It reads as auto-generated, not
art-directed.
*Fix:* headings go roman (`font-style: normal`). Carry emphasis with weight and the
gold accent, never slant. This is a find-and-delete of `italic` on every heading.

**S2 — "Everything on one screen" — the exact complaint, proven.**
The dashboard renders the launch points for *four unrelated journeys* — Create
Match, Tournaments, Organizations, Payout — as one undifferentiated pill row
(`dashboard/page.tsx:187–212`), and "Create Match" / `create/match` appears **5
times on this single screen** (lines 151, 189, 258, 288, plus the header +Create).
Cashout is demoted to the 4th pill in a horizontal scroll — money, hidden behind a
sideways swipe. There is no sense that creating a tournament is a *decision with its
own path*; it's a link in a scroll strip.
*Fix (already planned):* three cinematic "journey doors" (Match / Tournament /
Organization), each full-bleed and opening its own step-by-step flow; earnings
becomes its own Wallet screen where cashout is the hero, not a pill. One primary
action per screen (savage-visual G2).

**S3 — Live motion bug in production code.**
`components/layout/BottomNav.tsx:151` animates `scale: [1, 0.82, 1.08, 1]` with a
spring. Motion supports **two keyframes max** with springs — this throws
`Only two keyframes currently supported…` in the console on every relevant render
(captured in `scratchpad/devserver.log`). The bottom nav is the one element on
literally every screen. A mystery shopper opening devtools sees an error on tap one.
*Fix:* two-keyframe tween (`[1, 1.06]` back to rest) or drop to a plain
`:active scale(.97)`; per Emil, a 100×/day control should barely animate anyway.

### 🟠 FIX

**S4 — Raw hex bypasses the token system, on the highest-traffic screens.**
`bg-[#050505]` is hard-coded on both the dashboard (`:143`) and payout (`:page`),
alongside a zoo of `bg-white/[0.03]`, `border-white/6`, `text-white/40`. The repo
*has* a token system (`--bg-page`, ink levels) and now a written spec
(`docs/rondo-design-system.md`) — this screen ignores both. This is why the app
"has no design system": the tokens exist, the screens freelance.
*Fix:* map every raw hex and ad-hoc `white/NN` to `--bg-page` / `--bg-surface` and
the three ink tokens.

**S5 — Off-scale spacing and radius, per the app's own law.**
`text-[3.25rem]`, `tracking-[0.26em]`, `tracking-[0.22em]`, mixed
`rounded-xl/2xl/3xl`, `px-5` gutters (the rest of the app uses `px-4`). The Matchday
system allows 3 radii + pill and one spacing scale; the dashboard uses arbitrary
values that appear nowhere else, so nothing lines up between this screen and the
feed.
*Fix:* snap to the scale — `px-4` gutter, `--r-md` cards, Display/Title type roles.

**S6 — Empty state is a dashed void, not art direction.**
The "No games yet" state (`dashboard/page.tsx:274–293`) is a dashed-border box with
two lines of text. savage-visual gate G4: an empty state must be art-directed. For
an organizer's *first ever* screen — the highest-intent moment — this is flat.
*Fix:* floodlight CSS scene + one confident CTA (the Matchday empty-state recipe).

**S7 — `next/image` quality warnings flood the console.**
Every organizer logo requests `quality={95}` while `images.qualities` is `[75]`
(`devserver.log`, repeated for `football-amigos.png`, `elitepro.png`,
`futsal-mnl.png`…). On current Next this degrades the image and logs a warning per
asset.
*Fix:* add `qualities: [75, 95]` to `next.config.ts` (one line) or drop the prop.

### 🟡 POLISH

**S8 — Two gold weights fight.** `--color-rondo-accent` (oklch 92%/0.16) and a
stray `--color-rondo-gold #D4A574` are both "gold" but different hues; the design
system already flags retiring the stray. Pick one.

**S9 — Greeting hero burns the whole first screen on a name.** The `3.25rem`
"Organizer" + earnings eats the fold before any *action* appears — pretty, but the
shopper's first question ("what do I do here?") is answered below the fold.

---

## What's genuinely good (kept short, on purpose)

The black-and-gold identity, the condensed type *when upright*, and the
image-first game cards are real assets. The bones are there. The problem is
finish, not concept.

---

## Recommended repair order (small, reviewable commits)

1. **S3 + S7** — the two objective bugs (motion keyframes, image qualities). Tiny,
   ship immediately.
2. **S1** — strip italics from all headings, app-wide. Mechanical, huge slop win.
3. **S4 + S5** — token/scale sweep on dashboard + payout.
4. **S2 + S6** — the structural rebuild: journey doors + Wallet screen + art-directed
   empty state (the visual, one-journey-per-screen direction already planned).

Re-audit with savage-visual once the backend is real, so findings rest on pixels,
not placeholder-crashed frames.
