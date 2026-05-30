# [Brand] — Design System Spec v0.1

> Companion document to `cleaning-platform-spec.md`.
> This document defines the visual language. The product spec defines behavior. Use both together.

---

## 1. Design philosophy

We are building a **Swiss luxury brokerage**, not a cleaning service. Every visual choice should signal: discretion, precision, calm authority, and the kind of taste that takes years of access to acquire.

Three guiding tensions:

1. **Editorial, not corporate.** We borrow from luxury watch and art magazines, not from B2B SaaS landing pages.
2. **Confident restraint.** Negative space is the design. If a section feels "too empty," it is probably right.
3. **No theatrics.** No gradients, no glassmorphism, no animated backgrounds, no emoji. The customer's first impression should be that we are serious people running a serious operation.

Anti-references (do _not_ look like these): Batmaid, Helpling, Helpling competitors, generic Shopify themes, Vercel template gallery. If a stranger could mistake us for one of those, we have failed.

References to aim toward: Bottega Veneta's editorial pages, Hermès Petit h, NetJets' brand language, Belvedere Hotels, the Hodinkee weekend edition.

---

## 2. Design tokens

All tokens are exposed as CSS custom properties and Tailwind theme extensions. Never hard-code these values in components.

### 2.1 Color palette

```css
:root {
  /* Surface */
  --color-bg: #ffffff; /* primary background */
  --color-bg-subtle: #f8fafc; /* card / section alternation */
  --color-bg-elevated: #ffffff; /* modals, popovers (with shadow) */

  /* Ink */
  --color-ink: #0f172a; /* primary text, headings */
  --color-ink-muted: #475569; /* secondary text, captions */
  --color-ink-subtle: #94a3b8; /* tertiary, placeholders, meta */
  --color-ink-inverse: #ffffff; /* text on dark backgrounds */

  /* Accent — used ≤ 10% of any view */
  --color-accent: #d4af37; /* primary accent (gold) */
  --color-accent-hover: #bda03c; /* darker on hover */
  --color-accent-soft: #fbf8eb; /* tint, for badges or highlights */

  /* Structure */
  --color-border: #e2e8f0; /* 1px dividers, input borders */
  --color-border-strong: #cbd5e1; /* hover state on inputs */

  /* Semantic — used sparingly */
  --color-success: #15803d; /* booking confirmed */
  --color-warning: #b45309; /* quote expiring */
  --color-danger: #b91c1c; /* errors, cancellations */
}
```

**Rules of use:**

- 60% `--color-bg` / 30% `--color-ink` / 10% accent. The accent is for _attention_, not decoration.
- Never pair `--color-accent` with `--color-success`, `--color-warning`, or `--color-danger` in the same component. The gold is the brand voice; semantic colors are functional alerts. Mixing them muddies both.
- No pure black (`#000000`). Always `--color-ink`.
- No pure-tone gradients. The only allowed "gradient" is a 4% white-to-`--color-bg-subtle` vertical wash on hero sections, and only if needed.

### 2.2 Typography

**Fonts (Google Fonts, both):**

- **Display** — `Playfair Display`, weights 500 (regular display) and 700 (bold display)
- **Body** — `Inter`, weights 400, 500, 600

> Optional upgrade path: swap Playfair Display for **Fraunces** (more characterful, modern serif with variable-axis support) and Inter for **Geist** (more distinctive, still Swiss-clean) once you want a stronger signature. Both are free and open-source.

**Type scale (1.25 modular, with editorial display sizes):**

| Token        | Size (desktop)   | Size (mobile)    | Line height | Weight | Letter spacing | Font             |
| ------------ | ---------------- | ---------------- | ----------- | ------ | -------------- | ---------------- |
| `display-xl` | 72px / 4.5rem    | 44px / 2.75rem   | 1.05        | 500    | -0.03em        | Playfair Display |
| `display-lg` | 56px / 3.5rem    | 36px / 2.25rem   | 1.1         | 500    | -0.025em       | Playfair Display |
| `display-md` | 40px / 2.5rem    | 28px / 1.75rem   | 1.15        | 500    | -0.02em        | Playfair Display |
| `display-sm` | 28px / 1.75rem   | 22px / 1.375rem  | 1.2         | 600    | -0.015em       | Playfair Display |
| `body-lg`    | 18px / 1.125rem  | 17px / 1.0625rem | 1.65        | 400    | 0              | Inter            |
| `body-md`    | 16px / 1rem      | 16px / 1rem      | 1.6         | 400    | 0              | Inter            |
| `body-sm`    | 14px / 0.875rem  | 14px / 0.875rem  | 1.55        | 400    | 0              | Inter            |
| `caption`    | 12px / 0.75rem   | 12px / 0.75rem   | 1.5         | 500    | 0.05em         | Inter, ALL-CAPS  |
| `button`     | 15px / 0.9375rem | 15px / 0.9375rem | 1           | 600    | 0.01em         | Inter            |

**Rules of use:**

- Page H1: always `display-xl`. Never two H1s on a page.
- Section headers: `display-lg` or `display-md`.
- Card/component headers: `display-sm` or `body-lg` weight 600.
- `caption` (12px, all-caps, letter-spaced) is for over-line labels — e.g. "AVIATION" above "Private jet detailing". This is one of the most distinctive editorial markers in the system. Use it.
- Body text never exceeds 70 characters per line. Use `max-width: 65ch` on long-form paragraphs.

### 2.3 Spacing scale

Base unit: 4px. All spacing uses this scale. No arbitrary values.

```
space-0:     0
space-1:     4px
space-2:     8px
space-3:     12px
space-4:     16px
space-5:     20px
space-6:     24px
space-8:     32px
space-10:    40px
space-12:    48px
space-16:    64px
space-20:    80px
space-24:    96px
space-32:    128px
space-40:    160px
space-48:    192px
```

**Section vertical rhythm (desktop → mobile):**

- Between major sections: `space-40` desktop → `space-20` mobile
- Between subsections within a section: `space-16` desktop → `space-10` mobile
- Between heading and first content: `space-8` desktop → `space-6` mobile
- Between cards in a grid: `space-8` desktop → `space-6` mobile

> The original style guide's 120-160px figure works for desktop but is unusable on mobile. Always halve large vertical rhythms at `md` breakpoint.

### 2.4 Radii

```
radius-none: 0       — hero images, full-bleed elements
radius-sm:   2px     — inputs, small UI
radius-md:   4px     — buttons (MAX), cards
radius-lg:   8px     — modals, large cards
radius-full: 9999px  — avatars only, never buttons
```

**Rules of use:**

- Buttons: `radius-md` maximum (4px). No pills.
- Inputs: `radius-sm` (2px). Anything more reads as casual.
- Images: `radius-none` by default. Editorial photography should be sharp-cornered.

### 2.5 Shadows

Used sparingly. Most surfaces have no shadow — separation comes from whitespace and 1px borders.

```
shadow-sm:    0 1px 2px rgba(15, 23, 42, 0.04)         — buttons on hover only
shadow-md:    0 4px 12px rgba(15, 23, 42, 0.06)        — cards on hover
shadow-lg:    0 12px 32px rgba(15, 23, 42, 0.08)       — dropdowns, popovers
shadow-xl:    0 24px 64px rgba(15, 23, 42, 0.12)       — modals, dialogs
```

No `box-shadow` on hero elements, section backgrounds, or non-interactive cards.

### 2.6 Motion

```
duration-fast:    120ms    — micro interactions (button press)
duration-base:    200ms    — hover states, focus rings
duration-slow:    400ms    — modal/dialog enter
duration-slower:  600ms    — page-level transitions, reveals

ease-default:   cubic-bezier(0.2, 0, 0.2, 1)    — most cases
ease-out:       cubic-bezier(0.16, 1, 0.3, 1)   — element entering
ease-in:        cubic-bezier(0.7, 0, 0.84, 0)   — element leaving
```

**Motion principles:**

- Use motion to _clarify_, not to entertain.
- No parallax. No scroll-jacking. No autoplay video. No bouncing.
- Reveals on scroll allowed, but: subtle (opacity 0 → 1, translateY 12px → 0), 400ms, ease-out, stagger max 60ms.
- Respect `prefers-reduced-motion: reduce` — disable all non-essential animation.

### 2.7 Breakpoints

```
sm:  640px      — large phone
md:  768px      — tablet
lg:  1024px     — small laptop
xl:  1280px     — desktop
2xl: 1536px     — large desktop
```

**Container max-widths:**

- Default container: 1280px, horizontal padding 24px (mobile) → 64px (xl)
- Editorial content (long-form text, legal pages): 720px
- Wide hero sections may go full-bleed (no max-width)

---

## 3. Layout system

### 3.1 Grid

12-column grid, 24px gutter on mobile → 32px desktop. Use CSS Grid for major layouts, Flexbox for component-internal arrangement.

### 3.2 Section structure

Every public-facing section follows this anatomy:

```
┌─────────────────────────────────────────┐
│         space-40 (top padding)          │
│                                          │
│   CAPTION (overline, 12px caps)          │
│   ↓ space-3                              │
│   Section heading (display-lg)           │
│   ↓ space-4                              │
│   Optional intro paragraph (body-lg,     │
│   max 65ch)                              │
│   ↓ space-12                             │
│                                          │
│   [Content grid]                         │
│                                          │
│         space-40 (bottom padding)        │
└─────────────────────────────────────────┘
```

### 3.3 Alternating section backgrounds

Sections alternate between `--color-bg` and `--color-bg-subtle`. Never two consecutive sections in the same background tone. This gives the page a quiet vertical rhythm without using shadows or borders.

---

## 4. Component library

### 4.1 Button

Three variants. No others.

**Primary (the main CTA):**

- Background: `--color-accent`
- Text: `--color-ink-inverse`, `button` token, all-caps optional but recommended for hero CTAs
- Padding: `space-3` vertical, `space-6` horizontal
- Border-radius: `radius-md` (4px)
- Hover: background → `--color-accent-hover`, transition `duration-base`
- Focus: 2px solid `--color-accent` outline at 2px offset
- Disabled: 40% opacity, no hover effect
- Loading: replace text with spinner, lock width

**Secondary (alternative action):**

- Background: transparent
- Text: `--color-ink`
- Border: 1px solid `--color-ink`
- Padding: same as primary
- Hover: background → `--color-ink`, text → `--color-ink-inverse`

**Tertiary (text-only):**

- Background: transparent
- Text: `--color-ink`, underline offset 4px, decoration thickness 1px
- No border, no padding-x beyond text
- Hover: text → `--color-accent`

**Never:**

- Gradient buttons
- Shadow-only buttons (must have border or fill)
- Icons larger than text height
- Pill shapes (border-radius > 4px)

### 4.2 Input field

- Height: 48px
- Padding: `space-3` vertical, `space-4` horizontal
- Border: 1px solid `--color-border`
- Border-radius: `radius-sm` (2px)
- Font: `body-md`, color `--color-ink`
- Placeholder: `--color-ink-subtle`
- Focus: border → `--color-ink`, no glow, no shadow
- Error: border → `--color-danger`, helper text below in `--color-danger`
- Label: `caption` token above input, color `--color-ink-muted`

### 4.3 Card

Two variants depending on context:

**Editorial card (for service verticals on homepage):**

- Background: `--color-bg`
- Border: none
- Padding: `space-8`
- Internal structure: caption → heading → body → CTA, separated by 1px `--color-border` divider
- Hover: subtle background change to `--color-bg-subtle`, accent text on CTA

**Booking card (for confirmation, summary):**

- Background: `--color-bg-subtle`
- Border: 1px solid `--color-border`
- Padding: `space-6`
- Border-radius: `radius-md`

### 4.4 Divider

- Horizontal: `1px` solid `--color-border`, full width of container
- Vertical: `1px` solid `--color-border`, used between columns in 3-pillar layouts
- Editorial accent: 32px wide × 2px tall, `--color-accent`, used as a decorative element above section headings sparingly

### 4.5 Badge / Tag

- Padding: `space-1` vertical, `space-2` horizontal
- Font: `caption`
- Border-radius: `radius-sm`
- Variants:
  - Default: bg `--color-bg-subtle`, text `--color-ink-muted`
  - Accent: bg `--color-accent-soft`, text `--color-accent`
  - Success: bg `#DCFCE7`, text `--color-success`

### 4.6 Navigation bar

- Height: 80px desktop, 64px mobile
- Background: `--color-bg`, no shadow, 1px bottom border `--color-border`
- Logo: left, 32px high
- Nav links: `body-sm`, weight 500, `--color-ink-muted`, hover → `--color-ink`
- CTA: `Primary` button on right, smaller variant (`space-2` vertical padding)
- Mobile: hamburger menu, slides in from right, full-height drawer, `--color-bg`

### 4.7 Footer

- Background: `--color-ink`
- Text: `--color-ink-inverse`, opacity 70% for secondary
- Padding: `space-16` vertical
- 4-column layout: brand block · services · company · legal
- Bottom strip: copyright, locale switch, social icons, separated by 1px border at 20% opacity

### 4.8 Form components specific to booking

**Calendar / date picker:**

- Use `react-day-picker` or `@radix-ui/react-popover` + custom day grid
- Today: 1px solid `--color-ink` outline
- Available: `--color-ink`
- Unavailable: `--color-ink-subtle`, line-through
- Selected: bg `--color-accent`, text `--color-ink-inverse`
- Hover (available): bg `--color-accent-soft`

**Time slot picker:**

- 4-column grid of pills (this is the _only_ place pills are allowed; functional, not decorative)
- Available: 1px border `--color-border`
- Selected: bg `--color-ink`, text `--color-ink-inverse`
- Unavailable: 1px dashed `--color-border`, text `--color-ink-subtle`

**Stepper (booking flow progress):**

- Horizontal on desktop, vertical on mobile
- Steps numbered 1-N, with `caption` label
- Current step: 24px circle, `--color-accent` fill, white number
- Completed: 24px circle, `--color-ink` fill, white checkmark
- Upcoming: 24px circle, 1px border `--color-border`, `--color-ink-subtle` number
- Connecting line: 1px `--color-border`, becomes `--color-ink` for completed segments

---

## 5. Page templates

### 5.1 Homepage

Reference §5 of the product spec for content. Visual interpretation:

**Hero**

- Full-viewport-height on desktop (min 720px), 80vh on mobile
- Left half: `display-xl` headline in `--color-ink`, max width 12 columns of 18, then `body-lg` subhead at 50% width, then Primary CTA
- Right half: full-bleed photo of jet wing or yacht detail (see §6), no rounding, no overlay
- No animation on load beyond a 600ms opacity fade

**Trust strip**

- Below hero, full-width, `--color-bg-subtle`
- Single row of 5 items, separated by vertical 1px dividers
- Each item: small icon (16px, line style, `--color-ink-muted`) + `caption` label

**Vertical grid**

- 5 cards in a responsive grid: 1col mobile, 2col tablet, 3col then 2col on second row at desktop (3+2 layout, with second row centered)
- Each card uses Editorial Card spec (§4.3)
- Hover: subtle shift in background tone, accent CTA, no card lift or shadow

**How it works (three pillars)**

- 3 columns, separated by full-height vertical 1px dividers
- Each pillar: large stepper number in Playfair Display (`display-lg`, color `--color-accent-soft`) followed by `display-sm` heading and `body-md` body

**Editorial section ("Why we exist")**

- Two-column asymmetric layout: 5col text + 7col photo
- Text block: caption → display-md headline → body paragraph → tertiary CTA
- Photo: full-bleed within column, no rounding

**Recurring pitch**

- Center-aligned, `--color-bg-subtle` background
- `display-md` headline, body-lg subhead, primary CTA
- Optional: small visual aid (calendar SVG, line-art style, monochrome)

**FAQ**

- Single column, max width 720px, centered
- Accordion pattern using `<details>` element styled
- Question: `body-lg` weight 600
- Answer: `body-md`, `--color-ink-muted`
- 1px `--color-border` between items, no card backgrounds

**Footer** — per §4.7

### 5.2 Vertical landing page (e.g. `/aviation`)

- Hero: same skeleton as homepage hero but with vertical-specific imagery and headline. CTA goes directly to `/book/aviation`.
- Service list: 3-4 specific service offerings within this vertical, in a stacked editorial layout
- Process: 4-step illustration of how this specific vertical works (e.g. for aviation: brief → quote → hangar coordination → completion certificate)
- Sample work / case study (when available): single large image, caption, no testimonial yet if none exists
- Trust signals specific to this vertical (e.g. for aviation: aviation-grade chemicals, EASA awareness, NDA standard)
- CTA repeated

### 5.3 Booking flow pages

- Centered, max-width 640px (single column) on all viewports
- Stepper at top showing where the user is
- Section heading: `display-sm`
- Form fields stacked vertically, `space-4` gap
- Bottom of viewport: sticky footer with Back (tertiary) and Continue (primary) buttons, full-width on mobile
- After submit: optimistic UI showing next step, no full-page reload

### 5.4 Customer account portal

- Sidebar navigation (24% width on desktop, drawer on mobile)
- Main content area uses booking card style for each entry
- All financial amounts in `display-sm` weight 600 for emphasis
- "Book again" CTA on every completed booking card

### 5.5 Backoffice (`/admin/*`)

Backoffice can deviate slightly — it's an internal tool, not customer-facing. But maintain:

- Same color palette
- Same typography (use `body-md` and `body-sm` more heavily; less display type)
- Denser spacing (`space-3` and `space-4` instead of `space-8`)
- Add data-density features: sortable tables, filter chips, keyboard shortcuts
- Use `--color-bg-subtle` more liberally for striped tables, row hover

---

## 6. Photography & art direction

### 6.1 Subject matter

Per the original style guide — macro details of impeccable textures. Specifically:

| Vertical         | Approved subjects                                                                                                                          |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Aviation         | Wing surface, polished landing gear, leather cockpit seat detail, cabin window edge with reflection, instrument panel from oblique angle   |
| Yacht            | Teak deck detail, varnished wood handrail, white leather banquette, polished stainless cleat, sail folded crisp                            |
| Commercial       | Empty modern office at golden hour, polished concrete floor, glass partition detail, single chair against floor-to-ceiling window          |
| Hospitality      | Made bed corner detail, folded towel stack, glassware on tray, marble bathroom surface                                                     |
| Special services | **No before/after photography. Ever.** Use abstract architectural imagery only — empty hallways, restored windows, daylight in clean rooms |

### 6.2 Treatment

- Natural light only, preference for golden hour or early morning blue hour
- Slightly desaturated, never warm-filtered
- Sharp focus throughout (no shallow-depth-of-field cliché)
- No people in early photos (we don't have brand-ambassador identity yet)
- 4:5 portrait or 16:9 cinematic — never square (square reads as Instagram, not editorial)
- Never use stock photography that's been used elsewhere. Either commission or use unsplash with curated selection only.

### 6.3 Fallback when you don't have photos yet

This is realistic for an early-stage launch. Approved alternatives:

1. **Architectural photography** of Swiss commercial buildings, lakeside marinas, FBO hangars — easily licensed from Unsplash with care
2. **Typography hero** — replace the right-half photo with a large display-xl quote or stat, on `--color-bg-subtle` background
3. **Vector illustration** — minimal line-art (1.5px strokes, `--color-ink`), e.g. an aircraft silhouette or yacht profile, on lots of white space

Do _not_ use:

- AI-generated imagery (it has tells, and the audience will notice)
- 3D renders
- Stock photos of cleaning equipment, hands holding sponges, smiling cleaning crews

---

## 7. Iconography

- Style: **line icons, 1.5px stroke**, never filled
- Source: Lucide (open source, 1000+ icons, MIT licensed)
- Sizes: 16, 20, 24, 32 (in `space` units: 4, 5, 6, 8)
- Color: inherits text color via `currentColor`
- Never combine line and filled icons in the same view
- Custom vertical icons: commission flat 1.5px line illustrations for aviation/yacht/etc. silhouettes if budget allows; otherwise use Lucide's `plane`, `ship`, `building-2`, `home`, `shield`

---

## 8. Motion patterns

### 8.1 Page load

- Hero text: opacity 0 → 1 over `duration-slower`, ease-out, no translation
- Hero image: opacity 0 → 1 over `duration-slower`, ease-out, slight scale 1.02 → 1
- Below-fold content: no animation until scroll-revealed

### 8.2 Scroll reveal

- Trigger: element 15% into viewport
- Animation: opacity 0 → 1, translateY 12px → 0, `duration-slow` ease-out
- Stagger between siblings: 60ms

### 8.3 Hover

- Buttons: `duration-base` color/background transition
- Cards: `duration-base` background or border transition (no transform / lift)
- Links: `duration-base` underline offset and color

### 8.4 Page transition (between routes)

- Optional, Phase 2: subtle 200ms cross-fade. Implement with View Transitions API where supported.

---

## 9. Accessibility

Non-negotiable. The brand depends on signaling competence; broken a11y signals the opposite.

- All text-background pairs must meet WCAG AA contrast: 4.5:1 for body, 3:1 for large display.
  - `--color-ink` on `--color-bg`: 17.4:1 ✓
  - `--color-ink-muted` on `--color-bg`: 7.1:1 ✓
  - `--color-ink-inverse` on `--color-accent`: verify before shipping (likely passes at 4.6:1, but check final color)
- Focus rings always visible: 2px solid `--color-accent`, 2px offset
- All interactive elements: minimum 44×44px touch target on mobile
- All form fields: associated `<label>`, no placeholder-only labels
- All images: meaningful `alt` text or `alt=""` for decorative
- Respect `prefers-reduced-motion` — disable all motion if requested
- Respect `prefers-color-scheme` — _do not_ implement dark mode in v1; the brand is light-first

---

## 10. Implementation guidance

### 10.1 Tailwind config sketch

```js
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        bg: { DEFAULT: "#FFFFFF", subtle: "#F8FAFC", elevated: "#FFFFFF" },
        ink: {
          DEFAULT: "#0F172A",
          muted: "#475569",
          subtle: "#94A3B8",
          inverse: "#FFFFFF",
        },
        accent: { DEFAULT: "#d4af37", hover: "#bda03c", soft: "#fbf8eb" },
        border: { DEFAULT: "#E2E8F0", strong: "#CBD5E1" },
      },
      fontFamily: {
        display: ['"Playfair Display"', "Georgia", "serif"],
        body: ["Inter", "system-ui", "sans-serif"],
      },
      fontSize: {
        "display-xl": [
          "4.5rem",
          { lineHeight: "1.05", letterSpacing: "-0.03em", fontWeight: 500 },
        ],
        "display-lg": [
          "3.5rem",
          { lineHeight: "1.1", letterSpacing: "-0.025em", fontWeight: 500 },
        ],
        "display-md": [
          "2.5rem",
          { lineHeight: "1.15", letterSpacing: "-0.02em", fontWeight: 500 },
        ],
        "display-sm": [
          "1.75rem",
          { lineHeight: "1.2", letterSpacing: "-0.015em", fontWeight: 600 },
        ],
        "body-lg": ["1.125rem", { lineHeight: "1.65" }],
        "body-md": ["1rem", { lineHeight: "1.6" }],
        "body-sm": ["0.875rem", { lineHeight: "1.55" }],
        caption: [
          "0.75rem",
          { lineHeight: "1.5", letterSpacing: "0.05em", fontWeight: 500 },
        ],
      },
      borderRadius: {
        none: "0",
        sm: "2px",
        md: "4px",
        lg: "8px",
        full: "9999px",
      },
      spacing: {
        /* default Tailwind 4px scale is fine */
      },
      transitionTimingFunction: {
        DEFAULT: "cubic-bezier(0.2, 0, 0.2, 1)",
        out: "cubic-bezier(0.16, 1, 0.3, 1)",
        in: "cubic-bezier(0.7, 0, 0.84, 0)",
      },
      transitionDuration: {
        fast: "120ms",
        DEFAULT: "200ms",
        slow: "400ms",
        slower: "600ms",
      },
    },
  },
};
```

### 10.2 Font loading

```html
<!-- in app/layout.tsx <head>, or via next/font -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700&family=Inter:wght@400;500;600&display=swap"
  rel="stylesheet"
/>
```

Prefer `next/font` for self-hosting and CLS prevention.

### 10.3 Recommended libraries

- **shadcn/ui** (copy-paste components, easy to customize to this system)
- **Radix UI** (accessibility primitives shadcn is built on)
- **react-day-picker** (date selection)
- **Lucide React** (icons)
- **Motion / Framer Motion** (only if needed for Phase 2 page transitions)

### 10.4 Naming conventions

- Components: PascalCase, semantic (e.g. `BookingStepper`, not `StepIndicatorV2`)
- CSS variables: kebab-case with prefix (`--color-ink`, not `--ink-color`)
- Tailwind: use design tokens via theme keys, never arbitrary values (`text-display-lg`, never `text-[3.5rem]`)
- Files: kebab-case (`booking-stepper.tsx`)

---

## 11. Anti-patterns (do not ship)

- ❌ Generic purple-to-pink gradients anywhere
- ❌ Glassmorphism / frosted glass on cards
- ❌ "Get started for free" hero copy
- ❌ Generic stock photos of smiling cleaners holding spray bottles
- ❌ Auto-playing background video
- ❌ Pill-shaped buttons
- ❌ Multiple competing CTAs in a single section
- ❌ Inline emoji in headlines
- ❌ Trust badges as logos arranged in a row before we actually have those clients
- ❌ Animated counters ("4,532 customers served")
- ❌ Chatbot widget bottom-right
- ❌ Newsletter modal popup
- ❌ Lottie animations on the hero
- ❌ Carousel components anywhere
- ❌ Drop shadows on text
- ❌ Buttons larger than 56px tall
- ❌ Mixing line and filled icons in the same view

---

## 12. Open design decisions

1. **Final brand name + logo** — affects everything; commission a wordmark once chosen.
2. **Photography commission vs. curated stock** — decide before launch; affects budget and timing.
3. **Localization typography** — Playfair Display has full Latin support; verify if Cyrillic/Greek ever needed.
4. **Whether to add a third "feature" font** — e.g. a numeric-only font (Tabular) for pricing displays. Recommend: not in v1.
5. **Dark mode policy** — recommend skipping in v1; Swiss luxury reads light. Revisit at v2 if customer demand emerges.
6. **Custom illustration system** — if budget allows, commission 5-10 line illustrations for the verticals and process diagrams. Adds significant brand distinctiveness over icon-only approach.

---

## 13. Hand-off prompt for AI coding agent

> Implement the design system in this document using Tailwind CSS and shadcn/ui components in a Next.js 15 App Router project. Set up the Tailwind config exactly as in §10.1. Load Playfair Display and Inter via `next/font`. Build the homepage per §5.1, using only the design tokens and component variants defined here. Do not introduce any new colors, fonts, or spacing values that are not in this document. If a component is needed that is not specified, propose it in a separate document before building.

---

_End of v0.1 design spec. Update alongside `cleaning-platform-spec.md` as the product evolves._
