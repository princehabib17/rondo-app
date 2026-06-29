---
name: design-taste-frontend
description: "Anti-slop frontend skill for landing pages, portfolios, and redesigns. The agent reads the brief, infers the right design direction, and ships interfaces that do not look templated. Real design systems when applicable, audit-first on redesigns, strict pre-flight check. Use when building landing pages, portfolios, marketing sites, or redesigns — NOT for dashboards, data tables, or multi-step product UI."
version: 1.0.0
triggers:
  - "landing page"
  - "portfolio"
  - "redesign"
  - "marketing site"
  - "tasteskill"
  - "design-taste"
---

# tasteskill: Anti-Slop Frontend Skill

> Landing pages, portfolios, and redesigns. Not dashboards, not data tables, not multi-step product UI.
> Every rule below is **contextual**. None of it fires automatically. First read the brief, then pull only what fits.

---

## 0. BRIEF INFERENCE (Read the Room Before Anything Else)

Before touching code or tweaking dials, **infer what the user actually wants**. Most LLM design output is bad because the model jumps to a default aesthetic instead of reading the room.

### 0.A Read these signals first
1. **Page kind** - landing (SaaS / consumer / agency / event), portfolio (dev / designer / creative studio), redesign (preserve vs overhaul), editorial / blog.
2. **Vibe words** the user used - "minimalist", "calm", "Linear-style", "Awwwards", "brutalist", "premium consumer", "Apple-y", "playful", "serious B2B", "editorial", "agency-y", "glassy", "dark tech".
3. **Reference signals** - URLs they linked, screenshots they pasted, products they named, brands they're competing with.
4. **Audience** - B2B procurement panel vs. design-conscious consumer vs. recruiter scanning a portfolio. The audience picks the aesthetic, not your taste.
5. **Brand assets that already exist** - logo, color, type, photography. For redesigns, these are starting material, not optional input (see Section 11).
6. **Quiet constraints** - accessibility-first audiences, public-sector, regulated industries, trust-first commerce, kids' products. These constraints OVERRIDE aesthetic preference.

### 0.B Output a one-line "Design Read" before generating
Before any code, state in one line: **"Reading this as: \<page kind> for \<audience>, with a \<vibe> language, leaning toward \<design system or aesthetic family>."**

Example reads:
- *"Reading this as: B2B SaaS landing for technical buyers, with a Linear-style minimalist language, leaning toward Tailwind utilities + Geist + restrained motion."*
- *"Reading this as: solo designer portfolio for hiring managers, with an editorial / kinetic-type language, leaning toward native CSS + scroll-driven animation + custom typography."*
- *"Reading this as: redesign of a public-sector service site, with a trust-first language, leaning toward GOV.UK Frontend or USWDS."*

### 0.C If the brief is ambiguous, ask one question, do not guess
Ask exactly **one** clarifying question — never a multi-question dump — and only when the design read genuinely diverges. Example: *"Should this feel closer to Linear-clean or Awwwards-experimental?"*

If you can confidently infer from context, **do not ask**. Just declare the design read and proceed.

### 0.D Anti-Default Discipline
Do not default to: AI-purple gradients, centered hero over dark mesh, three equal feature cards, generic glassmorphism on everything, infinite-loop micro-animations everywhere, Inter + slate-900. These are the LLM defaults. Reach past them deliberately based on the design read.

---

## 1. THE THREE DIALS (Core Configuration)

After the design read, set three dials. Every layout, motion, and density decision below is gated by these.

* **`DESIGN_VARIANCE: 8`** - 1 = Perfect Symmetry, 10 = Artsy Chaos
* **`MOTION_INTENSITY: 6`** - 1 = Static, 10 = Cinematic / Physics
* **`VISUAL_DENSITY: 4`** - 1 = Art Gallery / Airy, 10 = Cockpit / Packed Data

**Baseline:** `8 / 6 / 4`. Use these unless the design read overrides them.

### 1.A Dial Inference (design read → dial values)

| Signal | VARIANCE | MOTION | DENSITY |
|---|---|---|---|
| "minimalist / clean / calm / editorial / Linear-style" | 5-6 | 3-4 | 2-3 |
| "premium consumer / Apple-y / luxury / brand" | 7-8 | 5-7 | 3-4 |
| "playful / wild / Dribbble / Awwwards / experimental / agency" | 9-10 | 8-10 | 3-4 |
| "landing page / portfolio / marketing site (default)" | 7-9 | 6-8 | 3-5 |
| "trust-first / public-sector / regulated / accessibility-critical" | 3-4 | 2-3 | 4-5 |
| "redesign - preserve" | match existing | +1 | match existing |
| "redesign - overhaul" | +2 | +2 | match existing |

### 1.B Use-Case Presets

| Use case | VARIANCE | MOTION | DENSITY |
|---|---|---|---|
| Landing (SaaS, mainstream) | 7 | 6 | 4 |
| Landing (Agency / creative) | 9 | 8 | 3 |
| Landing (Premium consumer) | 7 | 6 | 3 |
| Portfolio (Designer / studio) | 8 | 7 | 3 |
| Portfolio (Developer) | 6 | 5 | 4 |
| Editorial / Blog | 6 | 4 | 3 |
| Public-sector service | 3 | 2 | 5 |
| Redesign - preserve | match | match+1 | match |
| Redesign - overhaul | +2 | +2 | match |

---

## 2. BRIEF → DESIGN SYSTEM MAP

Once you have the design read (Section 0) and dials (Section 1), pick the right foundation.

### 2.A When to reach for a real design system

| Brief reads as… | Reach for | Why |
|---|---|---|
| Microsoft / enterprise SaaS / dashboards | `@fluentui/react-components` | Official Fluent UI |
| Google-ish UI, Material-flavored product | `@material/web` + Material 3 tokens | Official, theme-able |
| IBM-style B2B / enterprise analytics | `@carbon/react` + `@carbon/styles` | Official Carbon |
| Shopify app surfaces | Polaris React | Required for Shopify admin |
| Atlassian / Jira-style product | `@atlaskit/*` + `@atlaskit/tokens` | Official Atlassian DS |
| GitHub-style devtool | `@primer/css` or `@primer/react-brand` | Official Primer |
| Public-sector UK service | `govuk-frontend` | Legally expected |
| US public-sector / trust-first | `uswds` | Same |
| Fast local-business / agency MVP | Bootstrap 5.3 | Boring, fast, works |
| Modern accessible React foundation | `@radix-ui/themes` | Primitives + polished theme |
| Modern SaaS where you own the components | shadcn/ui (`npx shadcn@latest add ...`) | You own the code |
| Tailwind-based modern SaaS / AI marketing | Tailwind v4 utilities + `dark:` variant | Default for indie + small team |

**One system per project.** Do not mix systems.

### 2.B Aesthetic implementations (no official package)

| Aesthetic | Honest implementation |
|---|---|
| Glassmorphism | `backdrop-filter`, layered borders, highlight overlays. Solid-fill fallback for `prefers-reduced-transparency`. |
| Bento (Apple-style tile grids) | CSS Grid with mixed cell sizes. No single library owns this. |
| Brutalism | Native CSS, monospace, raw borders. |
| Editorial / magazine | Serif type, asymmetric grid, generous whitespace. |
| Dark tech / hacker | Mono + accent neon, terminal motifs. |
| Aurora / mesh gradients | SVG or layered radial gradients. |
| Kinetic typography | Native CSS animations, scroll-driven animations, GSAP for hijacks. |
| **Apple Liquid Glass** | No official `liquid-glass.css`. Web implementations are approximations using `backdrop-filter` + layered borders + highlights. Label clearly as approximation. |

---

## 3. DEFAULT ARCHITECTURE & CONVENTIONS

### 3.A Stack
* **Framework:** React or Next.js. Default to Server Components (RSC).
  * **RSC SAFETY:** Global state works ONLY in Client Components. Wrap providers in `"use client"`.
  * **INTERACTIVITY ISOLATION:** Any component using Motion, scroll listeners, or pointer physics MUST be an isolated leaf with `'use client'` at the top.
* **Styling:** **Tailwind v4** (default). For v4: use `@tailwindcss/postcss`, NOT `tailwindcss` plugin in `postcss.config.js`.
* **Animation:** **Motion** (`import { motion } from "motion/react"`). Not `framer-motion` in new code.
* **Fonts:** Always `next/font` or self-host with `@font-face` + `font-display: swap`. Never `<link>` to Google Fonts in production.

### 3.B State
* Local `useState` / `useReducer` for isolated UI.
* **NEVER** use `useState` to track continuous values driven by user input (mouse position, scroll progress, pointer physics). Use Motion's `useMotionValue` / `useTransform` / `useScroll`.

### 3.C Icons
* **Allowed (priority order):** `@phosphor-icons/react`, `hugeicons-react`, `@radix-ui/react-icons`, `@tabler/icons-react`.
* **Discouraged:** `lucide-react` (only when user explicitly asks or project already depends on it).
* **NEVER hand-roll SVG icons.** One family per project. Standardize `strokeWidth` globally.

### 3.D Emoji Policy
Discouraged by default. Replace with icon-library glyphs. Override only when user explicitly asks for playful / chat-style / social-native vibe.

### 3.E Responsiveness
* **NEVER `h-screen`** for Hero sections. ALWAYS `min-h-[100dvh]`.
* **Grid over Flex-Math:** NEVER `w-[calc(33%-1rem)]`. ALWAYS `grid grid-cols-1 md:grid-cols-3 gap-6`.
* Contain layouts with `max-w-[1400px] mx-auto` or `max-w-7xl`.

### 3.F Dependency Verification (mandatory)
Before importing ANY 3rd-party library, check `package.json`. Output the install command first if missing.

---

## 4. DESIGN ENGINEERING DIRECTIVES (Bias Correction)

### 4.1 Typography
* **Display / Headlines:** Default `text-4xl md:text-6xl tracking-tighter leading-none`.
* **Body / Paragraphs:** Default `text-base text-gray-600 leading-relaxed max-w-[65ch]`.
* **Sans font choice:** Discouraged as default: `Inter`. Pick `Geist`, `Outfit`, `Cabinet Grotesk`, `Satoshi` first.
* **Font pairings:** `Geist` + `Geist Mono`, `Satoshi` + `JetBrains Mono`, `Cabinet Grotesk` + `Inter Tight`.
* **SERIF DISCIPLINE (VERY DISCOURAGED AS DEFAULT):**
  * Serif is acceptable ONLY when: the brand brief literally names a serif font, OR the aesthetic is genuinely editorial / luxury / publication AND you can articulate why this specific serif fits.
  * **Specifically BANNED as defaults:** `Fraunces` and `Instrument_Serif`.
  * For creative/agency/premium briefs, default to sans-serif display (Geist Display, Cabinet Grotesk Display, PP Neue Montreal, GT Walsheim).
* **EMPHASIS RULE:** When emphasizing a word in a headline, use **italic or bold of the SAME font**. Do NOT inject a serif word into a sans headline.
* **ITALIC DESCENDER CLEARANCE (mandatory):** When italic is used in display type with descender letters (`y g j p q`), use `leading-[1.1]` minimum + `pb-1` reserve on the wrapper.

### 4.2 Color Calibration
* Max 1 accent color. Saturation < 80% by default.
* **THE LILA RULE:** No AI purple/blue glow as default. Use neutral bases (Zinc / Slate / Stone) with high-contrast singular accents.
* **One palette per project.** No warm/cool gray mix within the same project.
* **COLOR CONSISTENCY LOCK (mandatory):** Once an accent color is chosen, it is used on the WHOLE page. A warm-grey site does not suddenly get a blue CTA in section 7.
* **PREMIUM-CONSUMER PALETTE BAN (mandatory):**
  * Banned backgrounds: `#f5f1ea`, `#f7f5f1`, `#fbf8f1`, `#efeae0`, `#ece6db`, `#faf7f1`, `#e8dfcb`
  * Banned accents: `#b08947`, `#b6553a`, `#9a2436`, `#9c6e2a`, `#bc7c3a`, `#7d5621`
  * Banned text: `#1a1714`, `#1a1814`, `#1b1814`
  * **Default alternatives (rotate):** Cold Luxury (silver-grey + chrome), Forest (deep green + bone + amber), Black and Tan, Cobalt + Cream, Terracotta + Slate, Olive + Brick + Paper, Pure monochrome + single saturated pop.

### 4.3 Layout Diversification
* **ANTI-CENTER BIAS:** Centered Hero avoided when `DESIGN_VARIANCE > 4`. Force Split Screen (50/50), Left-aligned content / right-aligned asset, Asymmetric white-space, or scroll-pinned structures.
* Override: centered hero is OK for editorial / manifesto / launch-announcement briefs.

### 4.4 Materiality, Shadows, Cards
* Use cards ONLY when elevation communicates real hierarchy. Otherwise group with `border-t`, `divide-y`, or negative space.
* Tint shadows to the background hue. No pure-black drop shadows on light backgrounds.
* **SHAPE CONSISTENCY LOCK (mandatory):** Pick ONE corner-radius scale. Options: all-sharp (0), all-soft (12-16px), all-pill. Mixed systems require a documented rule followed everywhere.

### 4.5 Interactive UI States
* **Loading:** Skeletal loaders matching final layout shape. No generic circular spinners.
* **Empty States:** Beautifully composed; indicate how to populate.
* **Error States:** Clear, inline (forms), or contextual (toasts only for transient).
* **Tactile Feedback:** On `:active`, use `-translate-y-[1px]` or `scale-[0.98]`.
* **BUTTON CONTRAST CHECK (mandatory):** Every CTA text readable against button background. WCAG AA min (4.5:1 body, 3:1 large text 18px+).
* **CTA BUTTON WRAP BAN (mandatory):** Button text MUST fit on one line at desktop.
* **NO DUPLICATE CTA INTENT (mandatory):** One label per intent across the whole page.

### 4.6 Data & Form Patterns
* Label ABOVE input. Error text BELOW input. Standard `gap-2` for input blocks.
* No placeholder-as-label. Ever.

### 4.7 Layout Discipline (Hard Rules)

* **Hero MUST fit in the initial viewport.** Headline max 2 lines on desktop, subtext max 20 words AND max 3-4 lines, CTAs visible without scroll.
* **Hero font-scale discipline.** Default: `text-4xl md:text-5xl lg:text-6xl`. `text-6xl md:text-7xl` only when headline is 3-5 words. A 4-line hero headline is always a font-size error.
* **HERO TOP PADDING CAP (mandatory):** Max `pt-24` at desktop.
* **HERO STACK DISCIPLINE (max 4 text elements):** Eyebrow OR brand strip (zero or one) + Headline + Subtext + CTAs. BANNED in hero: tiny tagline below CTAs, trust micro-strip, pricing teaser, feature bullet list, social-proof avatar row.
* **"Used by / Trusted by" logo wall belongs UNDER the hero, never inside it.**
* **Navigation on ONE line at desktop.** Height cap: 80px max.
* **BENTO CELL COUNT RULE (mandatory):** A bento grid has EXACTLY as many cells as content. No empty cells.
* **Section-Layout-Repetition Ban.** Each layout family can appear at most ONCE on the page. At least 4 different layout families across 8 sections.
* **ZIGZAG ALTERNATION CAP (mandatory).** Max 2 consecutive image+text-split sections. The 3rd is a Pre-Flight Fail.
* **EYEBROW RESTRAINT (mandatory, #1 violated rule):** Maximum 1 eyebrow per 3 sections. Pre-Flight Check: count `uppercase tracking` instances. If count > ceil(sectionCount / 3), output fails.
* **SPLIT-HEADER BAN (mandatory):** "Left big headline + right small explainer paragraph" as a section header is banned as default.
* **Bento Background Diversity (mandatory):** At least 2-3 cells need real visual variation (real image, gradient, pattern, tinted background). No all-white-on-white text cards.
* **Mobile collapse must be explicit per section.**

### 4.8 Image & Visual Asset Strategy

**Priority order:**
1. **Image-generation tool first.** If ANY image-gen tool is available (`generate_image`, MCP image tool, etc.) you MUST use it for hero photography, product shots, texture backgrounds.
2. **Real web images second.** Use `https://picsum.photos/seed/{descriptive-seed}/{w}/{h}` for placeholder photography.
3. **Last resort:** Leave clearly-labeled placeholder slots and tell the user what images are needed.

**Even minimalist sites need real images.** A pure-text page is not minimalism — it is incomplete work.

**Real company logos for social proof.** Use Simple Icons (`https://cdn.simpleicons.org/{slug}/ffffff`) or `devicon`. LOGO-ONLY rule: no industry/category labels below logos.

**Div-based fake screenshots are banned.** Never build a fake product UI out of `<div>` rectangles.

### 4.9 Content Density
* **Default content shape per section:** short headline (≤ 8 words) + short sub-paragraph (≤ 25 words) + one visual asset OR one CTA.
* **Long lists need a different UI component:** 2-column split, card grid, tabs/accordion, horizontal scroll-snap pills, carousel, or marquee — not `<ul>` with `divide-y`.
* **COPY SELF-AUDIT (mandatory before ship):** Re-read every visible string. Flag grammatically broken, unclear referents, AI hallucination phrases, LLM-trying-to-sound-thoughtful copy. Rewrite every flagged string.
* **Fake-precise numbers are flagged.** Numbers must come from real data, be labeled as mock, or be dropped.

### 4.10 Quotes & Testimonials
* Max 3 lines of quote body. Never 6.
* Attribution: name + role + (optionally) company. Never name only.
* Quote marks: use real typographic quotes ( " " ) or none. Not straight ASCII.

### 4.11 Page Theme Lock (Light / Dark Mode Consistency)
* The page has ONE theme. Sections do not invert.
* Default: pick light, dark, or auto (`prefers-color-scheme`) at the page level and lock it. Section-level tints within the same family are fine.

---

## 5. CONTEXT-AWARE PROACTIVITY

These are tools, not defaults. None fire automatically.

* **Liquid Glass / Glassmorphism:** Appropriate for premium consumer, Apple-adjacent, luxury. Go beyond `backdrop-blur`: add 1px inner border + subtle inner shadow. Provide solid-fill fallback under `prefers-reduced-transparency`.
* **Magnetic Micro-physics:** Use when `MOTION_INTENSITY > 5`. Implement EXCLUSIVELY with Motion's `useMotionValue` / `useTransform`. Never `useState`.
* **Perpetual Micro-Interactions:** Use when `MOTION_INTENSITY > 5` AND section actively benefits. Apply Spring Physics (`type: "spring", stiffness: 100, damping: 20`).
* **MOTION MUST BE MOTIVATED (mandatory):** Before any animation, ask: "what does this communicate?" Valid: hierarchy, storytelling, feedback, state transition. Invalid: "it looked cool."
* **MARQUEE MAX-ONE-PER-PAGE (mandatory).**

### 5.A Sticky-Stack - Canonical Skeleton
```tsx
"use client";
import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "motion/react";

gsap.registerPlugin(ScrollTrigger);

export function StickyStack({ cards }: { cards: React.ReactNode[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce || !ref.current) return;
    const ctx = gsap.context(() => {
      const cardEls = gsap.utils.toArray<HTMLElement>(".stack-card");
      cardEls.forEach((card, i) => {
        if (i === cardEls.length - 1) return;
        ScrollTrigger.create({
          trigger: card,
          start: "top top", // pin at viewport top
          endTrigger: cardEls[cardEls.length - 1],
          end: "top top",
          pin: true,
          pinSpacing: false,
        });
        gsap.to(card, {
          scale: 0.92,
          opacity: 0.55,
          ease: "none",
          scrollTrigger: {
            trigger: cardEls[i + 1],
            start: "top bottom",
            end: "top top",
            scrub: true,
          },
        });
      });
    }, ref);
    return () => ctx.revert();
  }, [reduce]);

  return (
    <div ref={ref} className="relative">
      {cards.map((card, i) => (
        <div key={i} className="stack-card sticky top-0 min-h-[100dvh] flex items-center justify-center">
          {card}
        </div>
      ))}
    </div>
  );
}
```

### 5.B Horizontal-Pan - Canonical Skeleton
```tsx
"use client";
import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "motion/react";

gsap.registerPlugin(ScrollTrigger);

export function HorizontalPan({ children }: { children: React.ReactNode }) {
  const wrap = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce || !wrap.current || !track.current) return;
    const ctx = gsap.context(() => {
      const distance = track.current!.scrollWidth - window.innerWidth;
      gsap.to(track.current, {
        x: -distance,
        ease: "none",
        scrollTrigger: {
          trigger: wrap.current,
          start: "top top",
          end: () => `+=${distance}`,
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
        },
      });
    }, wrap);
    return () => ctx.revert();
  }, [reduce]);

  return (
    <section ref={wrap} className="relative overflow-hidden">
      <div ref={track} className="flex h-[100dvh] items-center">
        {children}
      </div>
    </section>
  );
}
```

### 5.C Scroll-Reveal Stagger - Canonical Skeleton
```tsx
"use client";
import { motion, useReducedMotion } from "motion/react";

export function RevealStagger({ items }: { items: string[] }) {
  const reduce = useReducedMotion();
  return (
    <ul className="grid gap-6">
      {items.map((item, i) => (
        <motion.li
          key={item}
          initial={reduce ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
        >
          {item}
        </motion.li>
      ))}
    </ul>
  );
}
```

### 5.D Forbidden Animation Patterns
* **`window.addEventListener("scroll", ...)`** is banned. Use Motion's `useScroll()`, GSAP's `ScrollTrigger`, IntersectionObserver, or CSS scroll-driven animations.
* **Custom scroll progress using `window.scrollY`** in React state — re-renders on every frame.
* **`requestAnimationFrame` loops that touch React state.** Use `useMotionValue` + `useTransform`.

---

## 6. PERFORMANCE & ACCESSIBILITY GUARDRAILS

### 6.A Hardware Acceleration
* Animate ONLY `transform` and `opacity`. Never `top`, `left`, `width`, `height`.
* Use `will-change: transform` sparingly.

### 6.B Reduced Motion (mandatory)
* **Any motion above `MOTION_INTENSITY > 3` MUST honor `prefers-reduced-motion`.**
* In Motion: wrap with `useReducedMotion()` and degrade to static.
* Infinite loops, parallax, scroll-hijack, and magnetic physics MUST collapse to static under reduced motion.

### 6.C Dark Mode (mandatory for consumer-facing pages)
* Design for **both modes from the start**.
* Use Tailwind `dark:` variant OR CSS variables. Pick one strategy per project.
* No pure `#000000` and no pure `#ffffff` — use off-black (zinc-950) and off-white.

### 6.D Core Web Vitals Targets
* **LCP** < 2.5s. Hero image must be `next/image priority` or preloaded.
* **INP** < 200ms. Heavy work off main thread.
* **CLS** < 0.1. Reserve space for images, fonts, embeds.

### 6.E DOM Cost
* Grain/noise filters EXCLUSIVELY on fixed, `pointer-events-none` pseudo-elements. NEVER on scrolling containers.

### 6.F Z-Index Restraint
NEVER spam arbitrary `z-50`. Use z-index strictly for systemic layer contexts (sticky navbars, modals, overlays, grain).

---

## 8. DARK MODE PROTOCOL

### 8.A Token Strategy
* **Tailwind `dark:` variant** (default for utility-first): pair every color utility with its dark variant.
* **CSS variables** (for component libraries): define semantic tokens (`--surface`, `--text-primary`, `--accent`) and swap under `[data-theme="dark"]`.

### 8.B Enforcement
* **Contrast** - WCAG AA minimum for body text, AAA target for hero copy.
* **Hierarchy parity** - visual hierarchy that works in light must work in dark.
* **No pure `#000000` / `#ffffff`** — use off-black and off-white.

### 8.C Default Mode
Respect `prefers-color-scheme` unless brand insists. Test in both modes before finishing.

---

## 9. AI TELLS (Forbidden Patterns)

### 9.A Visual & CSS
* **NO neon / outer glows** by default.
* **NO pure black (`#000000`).**
* **NO oversaturated accents.**
* **NO excessive gradient text** for large headers.
* **NO custom mouse cursors.**

### 9.B Typography
* **AVOID Inter as default.**
* **NO oversized H1s** that just scream.

### 9.C Layout & Spacing
* **NO 3-column equal feature cards.**

### 9.D Content & Data ("Jane Doe" Effect)
* **NO generic names.** Use creative, realistic, locale-appropriate names.
* **NO generic avatars.** Use believable photo placeholders.
* **NO fake-perfect numbers.** Use organic, messy data (`47.2%`, `+1 (312) 847-1928`).
* **NO startup-slop brand names.** "Acme", "Nexus", "SmartFlow" → invent contextual, premium names.
* **NO filler verbs.** "Elevate", "Seamless", "Unleash", "Next-Gen" → concrete verbs only.

### 9.F Production-Test Tells (banned outright)

**Hero & top-of-page**
* NO version labels in hero (`V0.6`, `BETA`, `EARLY ACCESS`).
* NO "Brand · No. 01"-style sub-eyebrows.

**Section numbering & micro-labels**
* NO section-number eyebrows (`00 / INDEX`, `001 · Capabilities`).
* NO `01 / 4`-style pagination on images or bento tiles.
* NO scroll cues (`Scroll`, `↓ scroll`, `Scroll to explore`, animated mouse-wheel icons).

**Separators & dots**
* Middle-dot (`·`) is rationed. Maximum 1 per line in metadata strips.
* NO decorative colored status dots on every list/nav/badge.

**Fake product previews**
* NO div-based fake product UI in the hero. It is the #1 LLM-design Tell.
* NO fake version footers inside fake screenshots.

**Marketing-copy Tells**
* NO "Quietly in use at" / "Quietly trusted by".
* NO "From the field" / "Field notes" / "Currently on the bench" labels.
* NO weather / locale strips ("LIS 14:23 · 18°C") unless brief is explicitly place-focused.
* NO generic step labels ("Stage 1 / Stage 2 / Stage 3").

**Decoration**
* NO decoration text strip at hero bottom (`BRAND. MOTION. SPATIAL.`).
* NO floating top-right sub-text in section headings.
* NO `border-t` + `border-b` on every row of a long list.
* NO scoring/progress bars with filled background tracks as comparison visuals.

### 9.G EM-DASH BAN (the single most-violated Tell)

**Em-dash (`—`) is COMPLETELY banned.** Zero. No exceptions.

* Banned in headlines — use a period or a comma.
* Banned in body copy — restructure: two sentences, a comma, parentheses, or a colon.
* Banned in quote attribution — use a normal hyphen with spaces (` - `) or a line break.

The ONLY permitted dash characters: regular hyphen `-` and minus sign in math.

If your output contains a single `—` anywhere visible, the output fails Pre-Flight and must be rewritten.

---

## 10. REFERENCE VOCABULARY

### Hero Paradigms
* **Asymmetric Split Hero** - Text one side, asset other, generous white space.
* **Editorial Manifesto Hero** - Large type, no asset, almost-poster.
* **Video / Media Mask Hero** - Type cut as mask over video background.
* **Kinetic-Type Hero** - Animated typography as primary visual.
* **Curtain-Reveal Hero** - Hero parts on scroll like a curtain.
* **Scroll-Pinned Hero** - Hero stays pinned while content scrolls behind.

### Layout & Grids
* **Bento Grid** - Asymmetric tile grouping (Apple Control Center).
* **Masonry Layout** - Staggered grid, no fixed row height.
* **Split-Screen Scroll** - Two halves sliding in opposite directions.
* **Sticky-Stack Sections** - Sections that pin and stack on scroll.

### Scroll Animations
* **Sticky Scroll Stack** - Cards stick and physically stack.
* **Horizontal Scroll Hijack** - Vertical scroll → horizontal pan.
* **Zoom Parallax** - Central background image zooming on scroll.

### Animation Library Choice
* **Motion (`motion/react`)** - default for UI / Bento / state-change motion.
* **GSAP + ScrollTrigger** - for full-page scrolltelling and scroll hijacks.
* **Three.js / WebGL** - for canvas backgrounds and 3D scenes.
* **NEVER mix GSAP / Three.js with Motion in the same component tree.**

---

## 11. REDESIGN PROTOCOL

### 11.A Detect the Mode
* **Greenfield** - no existing site, or full overhaul approved.
* **Redesign - Preserve** - modernise without breaking the brand. Audit first.
* **Redesign - Overhaul** - new visual language on existing content.

### 11.B Audit Before Touching
Document: brand tokens, information architecture, content blocks, patterns to preserve, patterns to retire, dial reading of existing site, SEO baseline.

### 11.C Preservation Rules
* Do not change information architecture unless asked.
* Preserve copy voice unless asked for a rewrite.
* Honor existing accessibility wins.
* Respect existing analytics events.

### 11.D Modernisation Levers (priority order)
1. Typography refresh
2. Spacing & rhythm
3. Color recalibration
4. Motion layer
5. Hero & key-section recomposition
6. Full block replacement (only when unsalvageable)

### 11.F What Never Changes Silently
Never modify: URL structure, primary nav labels, form field names/order, brand logo, existing legal/consent/cookie copy.

---

## 13. OUT OF SCOPE

This skill is NOT for:
* Dashboards / dense product UI / admin panels
* Data tables
* Multi-step forms / wizards
* Code editors
* Native mobile
* Realtime collab UIs

---

## 14. FINAL PRE-FLIGHT CHECK

**Run every box. If any box fails, the output is not done.**

- [ ] Brief inference declared (Section 0.B one-liner)?
- [ ] Dial values explicit and reasoned from the brief?
- [ ] Design system chosen or aesthetic labeled honestly?
- [ ] Redesign mode detected and audit performed (if applicable)?
- [ ] **ZERO em-dashes (`—`) anywhere on the page.** Zero. Non-negotiable.
- [ ] Page Theme Lock: ONE theme for the whole page?
- [ ] Color Consistency Lock: one accent color across all sections?
- [ ] Shape Consistency Lock: one corner-radius system?
- [ ] Button Contrast Check: every CTA text readable (WCAG AA 4.5:1)?
- [ ] CTA Button Wrap: no CTA label wraps to 2+ lines at desktop?
- [ ] Serif discipline: NOT Fraunces or Instrument_Serif without justification?
- [ ] Premium-consumer palette check: NOT the beige+brass+oxblood default?
- [ ] Italic descender clearance: `leading-[1.1]` min + `pb-1` for descender letters?
- [ ] Hero fits the viewport: headline ≤ 2 lines, subtext ≤ 20 words, CTA visible?
- [ ] Hero top padding: max `pt-24` at desktop?
- [ ] Hero stack discipline: max 4 text elements, no tagline below CTAs?
- [ ] EYEBROW COUNT: ≤ ceil(sectionCount / 3) total eyebrows?
- [ ] Split-Header Ban: no left-headline + right-floater pattern as section header?
- [ ] Zigzag Alternation Cap: no 3+ consecutive image+text-split sections?
- [ ] No Duplicate CTA Intent: one label per intent on the whole page?
- [ ] Logo wall = logos only, uses SVG logos (Simple Icons), lives UNDER hero?
- [ ] Bento Background Diversity: at least 2-3 cells have real visual variation?
- [ ] Copy Self-Audit: every visible string re-read, no AI-hallucinated phrases?
- [ ] Motion motivated: every animation justified in one sentence?
- [ ] Marquee max-one-per-page?
- [ ] Navigation on ONE line at desktop, height ≤ 80px?
- [ ] Section-Layout-Repetition: at least 4 different layout families across 8 sections?
- [ ] Bento: exact cell count (N items → N cells, no empty cells)?
- [ ] Real images used (gen-tool first, then Picsum-seed, then placeholder slots)?
- [ ] No div-based fake screenshots?
- [ ] No pills/labels overlaid on images?
- [ ] No version footers on marketing pages?
- [ ] No locale / city-name / time / weather strips unless brief is place-focused?
- [ ] No scroll cues?
- [ ] No section-numbering eyebrows?
- [ ] No decorative status dots?
- [ ] Quotes ≤ 3 lines, attribution clean (no em-dash)?
- [ ] `min-h-[100dvh]`, never `h-screen`?
- [ ] `useEffect` animations have strict cleanup functions?
- [ ] Empty / loading / error states provided?
- [ ] Icons from allowed library only (Phosphor / HugeIcons / Radix / Tabler)?
- [ ] Motion isolated in client-leaf components with `'use client'`?
- [ ] No AI Tells from Section 9?
- [ ] Core Web Vitals plausibly hit (LCP < 2.5s, INP < 200ms, CLS < 0.1)?
- [ ] One design system per project?
- [ ] Dark mode tokens defined and tested in both modes?
- [ ] Reduced motion wrapped for everything `MOTION_INTENSITY > 3`?

---

## APPENDIX A — Install Commands

```bash
# Tailwind v4
npm install tailwindcss @tailwindcss/postcss

# Motion (formerly Framer Motion)
npm install motion

# GSAP
npm install gsap

# Phosphor Icons
npm install @phosphor-icons/react

# shadcn/ui
npx shadcn@latest init

# Radix Themes
npm install @radix-ui/themes

# Geist font
npm install geist

# Simple Icons (for logo walls)
npm install simple-icons
# Or CDN: https://cdn.simpleicons.org/{slug}/ffffff
```

## APPENDIX B — Apple Liquid Glass Web Approximation

```css
/* NOT official Apple Liquid Glass — web glassmorphism approximation */
.liquid-glass-web-approx {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  border-radius: 999px;
  border: 1px solid rgb(255 255 255 / .32);
  background:
    linear-gradient(135deg, rgb(255 255 255 / .30), rgb(255 255 255 / .08)),
    rgb(255 255 255 / .12);
  backdrop-filter: blur(24px) saturate(180%) contrast(1.05);
  -webkit-backdrop-filter: blur(24px) saturate(180%) contrast(1.05);
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / .48),
    inset 0 -1px 0 rgb(255 255 255 / .12),
    0 18px 60px rgb(0 0 0 / .18);
}

@media (prefers-color-scheme: dark) {
  .liquid-glass-web-approx {
    border-color: rgb(255 255 255 / .18);
    background:
      linear-gradient(135deg, rgb(255 255 255 / .16), rgb(255 255 255 / .04)),
      rgb(15 23 42 / .42);
  }
}

@media (prefers-reduced-transparency: reduce) {
  .liquid-glass-web-approx {
    background: rgb(255 255 255 / .96);
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
  }
}
```
