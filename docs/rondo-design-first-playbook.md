# Rondo Design-First Playbook

**Version:** 2026-07-08  
**Supersedes design chapters of:** `rondo-perfection-playbook-2026-07-08.md` (security/data audit chapters of the earlier doc still stand)  
**Design law:** `Anti-Slop.pdf` (taste rules) + `strava-DESIGN.md` (pattern reference)  
**Palette law:** Rondo Matchday — gold-on-black. Locked. Non-negotiable.  
**Product goal:** Best tournament flow on the market.

---

## 0. TL;DR (read this if nothing else)

Rondo currently looks like a stock Next.js template with a gold accent bolted on. The screens work; they don't feel like anything. This playbook fixes that in three moves:

1. **Lock the palette, ship a real type + spacing system.** Gold-on-black stays. Typography gets promoted from decoration to the primary hierarchy tool (weight + size + tracking, not color soup). Every card, chip, and hairline snaps to a 4-point grid.
2. **Translate Anti-Slop from landing-page skill to product-app skill.** Its color/motion/copy/taste bans apply verbatim. Its layout dogma (bento diversity, zigzag cap, hero discipline) gets re-scoped: Rondo has *marketing surfaces* (landing, tournament share pages, invite links, empty states) where Anti-Slop applies raw, and *product surfaces* (feed, bracket, manage) where the spirit applies but the mechanics change.
3. **Steal Strava's patterns, not its palette.** Strava is a masterclass in "athletic data that feels alive." Take the stat grid, the activity card, the leaderboard-with-crown, the kudos tap, the segment achievement badge. Do not take the orange, the map hero, or the Maison Neue font.

**Dial reading for Rondo:** `DESIGN_VARIANCE: 7  ·  MOTION_INTENSITY: 6  ·  VISUAL_DENSITY: 5`  
(Athletic and confident; scroll reveals over pinning; dense enough to feel data-rich, breathable enough to feel premium.)

**Design Read (one-liner):** *Broadcast-graphic energy for a Sunday-league app. Every screen should feel like it belongs on a stadium jumbotron and in your pocket at once.*

---

## 1. Palette Lock — Non-negotiable

Rondo's Matchday tokens from `docs/rondo-design-system.md` are the only source of color truth. This playbook does not introduce a single new hue.

| Token | Value | Role |
|---|---|---|
| `--bg-page` | `oklch(11% 0.008 102)` | Page floor (near-black, warm) |
| `--bg-surface` | one step lighter | Cards, sheets |
| `--bg-elev` | two steps lighter | Modals, floating |
| `--gold` | `oklch(86% 0.115 96)` | Sole accent — CTAs, trophies, actives |
| `--gold-ink` | `oklch(20% 0.05 96)` | Text sitting on gold |
| `--ink` | near-white off-white | Body |
| `--ink-muted` | ~70% ink | Secondary |
| `--ink-dim` | ~45% ink | Tertiary, metadata |
| `--line` | ~12% ink | Hairlines |
| `--red-live` | tuned red | Live match dot, destructive |
| `--green-ok` | tuned green | Success, "you're in" |

**What we ban (Anti-Slop §8.B applied to Rondo):**

- Pure `#000` and pure `#fff` — Rondo's black is already warm off-black. Keep it.
- New accent colors — no blue, no orange (yes, that means no Strava orange), no teal. If a screen "needs" another color, it doesn't; hierarchy is broken elsewhere.
- Gradient text on headlines.
- Neon/outer glows. If gold needs to feel active, use a `1px inset` ring or a soft `0 0 0 3px oklch(--gold / 0.15)` focus ring, not a bloom.
- Any per-screen "theme color" (Anti-Slop's page theme lock — the whole app is one theme).

**One-accent lock:** Gold is *the* accent. On any screen, one gold thing dominates. Two golds = you have a hierarchy problem, not a color problem.

---

## 2. Anti-Slop Translation Layer

Anti-Slop.pdf is a landing-page/portfolio taste skill. It says so explicitly ("*Not dashboards, not multi-step product UI*"). We're translating, not copy-pasting.

### 2.A Applies verbatim to Rondo (all surfaces)

- **§4 Typography discipline.** Rondo currently uses Barlow Condensed + Manrope — keep both, but promote them. Barlow Condensed = scoreboard/headline duty only (numbers, team names, section rails). Manrope = everything else. No Inter fallback, no ad-hoc `font-serif`.
- **§6.A Hardware acceleration.** Animate transform + opacity only. Bracket zoom, card press, tab switch — all transform.
- **§6.B Reduced motion.** Any motion above intensity 3 wrapped in `useReducedMotion()`. Live-match pulse, bracket auto-scroll, kudos burst all collapse under reduced motion.
- **§6.C Contrast.** WCAG AA body, AAA for score numbers and CTAs. Gold on `--bg-page` currently passes AA — verify every combo in Figma before shipping.
- **§9.A Visual bans:** no neon glows, no gradient headlines, no pure black, no custom cursors.
- **§9.D "Jane Doe" effect:** Rondo already has this problem. Placeholder rosters are `Player 1`, `Player 2`. Fix: use realistic Metro Manila / futsal-scene names (`JP Alcantara`, `Kobe Nazareno`, `Migs Yulo`, `Dante Ferrer`). Placeholder avatars: generated portraits, not initials-on-a-circle.
- **§9.D Fake-perfect numbers.** No `100% attendance`, no `50 goals`. Real futsal stats are messy: `12G / 4A in 9 apps`. `3.2 goals per game`. `47.2% conversion`.
- **§9.E External resources.** Icons: standardize on **Phosphor** (already in the Next.js ecosystem, matches Rondo's rounded-but-confident personality). Ban ad-hoc SVGs. No hand-rolled trophy icons — Phosphor's `Trophy`, `Medal`, `SoccerBall`, `Whistle` cover it.
- **§9.F Production-Test Tells:**
  - No `V1.0 · BETA` in the hero/nav. Rondo has this on the landing — kill it.
  - No section-number eyebrows (`01 / Tournaments`). Rondo's Create Tournament screen has `01 Basics / 02 Rules / 03 Schedule / 04 Confirm` — this **stays** because it's a real step counter in a real form flow, not a decorative eyebrow. Distinction matters: **counting steps the user must complete = allowed. Numbering marketing sections = banned.**
  - No decorative status dots. Rondo's `LIVE` badge with a red dot **stays** — it conveys real semantic state.
  - No middle-dot spam (`Home · Feed · Tournaments · Profile` in the nav is fine as one line; `Manila · 32°C · 7:04 PM · Match ready` is banned).
  - No fake screenshots. Ban applies to the landing page — if we show the app, we show real captures or Figma-rendered PNGs, never `<div>` reconstructions.
- **§9.G EM-DASH BAN.** Zero em-dashes anywhere in Rondo copy, code strings, empty states, or push notifications. Search the repo, replace with periods, commas, or line breaks. This is non-negotiable.

### 2.B Applies with translation (product surfaces)

| Anti-Slop rule | Landing-page version | Rondo product-app translation |
|---|---|---|
| Hero discipline (max 4 elements, ≤2-line headline, ≤20-word subtext, one primary CTA) | The above-the-fold section | Every **top-of-screen block** in Rondo. Tournament detail top = badge + title + one meta line + one primary CTA (Join / Manage / Watch). Manage screen top = tournament name + state chip + one action. No stuffing three CTAs at the top. |
| Eyebrow restraint (max 1 per 3 sections) | Marketing pages | Rondo screens should have **at most one section eyebrow per scroll viewport**. Tournament detail currently has `About`, `Rules`, `Schedule`, `Standings` all as equal H2s — that's fine (they're sections, not eyebrows). But adding `TOURNAMENT · MECHANICS · RULES` above `Rules` is banned. |
| Bento diversity (never 3 equal cards) | Feature grids | Rondo's **stat surfaces** (profile stats, tournament stats, standings summary) should never render as 3 equal cards. Use asymmetric grids: one big "hero stat" + two supporting. See §5.C. |
| Zigzag cap (never more than 2 zigzags per page) | Marketing feature sections | The **community feed** should not alternate image-left/image-right/image-left as a "design move." Feed cards use one consistent layout with content variance instead. |
| Split-header ban (headline left, floater right) | Landing page section headers | Rondo screen headers = single-column. No "Tournaments" left / "Filter · Create" floater right at the top. Filters live in a sub-bar; create lives in a proper action affordance (FAB or explicit button on empty state). |
| Motion-must-be-motivated | Every animation on the page | Every animation in Rondo answers "what does this tell me?" Score change = counter tick (tells you a goal just happened). Bracket advance = arrow draw (tells you a team moved on). Skeleton shimmer = data loading (tells you something's coming). Ban decorative parallax, mouse-follow blobs, and animated backgrounds. |
| Image-gen-first asset strategy | Portfolio hero images | Rondo empty states, tournament covers, badge illustrations get **generated hero images** (via Perplexity Computer's image tool) with the Matchday palette baked in, not stock photos, not `picsum.photos`. |
| Copy self-audit ("would a real product manager say this?") | Marketing copy | Every empty state, tooltip, and toast in Rondo passes the "would a futsal captain in Mandaluyong say this in a WhatsApp group?" test. See §7. |

### 2.C Explicitly does not apply

- **Sticky-Stack sections (§5.A) and Horizontal-Pan (§5.B).** These are landing-page scrolltelling patterns. Rondo has no scrolltelling. Skip.
- **Marquee limits (max one per page).** Rondo has no marquees. Never will.
- **§9.F "Locale/weather strips banned."** Rondo's optional venue-weather line on match cards is *real, actionable data* (do I need studs? is it raining?). This is exactly the "brief explicitly about a place" exception. Weather stays, and it stays functional, not atmospheric.
- **§11 Redesign protocol.** Useful framing, but Rondo is not a redesign — it's a product still finding its visual language. Treat it as "greenfield inside an existing palette."

---

## 3. Strava Pattern Mapping (patterns only, palette stays gold/black)

`strava-DESIGN.md` gives us a proven athletic-data language. Here's the exact mapping.

### 3.A Direct pattern lifts

| Strava pattern | Strava example | Rondo application |
|---|---|---|
| **Stat grid** (big number in Maison Neue Bold, tiny muted uppercase label under) | Ride: `42.1 km / 1:47:22 / 892 m` | **Everywhere**. Tournament card: `8 teams · 3 days · ₱2,400`. Player profile: `12 G · 4 A · 9 apps`. Match cell: `3 - 2`. Standings row: `W-D-L-GF-GA-GD-Pts`. Use Barlow Condensed for the number, Manrope Uppercase 11px `--ink-dim` for the label. |
| **Activity card** (avatar+name / title / hero visual / stat row / social footer) | Post-ride social card | **Community feed card** and **tournament card**. Feed: avatar + author + `X hours ago in Y tournament` / caption / photo or bracket clip / stat row (goals? assists?) / kudos + comment count. |
| **Segment leaderboard with crown** (KOM/QOM gold crown on #1) | Segment page | **Tournament standings + Golden Boot leaderboard**. #1 gets a small gold Phosphor `Crown` glyph. #2 and #3 get thinner outlined crowns. Below top 3, no crown — just rank number. |
| **Kudos button** (thumbs, orange fill on tap, count next to it) | Every activity | **"Hyped" button on feed posts and match results**. Phosphor `Fire` icon (kicks off futsal-appropriate association). Tap = fill with gold, subtle particle burst (motion-motivated: it celebrates), count increments. |
| **PR badge / trophy** (gold ribbon overlay on a stat when it's a personal record) | Personal record on a segment | **"Cup Winner" / "Golden Boot" / "MVP" ribbons** on player profile stat tiles. Tiny gold overlay on the top-right corner of the stat card. Ties directly into the missing tournament→profile trophy loop from the previous playbook. |
| **Achievement crown** (KOM icon) | Leaderboard #1 | **Tournament Champion banner** on the tournament recap screen. Full-width, generated hero image of a trophy silhouette in gold, team name in Barlow Condensed 48px, "Champions" eyebrow, share button. This is the shareable moment. |
| **Segment attempt count** ("You've attempted this 4 times") | Below segment leaderboard | **Tournament personal record**: "You've played in 3 tournaments. Best finish: Semi-finalists." on the tournaments list empty/logged-in state. |
| **Elevation profile chart** (svg line chart tied to the ride) | Ride detail | **Match momentum chart** (future, phase 2): thin gold line chart showing goals scored over the match's 40 minutes. |

### 3.B Deliberate rejections (do NOT lift from Strava)

- Strava orange (`#FC4C02`). Rondo is gold. End of discussion.
- Maison Neue. Rondo has Barlow Condensed + Manrope; both are stronger for this brief.
- The map hero. Rondo has no maps in the tournament flow. (Venue address is a text row + one-tap "Open in Maps" — no embedded map preview cluttering the card.)
- Strava's white/canvas surfaces. Rondo is dark-first.
- Strava's `Give Kudos` copy. Ours is "Hyped" or "🔥 Hyped" (no emoji in strings — the Fire glyph is the icon, the word is `Hyped`).

---

## 4. The Three Dials Explained (For Rondo)

Anti-Slop §7 defines the dials. Here's how Rondo lands on 7/6/5.

### DESIGN_VARIANCE: 7 (Offset, leaning asymmetric)

- Tournament detail screen: hero uses asymmetric split — badge + title left, live match pill right (not centered).
- Standings row: rank number is oversized 20px Barlow Condensed while team name is 16px Manrope — deliberate size mismatch.
- Feed cards: some cards use 16:9 hero image, some are 4:3, some are text-only. Aspect ratios vary intentionally.
- **Mobile override honored (Anti-Slop §7):** below `md:` (768px, which is 99% of Rondo traffic), variance collapses. Everything becomes single-column with consistent `px-4 py-6`. We only push variance on tablet/desktop views (organizer web dashboard).

### MOTION_INTENSITY: 6 (Fluid CSS + Motion component-level, no scroll-hijacks)

- Standard easing: `cubic-bezier(0.16, 1, 0.3, 1)` for enters, `cubic-bezier(0.4, 0, 0.2, 1)` for exits. 240ms is default.
- Score change: number counter tick (Motion `animate` on `y` + opacity, staggered digits).
- Bracket team advance: SVG line draw + winner card scale from 0.98 → 1.
- Kudos tap: `scale: [1, 1.2, 1]`, gold ring `opacity: [0, 0.6, 0]`, 400ms total.
- Live match pulse: `--red-live` dot, `scale: [1, 1.15, 1]` on a 1.4s infinite loop — collapses to static under reduced motion.
- Page transitions: no full-page slide/liquid transitions. Content-level `motion.div` opacity + 8px y-offset only.
- **Banned:** parallax backgrounds, mouse-follow orbs, scroll-hijack, GSAP ScrollTrigger anywhere except the marketing landing page (which is a separate concern).

### VISUAL_DENSITY: 5 (Daily App, tuned athletic)

- Baseline card padding: `p-4` (16px). Dense screens (bracket, standings) drop to `p-3`.
- Section spacing: `py-6` (24px) between major blocks on mobile. Not `py-16`.
- All numbers in `font-mono`? **No** — Anti-Slop says cockpit-density uses mono numbers; we're at density 5. Use **Barlow Condensed with tabular figures** (`font-feature-settings: "tnum"`) for scores, standings, timers. That gives the tabular alignment without a monospaced typewriter feel.
- Hairlines (`1px solid --line`) between standings rows, feed cards. No card boxes-inside-card-boxes.

---

## 5. Screen-by-Screen Design Punch-List (Design-First)

Format per screen: **Design Read** (one-liner) · **Now** (what's broken) · **Design moves** (numbered fixes) · **Pattern references** (from §3).

### 5.A Onboarding

**5.A.1 `/onboarding/slides` — First impression**

- **Design Read:** *A pre-match tunnel walk. Confident. Fast. Ends with you on the pitch.*
- **Now:** Generic 3-slide carousel with icons and paragraph copy. Feels like every Next.js template.
- **Design moves:**
  1. Kill the icon-on-top-paragraph-below layout. Use full-bleed generated hero images per slide (in Rondo palette): slide 1 = futsal court from above at night with gold spotlights, slide 2 = a scoreboard graphic mid-tournament, slide 3 = a champion team lifting a trophy.
  2. Text over image: eyebrow (11px uppercase `--gold`), 2-line headline (Barlow Condensed 32px), one-line subtext (Manrope 15px `--ink-muted`). Anti-Slop hero discipline applies here even though it's a slide.
  3. Progress: three thin gold rails at the bottom, one filled. No dot navigation.
  4. Motion: slide changes are 320ms horizontal slide + 8% scale on the incoming image (parallax feel without parallax code).
  5. Copy: real language. Not "Welcome to Rondo, where futsal happens." Say "Book pickup. Run tournaments. Track goals." Three sentences, each a real product capability.
- **Pattern references:** Anti-Slop hero discipline + image-gen-first asset strategy.

**5.A.2 `/onboarding/role` — Player vs Organizer**

- **Design Read:** *Two clear roles, one clear default. No maybe.*
- **Now:** Two equal-weight cards. User doesn't know which to pick.
- **Design moves:**
  1. Asymmetric: Player card is 60% width, Organizer 40%. Player is the default — most users are players first.
  2. Player card gets a mini stat preview ("Track goals. Join tournaments. Level up."). Organizer card gets a mini ops preview ("Create leagues. Manage brackets. Get paid.").
  3. Both cards use generated iconography, not Lucide user/whistle. Player = a boot silhouette in gold, Organizer = a clipboard-with-bracket silhouette in gold.
  4. Selection: tapping either doesn't just advance — it briefly expands (`layoutId` shared transition) into the next screen. Motion-motivated: it says "we heard you, this is the path we're taking."
- **Pattern references:** Anti-Slop bento diversity (asymmetric split), motion-motivated (layout transition).

**5.A.3 `/onboarding/profile` — The drop-off zone (user research: HIGH insight)**

- **Design Read:** *Get the essentials, promise the rest can come later.*
- **Now:** 333 LOC of form. Every field feels required. Users drop off.
- **Design moves:**
  1. **Split into 3 tiny screens instead of one long form.** Screen 1: display name + avatar (real photo upload or one of 8 generated athlete portraits). Screen 2: preferred position + skill level (5 tap-to-select chips). Screen 3: home city / futsal court (autocomplete). Nothing else is required at signup.
  2. Every screen has one primary CTA (`Continue`) and one secondary (`Skip for now`). Skip actually skips — profile fields marked non-required in the schema.
  3. Progress: same three gold rails as slides. Continuity signal.
  4. Motion: each screen enters with a 16px y-offset and 200ms fade. No transitions between fields.
  5. Copy self-audit: current copy is "Tell us about yourself so we can personalize your experience." Kill it. New copy: "What should we call you?" (screen 1). "Where do you play?" (screen 2). "Any court you love?" (screen 3).
- **Pattern references:** Anti-Slop copy self-audit + hero discipline (one CTA intent per screen).

### 5.B Auth

**5.B.1 `/auth/signup` and `/auth/otp`**

- **Design Read:** *Fast, forgettable, done.*
- **Now:** Standard email + OTP flow. Works fine. Feels bureaucratic.
- **Design moves:**
  1. Above the input, a single-line eyebrow-free hero: "Sign in to Rondo." (Barlow Condensed 28px). Nothing else above the fold.
  2. Input field: 56px tall, `--bg-surface`, `--line` border 1px, gold border on focus (2px, not glowing). Placeholder is muted, label is above and small.
  3. Submit button full width, gold, black text. Only CTA on the screen.
  4. Legal fine print (terms/privacy) lives below the button in 12px `--ink-dim`. Not above.
  5. OTP: 6 boxes, tabular Barlow Condensed 24px. On paste, boxes fill from left with a 40ms stagger. Motion-motivated: shows the paste working.
  6. Resend link below in 13px, `--ink-muted`, underline on hover. No decorative countdown ring.
- **Pattern references:** Anti-Slop form/button contrast + hero discipline.

### 5.C Player home & feed

**5.C.1 `/community` (feed)**

- **Design Read:** *A group chat with box-score energy. You scroll to see what happened and who did it.*
- **Now:** 368 LOC. `tournament_id` is written on posts but never rendered. Feed decision signals are weak (user research says: users can't tell which post is important).
- **Design moves:**
  1. **Card anatomy (Strava activity card lift):**
     ```
     [avatar]  Author name              · 2h · Copa Mandaluyong ← linked tournament badge
     "Caption text, one to two lines."
     [hero visual: photo, bracket cutout, or match card]
     [stat row: 3G · 1A · MOTM]   ← only if applicable
     🔥 34  💬 8                    ← kudos + comments
     ```
  2. Cards are separated by a 1px `--line` hairline. No card-in-card. No shadows. Density 5.
  3. Tournament badge is the missing surface — a small gold pill with tournament name that links to `/tournaments/[id]`. Enables the cross-flow.
  4. Feed decision hierarchy: pinned tournament results get a subtle gold left-border accent (2px), normal posts have no accent. That's the entire hierarchy signal — no "trending" fire icons, no "top" chips.
  5. Empty state (no posts yet): full-width generated hero image (empty court, gold spotlights), 2-line copy "No posts yet. Score first, brag later." Single CTA "Create post."
  6. Compose FAB: bottom-right, 56px gold circle, Phosphor `Plus` glyph. On tap, morphs into a full-screen composer (`layoutId` — Anti-Slop morphing modal). Motion-motivated.
- **Pattern references:** Strava activity card, kudos button, achievement badge.

**5.C.2 Home screen (needs to be designed — currently the app opens to feed)**

- **Design Read:** *One glance tells you what's next.*
- **Now:** Missing. App opens to feed.
- **Design moves:**
  1. New route `/home`. Sections top-to-bottom:
     - **Next up** — one hero card: your next scheduled match or open tournament. Full-width, ends with a single CTA.
     - **Your tournaments** — horizontal scroll of TournamentCards, live status if any.
     - **Around you** — 3 tournament cards from your city, gold-outlined if you have friends in them.
     - **Recent** — last 3 completed matches with your stat line.
  2. Each section is a proper block with its own H2 (Manrope 15px semibold, uppercase, `--ink-muted`, tracking-wider). One eyebrow per section max — no `01 / NEXT UP` decoration.
  3. Pull-to-refresh: gold rail draws from left to right on the top edge. Not a spinner.
- **Pattern references:** Anti-Slop section discipline + Strava's "Home" screen structure.

### 5.D Tournaments — the primary flow

**5.D.1 `/tournaments` (list)**

- **Design Read:** *A shelf of trophies waiting to be won.*
- **Now:** 115 LOC. Cards render but they don't sell the tournament. All cards look identical.
- **Design moves:**
  1. **Top rail:** one line — segmented control `Nearby · Open · Live · Completed`. No filter icon top-right (that's the split-header ban).
  2. **Card variety by state** (Anti-Slop bento diversity translated):
     - **Live**: full-bleed background (subtle gold gradient), red pulse dot, current score prominent (`3 - 2` in Barlow Condensed 36px).
     - **Open registration**: standard card, gold "Join" CTA, spots-left indicator (`4 spots left` in `--ink-muted`, not a filled progress bar).
     - **Upcoming**: quieter card, `--bg-surface`, date big, `In 3 days` chip.
     - **Completed**: dimmed to 60% opacity, champion team's crest small in the corner, "Champions: X FC" as the meta line.
  3. Empty state (no tournaments yet in your city): generated hero image of an empty bracket board, copy "No tournaments here yet. Start one." CTA "Create tournament."
  4. Cards are single-column full-width on mobile. Never a 2-up grid on phones — that's cockpit density, not daily-app.
- **Pattern references:** Strava activity card variance, Anti-Slop no-3-equal-cards.

**5.D.2 `/tournaments/[id]` (detail)**

- **Design Read:** *The tournament's Wikipedia + jumbotron.*
- **Now:** 315 LOC using legacy `border-rondo-blue`, `border-border bg-card`, ad-hoc opacities. Palette drift — needs full re-token.
- **Design moves:**
  1. **Kill all legacy tokens.** Replace `border-rondo-blue` → `--gold`, `border-border` → `--line`, `bg-card` → `--bg-surface`, `text-white/60` → `--ink-muted`, `text-white/40` → `--ink-dim`. This is the number-one code hygiene fix. Blue is retired.
  2. **Hero block** (asymmetric split, mobile-collapsed to stack):
     - Left/top: tournament name (Barlow Condensed 32px), format chip (Round Robin / Knockout / Group + KO), venue + date row (Manrope 14px `--ink-muted`), one meta line.
     - Right/bottom: state pill (Live / Open / Completed) + single CTA (Join / Watch / Manage). One CTA. Not three.
  3. **Sticky sub-nav:** `Overview · Bracket · Standings · Schedule · Squad · Chat` — chip tabs, gold underline on active. This is the second-priority CTA layer.
  4. **Section stack** (each section is a full block, no side-by-side):
     - **Overview**: 3 stat tiles (teams · matches played · goals scored) in asymmetric grid — one big tile top, two smaller below.
     - **Bracket** (see 5.D.3).
     - **Standings** (see 5.D.4).
     - **Schedule**: match cards grouped by matchday, each card = home crest / score or time / away crest, hairline separator.
     - **Squad**: horizontal team-chip scroll with crest + name + wins.
     - **Chat** (currently missing — see §3.6 of prior playbook. This is the biggest tournament-flow gap.).
  5. Motion: on section change from sub-nav, content fades in 200ms + 8px y. Sub-nav underline slides between chips 240ms.
- **Pattern references:** Anti-Slop hero discipline + Strava stat grid + segment nav.

**5.D.3 Bracket view (`components/tournament/BracketView.tsx` + new full-screen route)**

- **Design Read:** *A stadium jumbotron in your hand.*
- **Now:** 211 LOC. Works structurally. Doesn't feel like a broadcast graphic.
- **Design moves:**
  1. **New route `/tournaments/[id]/bracket` — full-screen, share-optimized.** In-page bracket is a preview; tapping opens the full-screen version. Full-screen locks to landscape on phones or uses horizontal-scroll on portrait.
  2. **Team cell design:**
     ```
     ┌─────────────────────────────────┐
     │ [crest] TEAM NAME          [3]  │  ← winner: gold underline + bolder
     │ [crest] OTHER TEAM         [2]  │  ← loser: dimmed
     └─────────────────────────────────┘
     ```
     Barlow Condensed for scores, tabular figures, right-aligned. Team names uppercase Manrope semibold. Winners get a subtle gold left-border (2px) drawn in via SVG on advance (motion-motivated).
  3. **Connectors:** 1px `--line` for un-decided, 2px `--gold` for decided-and-winner-path. Animate the gold path drawing left-to-right when a result is recorded.
  4. **Final match cell** gets special treatment: 2px gold border, `Crown` glyph above the winner's crest. Foreshadows the champion moment.
  5. **Shareable state:** the full-screen bracket has a share button top-right (Phosphor `Share`). Generates a PNG snapshot (via `html-to-image`) with a "Rondo" watermark in the bottom-right corner. This is the viral loop.
  6. Zoom: pinch on mobile. Never mouse-follow tilt or 3D parallax — that's Anti-Slop-banned decoration.
- **Pattern references:** Strava segment leaderboard visual + broadcast graphic energy.

**5.D.4 Standings (`components/tournament/StandingsTable.tsx`)**

- **Design Read:** *A league table that reads like a stat sheet, not a spreadsheet.*
- **Now:** Functional. Doesn't communicate hierarchy.
- **Design moves:**
  1. **Row anatomy:**
     ```
     [rank]  [crest] TEAM NAME     W  D  L  GF  GA  GD  Pts
       1     [🟡]    RONDO FC      5  1  0  22  4   +18 16
       2     [ ]     STRIKERS      4  1  1  19  8   +11 13
     ```
     Rank in Barlow Condensed 20px `--gold` for top 3, `--ink-muted` for the rest. Crown glyph replaces the crest dot for #1.
  2. Hairline between rows, no zebra striping (that's a spreadsheet tell).
  3. Table headers uppercase Manrope 11px `--ink-dim`, tracking-wider, no border.
  4. Numbers all tabular figures. GD colored: `--green-ok` for positive, `--red-live` for negative, `--ink-muted` for zero.
  5. On tap of a row: row expands (`layout` prop) to show a mini stat drawer — top scorer, recent form dots (W-W-L-D-W), next fixture. Motion-motivated: it says "here's more about this team."
- **Pattern references:** Strava segment leaderboard, kudos-style motivated expand.

**5.D.5 Organizer create flow `/organizer/tournaments/create`**

- **Design Read:** *Four honest steps. Nothing hidden.*
- **Now:** 723 LOC. Already has 01/02/03/04 sections. Works, feels heavy.
- **Design moves:**
  1. **Keep the step counter.** It's a real progress indicator, not a decoration. (Distinction from Anti-Slop's section-number ban: user must complete these, so numbering is functional.)
  2. Header: `01 / 04  Basics` (11px uppercase `--ink-dim` / Barlow Condensed 24px). No decorative dot separator between the number and the label.
  3. Each step gets a single-column form, max 6 fields visible at once, sections separated by generous `py-6`.
  4. Form fields: 56px tall, gold focus border 2px, error states in `--red-live` with a Phosphor `WarningCircle` glyph left of the error text.
  5. Bottom action bar: sticky, `--bg-elev`, `Back` (ghost) + `Continue` (gold primary). Persistent. No floating.
  6. Step 04 = confirmation, shows a tournament card preview — the actual card users will see. Not a text summary of what they entered.
- **Pattern references:** Anti-Slop hero discipline (one intent per step) + Strava clean form clarity.

**5.D.6 Organizer manage `/organizer/tournaments/[id]/manage`**

- **Design Read:** *The dugout view. Everything's a decision away.*
- **Now:** 508 LOC. State-machine layout. Works well structurally, needs visual polish.
- **Design moves:**
  1. **Header** = same as detail hero but with a live state pill and "Manage" mode badge (small gold outlined pill top-right).
  2. **Primary action zone** below header: 2-column asymmetric grid of the most contextual next actions. E.g. during matchday: `Enter score` (big gold), `Send announcement` (secondary). Between matchdays: `Publish bracket` (big gold), `Message captains` (secondary).
  3. **Score sheet as bottom sheet:** already implemented. Refine: sheet slides from bottom with a 3px gold handle bar top-center. Score input uses two large Barlow Condensed number-tickers, +/- buttons on either side, tabular figures, 44pt tap targets minimum.
  4. **Match list:** grouped by matchday, each row is a match card. Live matches float to top and get a red pulse dot + `IN PROGRESS` chip. Completed matches dim to 60%.
  5. **Danger zone:** delete tournament, cancel matches — buried under an `Advanced` chevron. Red for destructive. Never in the primary action zone.
- **Pattern references:** Anti-Slop hero discipline + morphing modal (bottom sheet).

**5.D.7 New surface: `/tournaments/[id]/room` (tournament chat)**

- **Design Read:** *A locker room that everyone can hear.*
- **Now:** Missing entirely. Biggest gap for "best tournament flow" per prior playbook.
- **Design moves:**
  1. Route: chat surface scoped to a tournament, all participants + organizer.
  2. Layout: standard chat but with a header showing tournament name + current standings position ("You're 3rd · 2 matches to go").
  3. Message types: text, match result auto-post (styled as a mini match card in-chat), announcement (gold left-border, from organizer), reaction (kudos-style).
  4. System messages ("Match starts in 15 min") in `--ink-dim` centered.
  5. Composer: bottom, `--bg-elev`, send button gold when text is present, `--ink-dim` when empty. Attach button opens image or match-result quick post.
- **Pattern references:** Strava kudos + notification system.

**5.D.8 New surface: `/tournaments/[id]/champion` (or overlay on completion)**

- **Design Read:** *The trophy lift moment. Screenshot bait.*
- **Now:** Missing. Tournaments complete silently.
- **Design moves:**
  1. Triggered when final match is scored. Full-screen takeover for the organizer, push notification for participants.
  2. Above the fold: generated hero image (trophy silhouette in gold, dark stadium background), champion team crest overlaid, "CHAMPIONS" eyebrow (Barlow Condensed 14px uppercase gold), team name (Barlow Condensed 56px).
  3. Below: golden boot (top scorer), MVP, team of the tournament — three ribbon-badged stat tiles.
  4. Bottom: Share button (auto-generates PNG for stories/WhatsApp), View bracket, Back to tournament.
  5. This card also becomes the champion team's profile trophy (the tournament→profile trophy loop from the prior playbook, now visualized).
- **Pattern references:** Strava PR badge / segment achievement + shareable moment.

### 5.E Player profile

**5.E.1 `/players/[id]` (or profile tab)**

- **Design Read:** *Your football-manager card. Real stats, real trophies, real teams.*
- **Design moves:**
  1. Hero: avatar (large, 96px circle with 2px gold ring), name (Barlow Condensed 28px), position + city (Manrope 14px `--ink-muted`).
  2. Stat grid (asymmetric): one big "hero stat" (e.g. `12 GOALS`), two smaller (`4 ASSISTS`, `9 APPEARANCES`) — all with tiny uppercase labels below.
  3. **Trophies row** (the missing surface): horizontal scroll of tournament trophy cards. Each = tournament crest / name / finish (`Champions`, `Semi-finalists`, `Golden Boot`) / year. Gold ribbon for wins.
  4. **Recent matches**: last 5 matches as compact rows, with stat contribution highlighted.
  5. **Teams**: horizontal chip scroll of teams the player is on.
  6. Actions: `Message` (secondary), `Add to team` (contextual, organizer-only).
- **Pattern references:** Strava profile stat grid + achievement badges.

### 5.F Admin

Admin screens are behind an auth wall. Density can go up to 7 here (Anti-Slop cockpit territory), but palette and typography stay locked. Tables can use zebra + mono numbers here since no player ever sees them. Won't detail every admin screen — the design law is: same tokens, same type stack, higher density, more data per viewport.

---

## 6. Component Contracts (Design-First Rewrite)

These lock the visual API. Every screen assembles from these primitives.

### 6.A `<StatTile>`

```
props: { label: string, value: string|number, unit?: string, trend?: "up"|"down"|"flat", size?: "sm"|"md"|"lg" }
```
- `lg`: Barlow Condensed 48px value, 12px uppercase muted label, optional unit inline.
- `md`: 32px value.
- `sm`: 24px value.
- Tabular figures always. Trend: tiny arrow glyph in `--green-ok` / `--red-live` / `--ink-dim`.
- No box, no border. Just number + label with generous `space-y-1`.

### 6.B `<TournamentCard>` (already exists — 148 LOC — needs redesign)

```
props: { tournament, variant: "live"|"open"|"upcoming"|"completed" }
```
- Variant drives layout:
  - Live: bleed background, score-forward.
  - Open: standard, CTA-forward.
  - Upcoming: quiet, date-forward.
  - Completed: dimmed, champion-forward.
- All variants: 16px radius (`--r-md`), `--bg-surface`, hairline border in idle, gold border on press.

### 6.C `<MatchCell>`

```
props: { home, away, score?, kickoff?, state: "scheduled"|"live"|"final" }
```
- 3-column: home crest+name (left), score/time (center, Barlow Condensed tabular), away crest+name (right).
- Live: red pulse dot next to the current score.
- Final: winner's row bolded, loser's row dimmed.

### 6.D `<KudosButton>`

```
props: { count: number, active: boolean, onToggle }
```
- Phosphor `Fire` icon (outline when idle, gold-filled when active).
- Count next to it in tabular figures.
- Tap: scale bounce + ring pulse (see §4 motion). Increments count optimistically.

### 6.E `<Chip>`

```
props: { label, variant: "gold"|"outline"|"ghost"|"live", size: "sm"|"md" }
```
- Gold = solid gold background, `--gold-ink` text, no border.
- Outline = transparent, gold border 1px, gold text.
- Ghost = transparent, `--ink-muted` text.
- Live = red-filled with pulse animation.

### 6.F `<StepHeader>` (for organizer create flow)

```
props: { current: 1|2|3|4, total: 4, label: string }
```
- Uppercase `01 / 04` in 11px `--ink-dim`.
- Barlow Condensed 24px label below.
- No decorative dots between number and label.

---

## 7. Copy Self-Audit — Repo-wide Sweep

Anti-Slop §9.D + Anti-Slop copy discipline. Every user-facing string gets reviewed against:

- Would a Manila futsal captain say this in a WhatsApp group?
- Is there a generic filler verb (Elevate, Seamless, Unleash, Next-Gen)? Kill it.
- Is there a placeholder name (Player 1, John Doe, Test Team)? Replace with realistic locale-appropriate names.
- Is there a fake-perfect number (100%, exactly 50)? Roughen it.
- Is there an em-dash? Delete. Restructure the sentence.

**Sweep targets (grep the repo):**
- Empty states: `search string "No results"`, `"Nothing here yet"`, `"Get started"`
- Toasts: `search "successfully"`, `"failed to"`, `"please try again"`
- Button labels: `search "Submit"`, `"Save"`, `"Continue"` — replace generic verbs with concrete ones where possible (`Publish tournament`, `Enter score`).
- Placeholder data: `search "Player 1"`, `"Team A"`, `"lorem"`, `"test"`.
- Version strings: `search "beta"`, `"v1.0"`, `"coming soon"`.

**Replacements:**
- `"Elevate your futsal experience"` → `"Book pickup. Run tournaments. Track goals."`
- `"Player 1", "Player 2"` → `"JP Alcantara", "Kobe Nazareno", "Migs Yulo", "Dante Ferrer", "Rafa Del Rosario"`
- `"Successfully joined!"` → `"You're in."`
- `"Failed to load"` → `"Couldn't load that. Tap to retry."`
- `"Coming soon"` → cut the feature or ship it. No "coming soon" in production.

---

## 8. Motion Inventory (Every Animation, Justified)

Anti-Slop rule: motion must be motivated. Below is every animation Rondo ships, with its justification. If it's not on this list, it doesn't ship.

| Animation | Where | Justification |
|---|---|---|
| Screen fade-in (200ms opacity + 8px y) | Every route change | Softens abrupt content swap. |
| Card press (scale 0.98, 100ms) | Every tappable card | Feedback — confirms tap registered. |
| Kudos burst (scale + ring pulse, 400ms) | Kudos button | Celebrates the interaction. |
| Live match pulse (1.4s infinite, red dot) | Live badges | Signals real-time state. |
| Score counter tick (staggered digit y-slide, 300ms) | Score updates | Shows the goal happened. |
| Bracket line draw (SVG stroke-dashoffset, 600ms) | On result recorded | Shows the team advancing. |
| Sub-nav underline slide (240ms) | Tournament detail tabs | Continuity between sections. |
| Sheet slide-up (240ms cubic-bezier) | Bottom sheets, modals | Reveals origin of content. |
| Onboarding slide (320ms horizontal + 8% scale) | Onboarding carousel | Parallax feel without hijack. |
| Pull-to-refresh gold rail draw | Feed, tournaments list | Feedback for refresh gesture. |

**All above collapse to opacity-only fades under `prefers-reduced-motion: reduce`.** Duration halves. Loops stop.

---

## 9. Pre-Flight Checklist (Anti-Slop Adapted for Rondo)

Before any screen ships, verify every item. Fail one = don't ship.

**Palette & Color**
- [ ] Only Matchday tokens used. No `#000`, no `#fff`, no legacy `rondo-blue`, no ad-hoc opacity like `text-white/40`.
- [ ] One primary gold thing on the screen. Not two.
- [ ] Contrast checked: AA body, AAA hero copy and score numbers.

**Typography**
- [ ] Barlow Condensed only on: scoreboard numbers, screen H1, section rails.
- [ ] Manrope on everything else.
- [ ] Tabular figures on all stats, scores, standings, timers.
- [ ] No Inter fallback shipped.

**Hero discipline**
- [ ] Top-of-screen block has ≤4 elements: eyebrow (optional), headline (max 2 lines), one meta line, one CTA.
- [ ] One primary CTA on the screen. Not three.

**Eyebrow restraint**
- [ ] Max 1 eyebrow per scroll viewport. Section H2s don't count as eyebrows.

**Bento diversity**
- [ ] No 3-equal cards horizontally on the same row. Use asymmetric grid or single-column stack.

**Split-header ban**
- [ ] No headline-left + floating-explainer-right in section headers. Sub-nav lives in its own bar.

**Motion**
- [ ] Every animation on the screen is on the Motion Inventory (§8). No decorative motion.
- [ ] Reduced-motion tested. Animations collapse cleanly.
- [ ] Only `transform` and `opacity` animated. No `width`/`height`/`top`/`left` animations.

**Content**
- [ ] No em-dashes anywhere on the screen (headline, body, copy, alt text, button label).
- [ ] No placeholder names (Player 1, John Doe). Realistic locale-appropriate names.
- [ ] No fake-perfect numbers.
- [ ] Every string passes the "would a futsal captain say this?" test.
- [ ] No `V1.0 BETA` labels. No `Coming soon`. No decorative section numbers (functional step counters OK).

**Assets**
- [ ] No `<div>`-based fake screenshots.
- [ ] Empty states use generated hero images in Matchday palette, not stock photos.
- [ ] No hand-rolled decorative SVGs. Phosphor icons only.

**Performance**
- [ ] LCP < 2.5s. Hero images preloaded.
- [ ] INP < 200ms. Heavy work off main thread.
- [ ] CLS < 0.1. Space reserved for images, fonts.

**Accessibility**
- [ ] All interactive elements have visible focus rings (gold, 2px outset).
- [ ] All tap targets ≥ 44pt.
- [ ] All icons paired with an accessible label.

---

## 10. Sequenced Execution (Design-First)

Prior playbook set the security/data audit as Phase 0. That still stands — F1-F6 findings ship before we polish any screen. This §10 is the design build order once those are in.

### Wave 1 (Week 1-2): Design system rebuild

- [ ] Delete every legacy token from the codebase. Grep `rondo-blue`, `border-border`, `bg-card`, `text-white/`. Replace with Matchday tokens.
- [ ] Ship Phosphor icon library. Delete all hand-rolled SVGs. Standardize icon size scale (16/20/24).
- [ ] Ship `<StatTile>`, `<Chip>`, `<KudosButton>`, `<StepHeader>` primitives.
- [ ] Repo-wide copy self-audit sweep. Em-dash strip, placeholder replacement, empty-state rewrites.
- [ ] Add `prefers-reduced-motion` respect at the Motion library layer.

### Wave 2 (Week 3-4): Tournament flow polish (the main goal)

- [ ] Refactor `TournamentCard` for 4 variants.
- [ ] Rebuild `/tournaments/[id]` hero + sub-nav.
- [ ] Ship full-screen `/tournaments/[id]/bracket` with share-PNG.
- [ ] Redesign `StandingsTable` with row expand.
- [ ] Redesign organizer create + manage screens with new tokens.
- [ ] Ship `/tournaments/[id]/room` (chat) + `/tournaments/[id]/champion` (recap).
- [ ] Wire tournament→profile trophy pipeline.

### Wave 3 (Week 5-6): Feed + home + profile

- [ ] Rebuild community feed with Strava activity card pattern.
- [ ] Render tournament badges on posts (the missing UI for existing `tournament_id`).
- [ ] Ship `/home` with next-up / your tournaments / around you / recent.
- [ ] Rebuild player profile with trophy row + asymmetric stat grid.

### Wave 4 (Week 7-8): Onboarding + auth polish + landing page

- [ ] Rebuild onboarding slides with generated hero images.
- [ ] Split onboarding profile into 3 tiny screens.
- [ ] Redesign auth screens.
- [ ] Rebuild the marketing landing page — here Anti-Slop applies verbatim, no translation needed. This is the one Rondo surface where the taste skill's full toolkit (asymmetric split hero, bento feature grid, sticky-scroll product tour) applies without modification.

### Wave 5 (ongoing): Motion polish + reduced-motion QA + accessibility sweep

---

## 11. What's Explicitly Out of Scope

- New brand color introduction. Not happening.
- Dark/light dual mode. Rondo is dark-first, always. Anti-Slop §6.C's dual-mode mandate does not apply — this is a stadium-night product, not a productivity tool.
- Import of Strava's palette, typography, or map hero.
- Any scroll-hijack pattern in the product app (landing page can use them selectively).
- Blur/glassmorphism as decoration. If a surface uses backdrop-blur, it's for a real focus-stealing modal, not vibes.
- Mouse-follow effects, cursor customization, particle backgrounds.

---

## 12. Open Questions (For You)

None blocking. Two design decisions to note as we go:

1. **Trophy hero images** — do we want each tournament to have a unique generated trophy image, or one canonical trophy silhouette across all champion screens? Recommendation: one canonical for now (ship faster), unique-per-tournament as a Wave 5 polish.
2. **Kudos → "Hyped" naming** — I've been using "Hyped" as the kudos-equivalent. If you prefer "Boot" or something more futsal-native, easy swap. Recommendation: user-test with 5 Rondo users before locking.

---

*End of playbook. This document is design law until superseded. Security/data audit playbook (`rondo-perfection-playbook-2026-07-08.md` §Phase 0) still governs pre-design shipping order.*
