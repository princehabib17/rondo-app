# Tournament Pages — Redesign Plan (2026-07-03)

## Vision

Tournaments are the highest-drama surface in Rondo, and right now they read like
admin tables. Target feel: **matchday broadcast graphics** — the Champions League
of barangay futsal. Pitch-black ground, gold reserved for winners/actions/money,
Barlow Condensed doing the shouting. The **bracket is the hero artifact**: people
should screenshot it and post it in the group chat.

Design gates (from `.agents/skills/savage-visual`): gold in ≤3 semantic roles per
screen (actions, money, winners); one unmistakable primary action per screen; no
horizontal scroll at 320px except the bracket's own intentional scroll container;
44px touch targets; empty states art-directed, never text-on-void; skeletons
shaped like the content they replace. Motion per `components/motion/springs.ts`
and Emil rules: entrances `ease-out`, `:active` scale on tappables, two-keyframe
springs max, `prefers-reduced-motion` respected (globals.css already guards).

## Component contracts (LOCKED — pages may rely on these)

Prop signatures stay backward compatible; only optional props may be added.

- `TournamentCard({ tournament, href })` — image-first card, CSS floodlight
  scene (no external assets), LIVE status pulse, gold price, capacity bar.
- `BracketView({ matches, teams, highlightTeamId?, onMatchTap? })` — connector
  lines between rounds (CSS borders or inline SVG), winner path in gold,
  champion slot crowned, live pulse on in-progress final states, dashed TBD,
  scroll-snap columns. `onMatchTap(match)` fires only for tappable matches
  (used by organizer manage for score entry).
- `StandingsTable({ matches, teams, highlightTeamId? })` — leader in gold,
  qualification cut line after configurable top-N (default 1), zebra rows,
  sticky header, `highlightTeamId` row marked "YOU".
- **NEW** `TournamentHero({ tournament, teamCount })` — shared detail-page hero:
  radial floodlight CSS backdrop, trophy mark, condensed display title, meta
  chips (date · venue · format · team size · fee), status ribbon; countdown
  chip ("Starts in 3d") during registration.

## Work packages (disjoint file scopes)

### WP-A — Shared components + player pages (the showcase)
Files: `components/tournament/*` (incl. new `TournamentHero.tsx`),
`app/(player)/tournaments/page.tsx`, `app/(player)/tournaments/[id]/page.tsx`.

1. Rebuild the three components + hero to the contracts above.
2. List page: header keeps glass nav; filter chips get counts ("Live · 2");
   empty state = floodlight CSS scene + trophy silhouette + copy + CTA to feed;
   skeletons match card geometry; card entrance stagger (gentle spring, ≤6).
3. Detail page: `TournamentHero` on top; sections Bracket / Standings (or Teams
   during registration); registration panel becomes a **sticky bottom action
   card** (thumb zone): team-name input + gold register CTA, disabled states
   explain why ("Registration closed", "Tournament full", guest → signup link
   preserving `next=`). When the viewer captains a team: "Your team" treatment
   via `highlightTeamId` in bracket + standings. Completed tournaments open on
   a champion block (winner name + trophy + final score) above the bracket.

### WP-B — Organizer pages
Files: `app/(organizer)/organizer/tournaments/page.tsx`, `create/page.tsx`,
`[id]/manage/page.tsx`. Must NOT edit `components/tournament/*` — consume the
locked contracts only.

1. List: same card language; primary CTA "New tournament" prominent, gold.
2. Create: group the form into labeled sections (Basics / Format / Money /
   Schedule); add a **live preview** `TournamentCard` that updates as fields
   change; inline validation copy in plain language; publish CTA gold.
3. Manage: status-driven layout — registration: roster + big gold "Start
   tournament" (confirm dialog states what locks); active: `BracketView` with
   `onMatchTap` opening a score sheet (two steppers, large touch targets,
   knockout draw guard mirrors API rule); completed: champion celebration
   block. Realtime refresh already exists — keep it.

## Hard constraints (both packages)

- No new dependencies. No API/route changes. No prop-signature breaks.
- Zero raw hex: use existing tokens (`rondo-accent`, `rondo-surface`,
  `font-heading`, springs). New CSS utilities go in globals.css as tokens.
- `npx eslint . ` → 0 warnings; `npx tsc --noEmit` clean; `npm test` green.
- Every screen must hold at 320px (bracket scrolls inside its own container).

## Verification

Lead session: lint/typecheck/tests on the combined tree, then a savage-visual
screenshot pass on `/tournaments` (renders with empty data without a backend)
at 320/390/768 before commit.
