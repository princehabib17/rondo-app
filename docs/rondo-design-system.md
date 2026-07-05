# RONDO Design System — "Matchday"

One system, few tokens, hard rules. The current UI fails because it has *brand*
(gold, condensed type) but no *law*: 4 radii, 12+ paddings, 3 color systems.
This document is the law. Every value below is exact; anything not listed is
banned.

---

## 0. The One Rule That Fixes "Boxes in Boxes"

**Depth budget: a screen gets 2 layers. Page → Surface. That's it.**

- Layer 0 — **Page** (`--bg-page`): the black ground. Sections live directly on
  it, separated by *whitespace and section headers*, never by wrapper boxes.
- Layer 1 — **Surface** (`--bg-surface`): a bordered card. Content inside a
  surface is organized with **dividers and spacing — never another bordered
  box.** If you need a sub-group inside a card, use `--bg-inset` (a fill, no
  border, radius `--r-sm`) and you've spent the budget.
- A bordered box inside a bordered box is a lint error of the soul. Delete the
  outer one or flatten the inner one to a divider row.

Elevation on dark = lighter fill + hairline border. **No box-shadows, ever.**

---

## 1. Color — Muted Matchday (single palette, 12 tokens)

Keep the identity (black night, gold accent) but drop the shout: accent chroma
comes down, all greys derive from one hue (102 = the gold hue, so neutrals feel
warm-black, not blue-black). Everything is oklch; **raw hex is banned.**

```css
/* ground */
--bg-page:      oklch(11% 0.008 102);   /* the pitch at night */
--bg-surface:   oklch(15.5% 0.010 102); /* cards */
--bg-inset:     oklch(19% 0.012 102);   /* fills inside cards: inputs, meters */
--stroke:       oklch(26% 0.012 102);   /* hairline borders, dividers */

/* ink (opacity steps of white — use these, never ad-hoc /xx opacities) */
--ink-hi:       oklch(97% 0 0);              /* headlines, key numbers */
--ink-mid:      oklch(78% 0.008 102);        /* body, labels */
--ink-low:      oklch(58% 0.010 102);        /* meta, captions, icons at rest */

/* accent — ONE gold, muted */
--gold:         oklch(86% 0.115 96);    /* was 92%/0.16 — calmer, still Rondo */
--gold-ink:     oklch(20% 0.02 96);     /* text on gold */
--gold-dim:     color-mix(in oklch, var(--gold) 14%, transparent); /* fills */

/* semantic (each = exactly one meaning, small doses) */
--live:         oklch(62% 0.19 25);     /* red: live/destructive only */
--ok:           oklch(70% 0.14 155);    /* green: success/online only */
```

**Role law (per screen):** gold = primary action, money, winner. Red = live or
destructive. Green = success/online dot. Blue is retired except team colors
inside match content. Everything else is ink.

Migration kills: the shadcn `--sidebar-*` block, `--color-rondo-gold #D4A574`,
`--color-rondo-yellow` (dupe of accent), all `text-white/NN` ad-hoc opacities →
the three ink tokens.

---

## 2. Spacing — one scale, 8 steps, semantic aliases

4px base. **Allowed values: 4, 8, 12, 16, 20, 24, 32, 48.** (Tailwind: 1, 2, 3,
4, 5, 6, 8, 12 — anything else fails review, incl. all `*-2.5`/`*-1.5`.)

| Alias | Value | Used for |
|---|---|---|
| `--sp-gutter` | 16px | page left/right padding (`px-4`) |
| `--sp-card` | 16px | padding inside every card (`p-4`) |
| `--sp-inset` | 12px | padding inside an inset block (`p-3`) |
| `--sp-stack` | 12px | gap between sibling cards in a list (`gap-3`) |
| `--sp-cluster` | 8px | gap between chips/icons/inline items (`gap-2`) |
| `--sp-micro` | 4px | icon-to-label, tightest pairs (`gap-1`) |
| `--sp-section` | 32px | between page sections (`mt-8`) |
| `--sp-hero` | 24px | hero internal padding (`p-6`) |

**Rhythm rule:** section header sits `32px` below the previous section and
`12px` above its content. Never express hierarchy with padding alone — big gap
(32) = new topic, small gap (12) = same topic.

---

## 3. Radius — three values + pill

| Token | Value | Used for |
|---|---|---|
| `--r-sm` | 10px | inputs, insets, small thumbs |
| `--r-md` | 16px | **all cards** (the default) |
| `--r-lg` | 24px | heroes, sheets (top corners), modals |
| `--r-pill` | 999px | chips, buttons, badges, avatars |

`rounded-lg`, `rounded-xl`, `rounded-2xl`, `rounded-3xl` all die → map to these
four. Nested radius rule: inner radius = outer radius − inset padding (a 16px
card with 16px padding holds `--r-sm` ≈ 10px children). That's why insets never
look "off" again.

---

## 4. Type — five roles, two faces

Barlow Condensed (display) + Manrope (text) — already loaded, keep them.

| Role | Face / size / line / weight | Case & tracking | Use |
|---|---|---|---|
| Display | Barlow 28/30, 700 | UPPER, +0.01em | page heroes only, 1 per screen |
| Title | Barlow 20/24, 700 | UPPER | card titles, section counts |
| Label | Manrope 11/14, 700 | UPPER, +0.08em, `--ink-low` | section headers, chips, table heads |
| Body | Manrope 15/22, 500 | sentence | everything readable |
| Meta | Manrope 13/18, 500, `--ink-low` | sentence | dates, venues, counts |

Rules: Barlow never below 16px (it's a shout, not a whisper). Numbers that
align (scores, prices, standings) always `tabular-nums`. Prices: Meta size,
gold, `font-weight 700` — money is the only bold meta.

---

## 5. Component recipes (exact numbers)

- **Card**: `--bg-surface`, border 1px `--stroke`, `--r-md`, `p-4`; internal
  vertical `gap-3`; pressable cards get `:active { scale: .98 }` 120ms
  `--ease-out-rondo`.
- **List row** (inside a card): min-height 56px, `py-3`, divider 1px `--stroke`
  between rows (no gaps, no sub-cards), leading icon 20px `--ink-low`,
  `gap-3`.
- **Chip / filter**: height 32px, `px-3`, `--r-pill`, Label type; selected =
  `--gold-dim` fill + gold text + 1px gold border; unselected = transparent +
  1px `--stroke` + `--ink-low`.
- **Button primary**: height 48px, `px-6`, `--r-pill`, gold fill, `--gold-ink`
  text, Title 16px; exactly **one per screen**, lives in the thumb zone.
- **Button secondary**: height 48px, `--bg-inset` fill, `--ink-hi` text, no
  border.
- **Input**: height 48px, `--bg-inset`, `--r-sm`, `px-4`, 1px transparent
  border → gold on focus; label = Label type above, `gap-2`.
- **Sheet**: `--r-lg` top corners, `p-4` + `pb-[env(safe-area-inset-bottom)]`,
  grab handle 32×4px `--stroke` centered `mt-2 mb-4`.
- **Section header**: Label type + optional trailing "View all" Meta link;
  `mt-8 mb-3` always.
- **Stat/meter**: value in Title + `tabular-nums`, label in Label below,
  meter bar 6px `--r-pill`, `--bg-inset` track, gold fill only when the stat
  is money/progress-to-full.
- **Bottom nav**: height 64px + safe-area, `--bg-page` at 92% + blur, active
  item gold icon + Label; inactive `--ink-low`.
- **Empty state**: 48px icon `--ink-low`, Title line, Meta line, secondary
  button — all centered in `py-12`; never a bare sentence on the void.

---

## 6. Layout constants

- Content column: `max-w-lg mx-auto px-4` (already the norm — now it's law).
- Screens end with `pb-24` (clears the nav) — no exceptions, no `pb-20/28/32`.
- Sticky headers: `--bg-page` at 88% + `backdrop-blur-md`, border-b `--stroke`,
  content height 48px.
- Touch minimum 44×44px; two targets never closer than 8px.
- 320px: zero page-level horizontal scroll; only brackets/carousels scroll,
  inside their own `overflow-x-auto` + `overscroll-x-contain`.

## 7. Motion (unchanged, now scoped)

`snappy` = press feedback; `gentle` = entrances (stagger ≤6 items, 40ms step);
`bouncy` = celebrations only (champion block). Nothing animates on keyboard
focus. `prefers-reduced-motion` kills all of it (already in globals).

---

## 8. Rollout plan

1. **Token flip** (one PR): rewrite `globals.css` `:root` to the 12 colors +
   spacing/radius/type tokens above; keep old var names as aliases for one
   release so nothing breaks; delete sidebar/team-dupe/hex strays.
2. **Primitive sweep** (subagent, mechanical): map all `rounded-*` → 4 tokens,
   all off-scale paddings → scale, all `text-white/NN` → ink tokens.
3. **De-boxing pass** (subagent, per route group): feed → games → wallet →
   profile → organizer: apply the depth budget, convert nested cards to
   divider rows / insets, normalize section rhythm to 32/12.
4. **Savage-visual pass** on every route at 320/390/768 to catch what the
   rules missed.
```
