---
version: alpha
name: Strava
description: "An athletic, energetic dark-and-light UI built on Strava Orange (#FC4C02), where activity feeds, route maps, and stat grids turn every run and ride into shareable data, and kudos make effort social."

colors:
  primary: "#FC4C02"
  on-primary: "#FFFFFF"
  primary-hover: "#E34402"
  primary-pressed: "#C53B02"
  primary-subtle: "#FFEDE5"
  ink: "#1A1A1C"
  ink-muted: "#6D6D78"
  ink-subdued: "#9A9AA5"
  canvas: "#FFFFFF"
  surface-1: "#F7F7FA"
  surface-2: "#EDEDF0"
  surface-dark: "#242428"
  on-dark: "#FAFAFA"
  border: "#E2E2E8"
  kudos: "#FC4C02"
  segment-gold: "#F2C14E"
  success: "#1E9E5A"
  warning: "#E5A12C"
  danger: "#E0322B"

typography:
  display:
    fontFamily: "Maison Neue, Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: 32px
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: -0.02em
  heading:
    fontFamily: "Maison Neue, Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: 20px
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: -0.01em
  body:
    fontFamily: "Maison Neue, Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: 15px
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: 0em
  mono:
    fontFamily: "Maison Neue Mono, SFMono-Regular, Menlo, monospace"
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: 0em

spacing:
  base: 4px
  scale: [4, 8, 12, 16, 20, 24, 32, 40, 56, 80]

radius:
  sm: 4px
  md: 8px
  lg: 12px
  pill: 9999px

shadows:
  card: "0 1px 3px rgba(0,0,0,0.10)"
  elevated: "0 6px 20px rgba(0,0,0,0.14)"
  sticky: "0 -2px 12px rgba(0,0,0,0.08)"

motion:
  duration-fast: 120ms
  duration-base: 220ms
  easing: cubic-bezier(0.2, 0, 0.1, 1)
---

## Rationale

**Effort is the content, orange is the energy** — Strava turns physical exertion into data worth sharing, so the feed is the heart of the product: a stream of activities with maps, stats, and social reactions. Strava Orange (#FC4C02) is the high-energy brand color that owns the primary actions — record, follow, and above all the kudos button — plus the brand mark and active states. It is rationed to interactive and athletic-energy moments so the feed itself, rich with maps and numbers, stays readable while orange marks what to do next.

**Numbers earn their weight** — Distance, pace, elevation, power, heart rate, time: an athlete's identity lives in these figures, and the design treats them as first-class. Stat grids use large, bold, tightly-tracked numerals with small muted labels beneath, so a glance reads the headline metric and the detail follows. Tabular figures keep splits and leaderboards aligned. The typography hierarchy is built so a personal record is visually loud and its unit label quietly supportive.

**Maps make the achievement real** — A route map is proof and trophy at once. Activity cards lead with a map snapshot of the GPS track, and full activities render an interactive map with the route, segments, and a heatmap of where the athlete has been. The neutral surface palette (whites and cool greys, plus a dark #242428 for map-forward and night contexts) is engineered to let map polylines and orange route traces pop against terrain.

**Social proof drives the habit** — Kudos, comments, and segment leaderboards turn solitary training into a community. The kudos button — a thumbs-up that fills orange when given — is the most-tapped affordance in the app, so it is sized and placed for instant reach. Leaderboards (overall, by age, by club) and crowns for segment records add competition, making the design a scoreboard as much as a journal.

## 1. Visual Theme & Atmosphere
Strava feels athletic, fast, and data-dense without clutter. The light feed sits on white and cool-grey surfaces so map snapshots and orange accents carry the energy, while map-forward and night screens shift to a dark #242428 that makes route polylines and elevation profiles glow. Cards are crisp with modest 8–12px corners — sportier and more precise than a soft consumer app — and stats are laid out on tight grids that read like a dashboard.

The atmosphere is competitive and motivating. Every activity is framed as an accomplishment: a bold title, a hero map, a row of headline stats, and a social footer of kudos and comments. The orange record button and kudos thumbs are the recurring energy beats, signaling action and community against an otherwise neutral, legible frame.

## 2. Color System
**Light surfaces**:
- Canvas: #FFFFFF — feed and content background
- Surface 1: #F7F7FA — cards, grouped sections, input fills
- Surface 2: #EDEDF0 — pressed states, dividers, skeletons
- Border: #E2E2E8 — card edges and structural dividers

**Dark surface**:
- Surface dark: #242428 — map-forward views, night mode, full-screen maps
- On-dark: #FAFAFA — text and icons over the dark surface

**Brand action**:
- Strava Orange: #FC4C02 — record, kudos, follow, brand mark, active states
- Hover: #E34402 — deeper on press
- Pressed: #C53B02 — darkest, confirms commit
- Subtle: #FFEDE5 — orange-tinted badge and selected-chip backgrounds

**Text**:
- Ink: #1A1A1C — names, titles, headline stats
- Muted: #6D6D78 — stat labels, metadata, timestamps
- Subdued: #9A9AA5 — placeholders, disabled states

**Semantic & athletic**:
- Kudos: #FC4C02 — given-kudos fill
- Segment gold: #F2C14E — crowns, KOM/QOM and PR markers
- Success: #1E9E5A — goals met, healthy zones
- Warning: #E5A12C — attention, pending uploads
- Danger: #E0322B — errors, destructive confirm

Strava Orange stays bound to actions and athletic energy — it is not used for body text or large background fills behind stats.

## 3. Typography
Strava uses Maison Neue, a clean neo-grotesque with strong, confident forms that suit an athletic brand, falling back to Helvetica Neue. Display and activity titles run 24–32px in 700 with tight −0.02em tracking, giving accomplishments a bold, headline feel. Section headings sit at 20px Semibold.

The defining typographic move is the stat: a large bold number (often 24–32px) paired with a small muted uppercase-ish label below (DISTANCE, PACE, ELEV GAIN). This number-over-label pattern repeats across cards, the stat grid, and segment results so metrics are scannable at a glance. Tabular figures keep splits, paces, and leaderboard times aligned in columns.

Body runs 15px at 1.45 for feed copy, comments, and descriptions. A mono variant handles fixed-width metric readouts where column alignment matters most, such as split tables and live recording stats.

## 4. Components & Patterns
**Activity card**:
- Athlete avatar, name, time/place header, then activity title
- Hero map snapshot of the GPS route, plus a stat row (distance, pace, elevation)
- Social footer: kudos count, comment count, and the kudos/comment actions

**Kudos button**:
- Thumbs-up that fills Strava Orange when given, with a quick pop animation
- Shows a running kudos count and a stacked avatar list of who gave them
- The most-tapped control — placed for one-handed reach in the feed

**Segment leaderboard**:
- Ranked table of athletes on a segment with time, pace, and date
- Crown/segment-gold marker for KOM/QOM; filter tabs (Overall, Age, Club, Following)
- The athlete's own rank pinned and highlighted

**Route map**:
- Interactive map rendering the GPS polyline in orange over terrain
- Tappable segments along the route, start/finish markers, elevation overlay
- Full-screen on dark surface for maximum contrast

**Stats grid**:
- Dashboard of number-over-label cells: distance, moving time, pace, elevation, calories
- Headline metric enlarged; secondary metrics in a tidy aligned grid
- Splits table below with per-km/mile pace bars

**Elevation & pace charts**:
- Area/line charts of elevation profile and pace over distance
- Scrubbable to read the metric at any point on the route
- Color-coded effort zones using semantic hues

**Heatmap**:
- Aggregated map of all an athlete's activities, hot orange where routes overlap
- Used for personal history and global route discovery
- Renders on the dark surface so density glows

**Segment leaderboard crown / achievement chip**:
- Gold crown for KOM/QOM, PR ribbon for personal records
- Awarded inline on activity detail and in the segment list
- Small celebratory badges that reinforce competition

**Record / start button**:
- Prominent orange action to begin recording a run, ride, or workout
- Becomes a live recording panel with running stats and pause/stop
- Mono live readouts for time, distance, and pace

**Athlete profile header**:
- Avatar, name, follower/following counts, and weekly/yearly totals
- Follow button in orange; trophy case of recent achievements
- Activity history feed below

## 5. Spacing & Layout
Strava uses a 4px base grid for precise, dashboard-like stat layouts. Card padding is 16px; the gap between feed cards is 8–12px. Stat grids align to the grid so number-over-label cells line up cleanly across a row. Edge gutters are 16px on mobile, widening on tablet and web with a centered feed column.

The mobile feed is a single scrolling column of activity cards; activity detail stacks map, stats, splits, and social sections. Map-forward screens go edge-to-edge on the dark surface. On web, a centered content column carries the feed with a secondary rail for suggested athletes and challenges.

## 6. Motion & Interaction
**Kudos pop**: tapping kudos fills the thumbs orange with a quick scale-pop and bumps the count — instant, satisfying confirmation of the most common action, ~120ms.

**Map draw-in**: route polylines animate drawing along the GPS track when an activity opens, tracing the effort at 220ms on `cubic-bezier(0.2, 0, 0.1, 1)`.

**Stat count-up**: headline numbers can count up on first reveal, lending a sense of accomplishment to a finished activity.

**Sheet + chart scrub**: filter sheets slide up and charts scrub responsively under the finger, reading the metric at the touched point without lag.

**Skeleton loading**: grey (#EDEDF0) placeholder cards with shimmer fill the feed while activities and maps load, matched to real card dimensions.

## Accessibility

### Contrast Ratios
- **#1A1A1C ink on #FFFFFF canvas**: 17.2:1 — passes AAA
- **#1A1A1C ink on #F7F7FA surface-1**: 16.4:1 — passes AAA
- **#6D6D78 muted on #FFFFFF**: 5.0:1 — passes AA
- **#9A9AA5 subdued on #FFFFFF**: 2.7:1 — fails AA; placeholder/decorative only
- **#FFFFFF on #FC4C02 primary**: 3.4:1 — fails AA for small text; CTA labels use 16px+ bold
- **#FC4C02 orange text on #FFFFFF**: 3.4:1 — fails AA for normal text; use pressed #C53B02 (5.0:1) for orange text
- **#FAFAFA on-dark on #242428 surface-dark**: 14.8:1 — passes AAA
- **#1A1A1C on #F2C14E segment-gold**: 11.3:1 — passes AAA (gold carries dark text)
- **#1E9E5A success on #FFFFFF**: 3.5:1 — fails AA for small text; pair with icon or use larger

### Minimum Requirements
- **Touch target**: 44×44px minimum; the kudos and record buttons are sized generously for one-handed, on-the-move use
- **Focus indicator**: 2px solid #FC4C02 outline with 2px offset on interactive elements
- **Stat clarity**: every headline number keeps its unit label so metrics are never ambiguous to screen readers
- **Achievements not color-only**: KOM/PR markers pair gold with a crown/ribbon icon and text label

### Motion
- Respects `prefers-reduced-motion`: yes — kudos pop, map draw-in, and stat count-up reduce to instant final states
- Under reduced motion, route maps render fully drawn immediately and numbers appear at final value

### Notes
- Strava Orange (#FC4C02) on white is only 3.4:1 — use it as a fill behind white 16px+ bold text or as an icon; for orange-colored text on white, switch to the pressed #C53B02 (5.0:1)
- The dark surface (#242428) is reserved for map-forward and night contexts where polyline and heatmap contrast matters most; its on-dark text holds AAA
- Segment gold (#F2C14E) is decorative/iconographic and must carry dark text; never use it as light text on white
- Map polylines must not rely on color alone to distinguish segments — pair with markers, labels, or distinct line styles for color-blind athletes
