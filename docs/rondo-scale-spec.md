# Rondo Scale Spec — Type, Size, Space, Radius

**Version:** 2026-07-08  
**Companion to:** `rondo-design-first-playbook-2026-07-08.md`  
**Extends (does not replace):** `rondo-design-system.md` (the "Matchday" law)  
**Purpose:** Pin the exact number for every measurement, on every screen. If a value isn't in this doc or the design-system doc, it's banned.

---

## 0. Read this first

The Matchday design system already commits to:

- **Spacing scale:** `4, 8, 12, 16, 20, 24, 32, 48` (px). Anything else fails review.
- **Radius scale:** `--r-sm 10 · --r-md 16 · --r-lg 24 · --r-pill 999`.
- **Type roles:** Display 28/30 · Title 20/24 · Label 11/14 · Body 15/22 · Meta 13/18.
- **Depth budget:** Page → Surface. Two layers, no more.

That's the law. This doc doesn't override any of it. It:

1. **Extends the type scale** with the sizes the playbook implicitly needs (score numbers, bracket cells, champion moment) that the current 5-role scale can't cover.
2. **Maps every size to a specific screen context** so there's no ambiguity at implementation time.
3. **Adds a stat-grid hierarchy** for the Strava-pattern lifts (hero stat vs supporting stat).
4. **Documents shadow/elevation/z-index** which the design-system doc bans by name but the playbook still needs a policy on.

---

## 1. Extended Type Scale (adds to §4 of design system)

The existing scale (Display 28 / Title 20 / Label 11 / Body 15 / Meta 13) covers UI chrome. It doesn't cover **stat display**, which is Rondo's core visual mode. Adding four dedicated roles keeps the chrome scale clean while giving the athletic-data language room to sing.

### 1.A The full scale (11 roles)

| Role | Face | Size / Line | Weight | Case & Track | Where it lives |
|---|---|---|---|---|---|
| **Monument** | Barlow Condensed | 56 / 56 | 700 | UPPER, +0.01em | Champion moment only. One per app. |
| **Hero-stat** | Barlow Condensed | 40 / 40 | 700 | tabular-nums, +0.005em | Big stat tile (profile hero stat, tournament goals-scored). |
| **Score** | Barlow Condensed | 32 / 32 | 700 | tabular-nums | Live match card, match cell in bracket, score sheet input. |
| **Display** | Barlow Condensed | 28 / 30 | 700 | UPPER, +0.01em | Page heroes. 1 per screen. |
| **Sub-stat** | Barlow Condensed | 20 / 22 | 700 | tabular-nums | Supporting stat tiles, standings W-D-L numbers, rank number. |
| **Title** | Barlow Condensed | 20 / 24 | 700 | UPPER | Card titles, section counts. |
| **Body-lg** | Manrope | 17 / 24 | 500 | sentence | Onboarding subhead, empty-state one-liners. |
| **Body** | Manrope | 15 / 22 | 500 | sentence | Everything readable. |
| **Meta** | Manrope | 13 / 18 | 500 | sentence | Dates, venues, counts. `--ink-low`. |
| **Label** | Manrope | 11 / 14 | 700 | UPPER, +0.08em | Section headers, chips, stat labels. `--ink-low`. |
| **Micro** | Manrope | 10 / 12 | 700 | UPPER, +0.10em | Rank badges, timestamp on cards, "LIVE" pip. |

### 1.B Guardrails

- **Barlow floor: 16px.** If a design needs Barlow smaller, it's Manrope Label instead. Barlow is a shout, not a whisper.
- **Manrope ceiling: 17px** for body copy. If it wants to be bigger, it's Barlow Title (20).
- **Tabular figures are required** on: Score, Hero-stat, Sub-stat, and any Body/Meta rendering a number that lines up in a column (standings, wallet, scores).
- **UPPER + tracking on all Barlow Display/Title/Monument.** Never mixed case Barlow. Barlow's proportion is designed for uppercase.
- **Never letter-space Body.** Only Label / Micro / Barlow display roles get positive tracking.
- **Weight is fixed per role.** No `font-medium` on a Title, no `font-bold` on Body. If you want emphasis in Body, use `--ink-hi` vs `--ink-mid` — never weight.

### 1.C Screen-by-screen type spec

| Screen | Element | Role | Notes |
|---|---|---|---|
| Onboarding slides | Eyebrow | Label | `--gold` |
| Onboarding slides | Headline (2 lines) | Display | Over hero image |
| Onboarding slides | Subtext | Body-lg | `--ink-mid` |
| Onboarding profile (3 mini screens) | Screen question | Title | UPPER |
| Auth signup | "Sign in to Rondo." | Display | Only element above input |
| Auth OTP | 6-digit boxes | Score | 32px, tabular |
| Home | "Next up" section header | Label | `mt-8 mb-3` |
| Home | Hero card team name | Title | Inside card |
| Home | Match kickoff time | Score | Big, tabular |
| Feed card | Author name | Body | 15px `--ink-hi` |
| Feed card | "· 2h · Copa Mandaluyong" | Meta | `--ink-low` |
| Feed card | Caption | Body | `--ink-hi`, max 2 lines |
| Feed card | Stat row (3G · 1A · MOTM) | Label | Uppercase, `--ink-low` |
| Feed card | Kudos count | Meta | tabular |
| Tournament list card (Live) | Score `3 - 2` | Hero-stat | Center of card |
| Tournament list card | Tournament name | Title | UPPER |
| Tournament list card | Meta line (venue · time) | Meta | |
| Tournament detail | Tournament name | Display | Hero block |
| Tournament detail | State pill (LIVE / OPEN / DONE) | Micro | Inside chip |
| Tournament detail | Section headers (Overview, Bracket…) | Label | Sub-nav chips |
| Overview stat tile (big) | Value | Hero-stat | e.g. `12 teams` |
| Overview stat tile (big) | Label | Label | `TEAMS` |
| Overview stat tile (small) | Value | Sub-stat | |
| Bracket cell | Team name | Body | UPPER, 15px `font-weight 700` (only Body allowed to bold — this is the exception, documented here) |
| Bracket cell | Score | Sub-stat | Right-aligned, tabular |
| Standings row | Rank (top 3) | Sub-stat | `--gold` |
| Standings row | Rank (4+) | Meta | `--ink-low` |
| Standings row | Team name | Body | `--ink-hi` |
| Standings row | W/D/L/GF/GA/GD/Pts | Meta | tabular, `--ink-mid` |
| Standings header | W · D · L · GF · GA · GD · Pts | Label | `--ink-low` |
| Organizer create step header | `01 / 04` | Micro | `--ink-low` |
| Organizer create step header | `Basics` | Title | Below the counter |
| Organizer create form label | Field label | Label | Above input |
| Organizer manage primary CTA | Button text | Title | Inside 48px pill |
| Score sheet bottom sheet | Score digits | Hero-stat | 40px, tabular, centered |
| Score sheet | Team names | Title | Above scores |
| Tournament chat | Message body | Body | |
| Tournament chat | Timestamp | Meta | `--ink-low` |
| Tournament chat | System msg | Meta | Centered, `--ink-low` |
| Champion moment | "CHAMPIONS" eyebrow | Label | 11px `--gold` |
| Champion moment | Team name | Monument | 56px, only place this role appears |
| Champion moment | "Golden Boot / MVP" ribbons | Micro | Inside gold pill |
| Player profile | Player name | Display | Under avatar |
| Player profile | Position + city | Meta | |
| Player profile | Hero stat (12 GOALS) | Hero-stat | Big tile |
| Player profile | Supporting stats (4 ASSISTS, 9 APPS) | Sub-stat | Smaller tiles |
| Player profile | Stat labels | Label | Below each value |
| Player profile | Trophy card team name | Title | Inside card |
| Player profile | Trophy card year | Meta | |
| Empty state | Headline | Title | Centered |
| Empty state | Subtext | Body | Centered, `--ink-mid` |
| Bottom nav | Active label | Label | Under icon |

---

## 2. Spacing — the semantic map

Design system pins the 8 raw values. This section pins **which value goes where** across the whole app so nobody re-litigates it per screen.

### 2.A The scale (unchanged)

| px | Tailwind | Alias | Contract |
|---|---|---|---|
| 4 | `*-1` | `--sp-micro` | Icon-to-label, tightest inline pairs |
| 8 | `*-2` | `--sp-cluster` | Chip-to-chip, icon-to-icon inline gaps |
| 12 | `*-3` | `--sp-stack`, `--sp-inset` | Sibling cards in a list, padding inside insets |
| 16 | `*-4` | `--sp-card`, `--sp-gutter` | Card padding, page gutter |
| 20 | `*-5` | — | Rare. Only for compensating icon optical alignment inside a 24px slot. |
| 24 | `*-6` | `--sp-hero` | Hero internal padding, generous card padding |
| 32 | `*-8` | `--sp-section` | Between page sections (topic changes) |
| 48 | `*-12` | — | Empty-state vertical padding (`py-12`), Onboarding hero margins |

### 2.B Vertical rhythm (canonical stack)

For any product screen, top-to-bottom:

```
[sticky header 48px]
  ↕ 16px         ← page top padding after header
[hero block or first section]
  ↕ 32px         ← section break
[section header (Label type)]
  ↕ 12px         ← header to its content
[card 1]
  ↕ 12px         ← sibling card (--sp-stack)
[card 2]
  ↕ 12px
[card 3]
  ↕ 32px         ← next section
[section header]
  ↕ 12px
[content]
  ↕ 24px         ← breathing room at bottom of last content
[pb-24]          ← clears bottom nav (64 nav + 32 safety)
```

**No exceptions.** `pb-20`, `pb-28`, `pb-32` all die. Bottom padding is 24 (as `pb-24` = `6rem` = 96px in Tailwind — but Rondo's semantic `pb-24` means "24 in our scale" = 96px in Tailwind's default, which is 96 raw. Same value. Documented so nobody confuses them.)

### 2.C Horizontal rhythm

- **Page gutter:** 16px each side (`px-4`). Never 12, never 20.
- **Card horizontal padding:** 16px. Cards flush with the gutter (i.e., cards go edge-to-edge inside the 16px page gutter, not double-inset).
- **Card content max width:** the card. Everything inside a card is `w-full`.
- **Max content column (desktop, organizer web):** `max-w-lg mx-auto` on mobile-native surfaces, `max-w-3xl` on organizer dashboards, `max-w-6xl` on the marketing landing page.
- **Two adjacent buttons:** `gap-2` (8px). Ghost + Primary in the same action bar.
- **Icon + text pair:** `gap-2` (8px) if icon is 20px+, `gap-1` (4px) if icon is 16px or smaller.
- **Chip row:** `gap-2` (8px) between chips, wraps to a new row with `gap-y-2`.

### 2.D Card padding decision tree

- Standard card → `p-4` (16px).
- Dense card (bracket cell, standings row) → `p-3` (12px).
- Hero card (home "Next up", tournament detail hero) → `p-6` (24px).
- List row inside a card → `py-3 px-4` (12 top/bottom, 16 sides), divider between rows.
- Sheet content → `p-4` + `pb-[env(safe-area-inset-bottom)]`.

---

## 3. Radius — nested law

Design system commits `--r-sm 10 · --r-md 16 · --r-lg 24 · --r-pill 999`. The rule that matters most and is easiest to break: **nested radius**.

### 3.A The nested-radius formula

**Inner radius = outer radius − inset padding.**

Practical outcomes for Rondo:

| Outer container | Outer radius | Inner element | Inner padding | Inner radius |
|---|---|---|---|---|
| Card | 16 (`--r-md`) | Inset block | 12 (`p-3`) | 4 → round to `--r-sm` (10) — deliberately break the formula upward to `--r-sm` because 4px looks razor-cut. Use `--r-sm` (10) as the floor. |
| Hero card | 24 (`--r-lg`) | Standard card inside | 16 (`p-4`) | 8 → round up to `--r-sm` (10). |
| Sheet | 24 top corners (`--r-lg`) | Card inside sheet | 16 | `--r-sm` (10). |
| Modal | 24 (`--r-lg`) | Button inside | 24 (`p-6`) | 0 → but buttons are `--r-pill`, so buttons override the formula (pills always pills). |
| Card | 16 (`--r-md`) | Avatar (leading) | 16 padding | `--r-pill` (avatars always pills, override). |

**Overrides that always win:**
- Avatars → `--r-pill`.
- Buttons → `--r-pill`.
- Chips → `--r-pill`.
- Progress bars / meter fills → `--r-pill`.

**The formula governs:** rectangles inside rectangles (image thumbs, insets, embedded stat tiles, form input groups). This is where nested radius goes wrong 90% of the time.

### 3.B Radius screen map

| Element | Radius |
|---|---|
| Onboarding hero image | `--r-lg` (24) — big and generous |
| Auth input | `--r-sm` (10) |
| Auth primary button | `--r-pill` |
| Feed card | `--r-md` (16) |
| Feed card hero image inside | `--r-sm` (10) |
| Feed kudos button | `--r-pill` |
| Tournament card (all variants) | `--r-md` (16) |
| Tournament card crest thumb | `--r-pill` if it's a shield-shape avatar, `--r-sm` if it's a rectangular badge |
| Bracket cell | `--r-sm` (10) — dense, so tighter |
| Standings row | 0 (no radius, hairline top and bottom) |
| Standings container card | `--r-md` (16) |
| Score sheet bottom sheet | `--r-lg` top corners only |
| Organizer form input | `--r-sm` (10) |
| Organizer step navigator dots | `--r-pill` |
| Champion moment hero image | `--r-lg` (24) or full-bleed (0) |
| Champion "CHAMPIONS" eyebrow pill | `--r-pill` |
| Trophy card on profile | `--r-md` (16) |
| Trophy card ribbon overlay | `--r-sm` (10) top-right |
| Bottom nav | 0 (flush to bottom) |
| Sticky top header | 0 (flush to top) |
| Modal | `--r-lg` (24) all corners |
| Toast | `--r-md` (16) |
| FAB (compose) | `--r-pill` (fully circular) |
| Chips | `--r-pill` |
| Avatars | `--r-pill` |
| Progress rails (onboarding, pull-to-refresh) | `--r-pill` |

**Ban list:** `rounded-lg`, `rounded-xl`, `rounded-2xl`, `rounded-3xl`, `rounded-full` (use `--r-pill` explicitly). Also ban `rounded-[Xpx]` arbitrary values. If it's not one of the four tokens, it doesn't ship.

---

## 4. Sizes — components with exact heights

Sizes are where mobile UI dies. These are locked.

### 4.A Interactive heights

| Element | Height | Notes |
|---|---|---|
| Primary button | 48 | `--r-pill`, `px-6`, Title type |
| Secondary button | 48 | Same footprint as primary |
| Ghost button (destructive, back) | 40 | Smaller — never at the primary decision point |
| Input | 48 | `--r-sm`, `px-4`, Body type |
| Chip | 32 | `--r-pill`, `px-3`, Label type |
| List row | 56 min | `py-3`, tap target compliant |
| Bottom nav | 64 + safe area | |
| Sticky top header | 48 | |
| Bottom sheet grab handle | 4 tall × 32 wide | Centered, `mt-2 mb-4` |
| FAB | 56 × 56 | Circular, `--r-pill` |
| Segmented control | 36 | Inline, holds Label type |
| Toggle / switch track | 24 tall × 40 wide | Thumb 20 diameter |
| Checkbox / radio | 20 | Tap target expanded to 44 via padding |
| Live pulse dot | 8 | `--live`, animated |

### 4.B Avatar sizes

| Context | Size |
|---|---|
| Feed card leading avatar | 40 |
| Chat message leading avatar | 32 |
| Standings row crest | 24 |
| Bracket cell crest | 20 |
| Team squad chip crest | 20 |
| Tournament card crest (upcoming/open) | 32 |
| Profile hero avatar | 96 |
| Profile trophy card team crest | 40 |
| Champion moment team crest | 80 |

All avatars: `--r-pill`, 2px `--stroke` border by default, 2px `--gold` border when it represents the user or a winner.

### 4.C Icon sizes

| Context | Size |
|---|---|
| Inline with Body text | 16 |
| Inline with Label text | 14 |
| Chip icon | 16 |
| List row leading icon | 20 |
| Card action icon | 20 |
| Bottom nav icon | 24 (28 on active state via scale) |
| Empty state hero icon | 48 |
| FAB icon | 24 |
| Kudos fire | 20 |
| Live pulse dot | 8 |
| Crown (top-3 standings) | 16 |
| Trophy (champion) | 32 in profile card, 80 in champion moment |

**Icon library:** Phosphor, `duotone` variant for empty states and champion moments (allows two-tone gold effect), `regular` variant everywhere else. Never mix Phosphor with another icon set. Never ship a hand-rolled SVG unless it's a team crest.

### 4.D Image aspect ratios

| Context | Ratio |
|---|---|
| Onboarding hero slide | 3:4 (portrait, fills viewport width) |
| Feed hero image | 16:9 (default) or 4:5 (portrait posts, e.g. team photos) — cards adapt |
| Tournament card cover (Live variant background) | 16:9, full-bleed |
| Champion moment hero | 16:9 or 3:4 depending on device |
| Trophy card thumbnail | 1:1 (square) |
| Player profile avatar | 1:1 (circle-cropped via `--r-pill`) |
| Match photo in chat | Native aspect, max-height 320 |

**All hero/full-bleed images:** generated in Matchday palette (dark-first, gold accent). Never stock photos. Never `picsum.photos` or `unsplash.com` links in the shipped app.

---

## 5. Stat-grid hierarchy (Strava pattern, Rondo scale)

The playbook says "asymmetric stat grid" a lot. Here's the actual spec.

### 5.A The three grid patterns

**Pattern A — Hero + 2 (profile stats, tournament overview):**
```
┌───────────────────────┐
│                       │
│   Hero-stat (40px)    │
│   LABEL               │
│                       │
├───────────┬───────────┤
│  Sub-stat │  Sub-stat │
│  LABEL    │  LABEL    │
└───────────┴───────────┘
```
- Hero tile: `p-6`, `--bg-surface`, `--r-md`, spans full width.
- Sub tiles: `p-4`, `--bg-surface`, `--r-md`, 50/50 split with `gap-3` between them.
- Vertical `gap-3` between hero and sub row.

**Pattern B — Strip (match card score row):**
```
┌───────────────────────────────────────┐
│  3G · 1A · MOTM                       │
│  LABELS                               │
└───────────────────────────────────────┘
```
- One row of inline Label + Sub-stat pairs.
- `gap-4` (16px) between pairs.
- Dividers between pairs = single `·` character in `--ink-low`, `mx-2`.

**Pattern C — Full grid (standings, admin dashboard):**
```
LABEL  LABEL  LABEL  LABEL  LABEL  LABEL  LABEL
value  value  value  value  value  value  value
value  value  value  value  value  value  value
```
- CSS Grid, 7 columns for standings (Rank | Team | W | D | L | GD | Pts).
- All numeric columns: `tabular-nums`, right-aligned.
- Team name column: left-aligned, `min-width: 0`, `truncate`.
- Labels row: `--ink-low`, Label type, `pb-2 border-b --stroke`.

### 5.B Anti-patterns

- **3 equal cards horizontally on mobile** — banned (Anti-Slop bento diversity). Use Pattern A instead.
- **Radial charts** for stats — banned. Rondo is data-forward, not chart-porn.
- **Delta arrows next to every stat** — only on stats where change matters (rank ↑↓, win streak). Never on totals.

---

## 6. Shadow, elevation, z-index

Design-system doc bans `box-shadow` explicitly ("Elevation on dark = lighter fill + hairline border. No box-shadows, ever."). This section clarifies the exceptions and pins z-index.

### 6.A Elevation via fill (no shadows)

| Layer | Fill | Border |
|---|---|---|
| Page | `--bg-page` | none |
| Surface (card) | `--bg-surface` | 1px `--stroke` |
| Inset (input, meter) | `--bg-inset` | none |
| Elevated (modal, sheet, toast, dropdown, popover) | `--bg-inset` (one step lighter than surface) | 1px `--stroke` |

That's it. Four levels. If a design needs a fifth, the design is wrong.

### 6.B The one shadow allowed

- **FAB shadow** (compose button on feed). Reason: it floats over content that can be any color. It needs to feel physically above the page.
- Spec: `0 4px 12px oklch(0% 0 0 / 0.32)`.
- Nothing else in the app gets a shadow. Not modals (they use a backdrop instead). Not sticky nav (they use `backdrop-blur` + fill). Not cards (they use border).

### 6.C Backdrop (behind modals, sheets)

- Fill: `oklch(0% 0 0 / 0.6)`.
- Blur: `backdrop-blur-sm` (4px).
- Tap-to-dismiss on sheet, not modal (modals require an explicit close).

### 6.D Z-index scale

Fixed ladder. Never `z-[9999]`. Never arbitrary values.

| Layer | z-index | Tailwind |
|---|---|---|
| Base content | 0 | `z-0` |
| Sticky top header | 10 | `z-10` |
| Bottom nav | 10 | `z-10` |
| FAB | 20 | `z-20` |
| Sticky sub-nav (tournament tabs) | 20 | `z-20` |
| Sheet backdrop | 40 | `z-40` |
| Sheet | 50 | `z-50` |
| Modal backdrop | 60 | `z-60` (arbitrary — add to Tailwind config) |
| Modal | 70 | `z-70` |
| Toast | 80 | `z-80` |
| Dev-only debug overlay | 90 | `z-90` |

---

## 7. Motion timing (pins the playbook's §8 inventory)

The playbook §8 lists what animates. This pins the numbers.

### 7.A Durations

| Duration | Use |
|---|---|
| 100ms | Card press feedback (`scale: 0.98`). |
| 200ms | Screen fade-in, tab underline slide. |
| 240ms | Sheet slide, modal fade, sub-nav switch. |
| 320ms | Onboarding slide transition, `layoutId` morphs. |
| 400ms | Kudos burst, celebration micro-interactions. |
| 600ms | Bracket connector line draw. |
| 1400ms | Live pulse loop (single cycle). |

### 7.B Easing tokens

```css
--ease-snappy:  cubic-bezier(0.4, 0, 0.2, 1);      /* exits, taps */
--ease-out:     cubic-bezier(0.16, 1, 0.3, 1);      /* enters */
--ease-bouncy:  cubic-bezier(0.34, 1.56, 0.64, 1);  /* champion moment only */
```

### 7.C Reduced-motion collapse rules

Under `prefers-reduced-motion: reduce`:

- All non-loop animations halve their duration and drop transform, keeping opacity only.
- All loops stop.
- Kudos burst becomes a color-change flash, no scale.
- Bracket line draw becomes an instant color swap.
- Live pulse becomes a static dot.

---

## 8. Applying it — one worked example

Take the **tournament detail hero** — the most-visited screen in the primary flow.

**Layout:**
```
┌──────────────────────────────────────────────┐
│  [sticky header 48px]                        │  z-10, --bg-page/88 + blur
├──────────────────────────────────────────────┤
│                                              │  16px top padding (--sp-card)
│  [state pill]                                │  32px chip, Micro type, --gold-dim fill
│    ↕ 12px                                    │
│  Copa Mandaluyong 2026                       │  Display (28/30)
│    ↕ 8px                                     │
│  Sat July 11 · Marikina Sports Center        │  Meta, --ink-low
│    ↕ 24px (--sp-hero internal breathing)     │
│  ┌────────────────────────────────────────┐  │
│  │  Join tournament               →       │  │  48px height, --r-pill, --gold fill
│  └────────────────────────────────────────┘  │
│                                              │
├──────────────────────────────────────────────┤  32px section break
│  [Overview · Bracket · Standings · Chat]     │  Sub-nav sticky, 48px height, z-20
├──────────────────────────────────────────────┤
│    ↕ 24px                                    │
│  ┌────────────────────────────────────────┐  │
│  │                                        │  │
│  │  12                                    │  │  Hero-stat (40/40)
│  │  TEAMS                                 │  │  Label (11/14), --ink-low
│  │                                        │  │
│  └────────────────────────────────────────┘  │  --r-md (16), --bg-surface, p-6
│    ↕ 12px (--sp-stack)                       │
│  ┌────────────────┬───────────────────────┐  │
│  │  47            │  ₱2,400               │  │  Sub-stat (20/22)
│  │  GOALS         │  ENTRY FEE            │  │  Label
│  └────────────────┴───────────────────────┘  │  --r-md, p-4, gap-3
```

Every number in that mockup comes from this doc. No decisions were made outside the spec.

---

## 9. Enforcement (how this doesn't rot)

1. **Tailwind config as the gate.** Delete every non-scale value from `tailwind.config.ts` — the config itself refuses to compile arbitrary `p-2.5`, `rounded-xl`, etc. If it's not on the scale, it doesn't exist.
2. **Storybook or a `/design/tokens` route.** Ship a live tokens page rendering every type role, every spacing step, every radius. Reviewer checks the screen against this page.
3. **ESLint rule (custom):** flag `text-white/`, `bg-black`, `#[0-9a-f]{3,8}`, `rounded-\[`, `p-\[`, `gap-\[`. Fail the build.
4. **PR review question, verbatim:** "Which token does each number here map to?" If the answer is "I eyeballed it," send back.

---

## 10. What's still open

- **Marketing landing page scale.** This doc is product-app scale. The landing page inherits type roles but scales up (Display becomes 48, Monument becomes 80, page gutter grows to 32 on desktop). A separate landing-page addendum will cover it when we get to Wave 4.
- **Admin dashboard scale.** Density can bump: card padding drops from `p-4` to `p-3`, list rows from 56 to 44. But type roles and radius stay. Will formalize when admin gets its polish pass.
- **Print / share-PNG scale.** Bracket share-PNG and champion share-PNG render at 1200×630 (OG image size). Type sizes multiply by ~2× for legibility at social-media scroll speed. Will spec when we build the PNG generator.

---

*End of scale spec. Read alongside the design system doc and the design-first playbook. If a value isn't in one of these three files, it's not a value.*
