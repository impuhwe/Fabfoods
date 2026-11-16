# FAB FOODS — Design System

Status: Phase 0 proposal. Refine with the client before Phase 2.
Reference research: Kage library (Sweetgreen editorial commerce, OpenTable reservation
patterns), hospitality/menu conventions, 21st.dev component idioms. No reference branding is
copied.

---

## 1. Design intent

**"Warm editorial hospitality."** A restaurant site that reads like a well-printed menu: serif
display type, generous margins, restrained colour, real food photography, and precise utility
where commerce happens.

Three adjectives: **warm, confident, crafted.**

- Warm — cocoa, cream and ember-gold, not cold minimalism.
- Confident — large serif headlines, asymmetric editorial blocks, photography allowed to breathe.
- Crafted — hairline rules, tabular prices, small caps eyebrows, nothing gratuitous.

Deliberately avoid: stacked gradient blobs, glassmorphism, 3 identical icon cards per section,
24 px radius everywhere, emoji as icons, autoplay carousels, scroll-jacking.

---

## 2. Brand

- Wordmark: **FAB FOODS** (uppercase, tracked). Lockup variant "Fab Foods" only if the client
  confirms title case (see Q2).
- Slogan: **FEED YOUR BRAIN** — used as an eyebrow/kicker, never as a headline replacement.
- Logo: supplied asset pending (Q12). Clear space = height of the "F" on all sides. Minimum 24 px
  height on screen. Monochrome cream version for dark sections.
- Voice: short, sensory, plain-spoken. No exclamation marks in body copy, no hype adjectives
  stacked three deep. Prices always visible.

---

## 3. Colour tokens

Three families: **Cocoa** (structure), **Cream** (canvas), **Ember** (action), plus muted
functional colours. Gold is a *rationed* accent, not a text colour on cream.

### Primitive scale

| Token | Hex | Notes |
| --- | --- | --- |
| `cocoa-950` | `#1C110C` | deepest ground, admin chrome |
| `cocoa-900` | `#2A1811` | dark sections, footer |
| `cocoa-800` | `#40251D` | brand chocolate (primary surface on dark) |
| `cocoa-700` | `#4E2E23` | hover on dark surfaces |
| `cocoa-600` | `#603B2B` | coffee brown, borders on cream |
| `cocoa-300` | `#A98D7E` | muted meta text on dark |
| `ember-600` | `#A85F0B` | gold pressed state |
| `ember-500` | `#C77A16` | primary accent (fills, large display, icons) |
| `ember-400` | `#DA9536` | hover fill, focus ring on dark |
| `ember-100` | `#F6E4C8` | accent tint surface |
| `cream-50` | `#FDFBF7` | card on cream |
| `cream-100` | `#F8F4EC` | page canvas (brand cream) |
| `cream-200` | `#F1EADD` | alternating band |
| `cream-300` | `#E4D9C7` | hairlines, dividers |
| `ink-900` | `#24211F` | body text |
| `ink-600` | `#5A544D` | secondary text |
| `ink-400` | `#8B837A` | disabled, placeholders |
| `white` | `#FFFFFF` | product cards, forms |

### Semantic

| Token | Hex | Usage |
| --- | --- | --- |
| `bg` | `cream-100` | public canvas |
| `surface` | `white` | cards, sheets |
| `surface-dark` | `cocoa-900` | dark bands, footer |
| `text` | `ink-900` | primary copy |
| `text-muted` | `ink-600` | descriptions, meta |
| `border` | `cream-300` | 1 px rules |
| `action` | `ember-500` | primary button fill |
| `action-hover` | `ember-600` | pressed |
| `focus` | `ember-400` | 2 px focus ring, offset 2 |
| `success` | `#3F6B4A` | order ready, confirmed |
| `warning` | `#9A6A12` | awaiting action |
| `danger` | `#8F2D2D` | cancelled, destructive |
| `info` | `#35566B` | neutral notices |

### Contrast rules (enforced)

- `ember-500` on `cream-100` ≈ 2.7:1 → **fills only**, never small text.
- Primary button: `cocoa-950` text on `ember-500` (≈ 6.4:1) or white text on `cocoa-800`.
- Body copy: `ink-900` on cream/white (≥ 12:1). Never gold for body text.
- Dark bands: `cream-100` text on `cocoa-900` (≥ 13:1); meta in `cocoa-300` only for ≥ 14 px.
- Status is never conveyed by colour alone — always icon + label.

---

## 4. Typography

| Role | Family | Fallback | Usage |
| --- | --- | --- | --- |
| Display | **Fraunces** (variable, `opsz` 9–144, `SOFT` 0–100) | Georgia, serif | H1–H2, dish names, editorial quotes |
| UI / body | **Inter** (variable) | system-ui, sans-serif | Nav, buttons, forms, paragraphs, tables |
| Numerals | Inter with `tabular-nums` | — | Prices, totals, dashboard metrics |

Load two families only, `display=swap`, preconnect to `fonts.gstatic.com`, subset `latin`.

### Type scale (rem, 16 px base)

| Token | Size / line-height | Family | Usage |
| --- | --- | --- | --- |
| `display-xl` | 4.5 / 1.02 (72 px) | Fraunces 300, tracking −0.02em | Home hero, desktop |
| `display-lg` | 3.25 / 1.05 (52 px) | Fraunces 300 | Section openers |
| `display-md` | 2.25 / 1.1 (36 px) | Fraunces 400 | Card feature, page H1 mobile |
| `heading-sm` | 1.25 / 1.3 (20 px) | Inter 600 | Card titles, panel heads |
| `body-lg` | 1.125 / 1.65 (18 px) | Inter 400 | Lead paragraphs |
| `body` | 1 / 1.65 (16 px) | Inter 400 | Default |
| `small` | 0.875 / 1.5 (14 px) | Inter 400 | Meta, helper |
| `micro` | 0.6875 / 1.4 (11 px) | Inter 600, `0.18em` tracking, uppercase | Eyebrows, labels |

Mobile floors: hero 40 px, section openers 32 px, body never below 16 px on inputs (prevents iOS
zoom). Measure 60–72 characters; dish descriptions capped at 2 lines with ellipsis in cards.

---

## 5. Spacing, grid, shape

- Base unit 4 px; scale `4, 8, 12, 16, 24, 32, 48, 64, 96, 128`.
- Container: max 1240 px, gutters 20 px mobile / 32 px tablet / 48 px desktop.
- Section rhythm: 64 px mobile, 88 px tablet, 112 px desktop (dark editorial bands may be 128).
- Grid: 12 columns desktop, 8 tablet, 4 mobile.
- Radius: `sm 4`, `md 8`, `lg 12`, `pill 999`. Cards use `md`; inputs `sm`; buttons `pill`.
  Never mix `lg` cards with `pill` inputs in the same form.
- Borders: 1 px `cream-300` on cream; 1 px `rgba(248,244,236,.14)` on dark.
- Shadows: only on floating layers — `0 1px 2px rgba(36,33,31,.04)`, `0 16px 48px -24px
  rgba(36,33,31,.28)`. Cards on cream use borders, not shadows.
- Z-index scale: base 0, sticky 20, header 40, drawer 60, toast 80, modal 100.

---

## 6. Components

### Buttons
| Variant | Spec |
| --- | --- |
| Primary | `ember-500` bg, `cocoa-950` text, pill, 44–48 px tall, `px-6`, weight 600, 150 ms hover to `ember-600` + 1 px lift |
| Secondary | Transparent, 1 px `cocoa-800/25`, `cocoa-900` text, hover bg `cream-200` |
| On-dark | `cream-100` bg, `cocoa-950` text; ghost variant = 1 px cream/25 |
| Destructive | `danger` outline; filled only inside a confirm dialog |
| Icon button | 40×40, radius `sm`, 1 px border, `aria-label` required |

Disabled: 40% opacity, `cursor-not-allowed`, no hover. Loading: label swaps to spinner + verb
("Adding…"), width locked to prevent layout shift.

### Inputs
Height 48 px, radius `sm`, 1 px `cream-300`, white bg, 16 px text. Label above (not placeholder-
only). Helper text below. Error: `danger` border + icon + message, `aria-invalid` +
`aria-describedby`. Focus: 2 px `ember-400` ring, offset 2. Selects and date/time pickers styled;
native controls retained for mobile reliability.

### Navigation
- Sticky top bar, 76 px, cream with bottom hairline; becomes `cream/92` + blur after 24 px scroll.
- Left: primary links (Menu, About, Reservations, Contact). Center or left: wordmark. Right:
  account icon, cart button with item count, **Order Online** primary pill.
- Active link: 2 px `ember-500` underline offset 8 px.
- Mobile: 44 px hamburger → full-height cream drawer, 18 px links in Fraunces, staggered fade
  (≤ 240 ms), body scroll locked, Esc closes, focus trapped, returns focus to trigger.
- Cart: right-side sheet on desktop, bottom sheet on mobile; line items with thumbnail, add-on
  summary, qty stepper, note field.

### Cards
Dish card: image 4:3 (`aspect-[4/3]`), radius `md` top only, body on white with 1 px border.
Name (Fraunces 400, 20 px) + price right-aligned tabular. Description 2 lines, `ink-600`.
Availability pill top-left on image (`cream/90` backdrop). Hover: image scale 1.03 over 400 ms,
border shifts to `cocoa-600/30`; no card lift, no glow.

### Chips / pills
Category filter chips: 36 px, 1 px border, active = `cocoa-800` fill + cream text. Status
badges: tinted surface + 1 px border + dot/icon + word, never colour-only.

### Tables (admin)
Header 12 px uppercase `ink-600` on `cream-100`; rows 52 px, hairline dividers; sticky header;
row hover `cream-50`; numeric columns right-aligned tabular; bulk selection with 3 px
`ember-500` inset marker; pagination footer. On mobile, tables become stacked record cards.

### Feedback
- Toast: bottom-right desktop, top-center mobile, 4 s, one at a time, `aria-live="polite"`.
- Inline form errors, not toasts.
- Skeletons match final geometry (no spinners on first paint of lists).
- Empty states: small line illustration or icon + one sentence + one action. No dead ends.
- Confirmation dialogs for destructive actions, naming the object and requiring explicit verb.

### Motion
Durations 150 ms (micro), 240 ms (surface), 400 ms (image). Easing `cubic-bezier(.2,.7,.2,1)`.
Scroll reveal: opacity 0→1 + 12 px translate, once, 80 ms stagger, max 6 items. Disabled under
`prefers-reduced-motion`. No parallax, no scroll-hijacking, no auto-rotating carousels.

### Payment and fulfilment UI
- Payment method selector: stacked radio cards, 56 px, 1 px border, method label + short
  descriptor ("Pay on delivery", "Mobile Money", "Card"). Selected = `ember-500` 2 px border and
  a check mark, never colour alone.
- Only approved provider marks may be shown. Until provider approval, use neutral text labels and
  generic icons; do not ship third-party logos speculatively.
- Deliberate state language: **"Awaiting payment"**, **"Payment processing"**, **"Paid"**,
  **"Payment failed"** — distinct from order status labels. Never imply payment succeeded because
  a page redirected.
- Mobile Money handoff: show amount, masked phone number, expiry countdown and a manual
  "Check status" action; no fake progress spinners longer than the real poll.
- Delivery: zone selector, fee shown as part of the server quote, ETA labelled "estimated", and a
  clear note when delivery is paused. Pickup shows address + prep ETA instead.
- Manual settlement (admin) is a destructive-weight action: confirm dialog, reason required,
  audit note displayed after saving.

### Provisional and unpublished content
- **Empty is a design state, not a defect.** A dish with no confirmed description renders name,
  price and image; the description block is omitted rather than filled with placeholder copy.
- Admin-only "Provisional" badge: `warning` tint, 1 px border, small caps, paired with an icon.
  Never shown on the public site.
- Unpublished business facts render as a quiet bordered panel: "Contact details are being
  confirmed." with the contact form still available. No fake phone numbers, no disabled map that
  looks broken, no dead social icons.
- Do not use skeleton loaders to disguise missing content. Skeletons are for loading only.

---

## 7. Imagery

- Style brief: warm daylight, shallow depth of field, dark wood/linen surfaces, hands and steam
  welcome, 45° or top-down consistent per section. Never HDR-saturated.
- Menu items: square or 4:3 minimum 1200 px, consistent crop and background tone.
- Hero: 16:9 desktop (min 2400 px), 4:5 mobile crop; focal point must survive `object-center`.
- Cloudinary: `f_auto,q_auto,c_fill,w_<breakpoint>`, `dpr_auto`; blur placeholder via
  `w_24,e_blur:400`.
- Alt text rules: describe the dish as depicted. Never claim provenance ("our famous…") and never
  present stock imagery as FAB FOODS food. Placeholder images carry `alt="Placeholder image"` and
  an admin-only "replace" affordance.
- Gallery: mixed 3:2 and 4:5 in an editorial grid (not a uniform 3×3).

---

## 8. Page-level art direction

| Screen | Composition |
| --- | --- |
| Home hero | Full-bleed 78vh photograph, cocoa scrim 20→70%, left-aligned serif H1 over 7 cols, eyebrow "Kacyiru, Kigali", two CTAs, hours/location micro-row at base |
| Featured dishes | 3-up editorial cards on cream, asymmetric first card spanning 5 cols |
| Category rail | Horizontal scroll chips + 4-up category tiles with 3:4 imagery |
| Story band | Dark cocoa band, 6/6 split: serif story left, tall photograph right |
| Coffee section | Cream band with large top-down cup image, 3 short value lines, no stock latte-art clichés beyond one hero |
| Offers | One wide banner card, ember tint edge, single CTA |
| Testimonials | 2-up quote cards, Fraunces 24 px quote, attribution with source; omit section if no verified reviews |
| Gallery | Masonry-ish 4-col editorial grid, 12 images max, link to full gallery |
| Reservation CTA | Cocoa band with inline date/time/party form (3 fields + CTA) |
| Footer | 4 columns + wordmark, hours, address, social; legal row |

Menu page: sticky category rail under header, search inline, 3-col grid desktop / 2 tablet / 1
mobile, dish detail as right drawer (desktop) or route (mobile/deep link).

Admin: charcoal chrome (`cocoa-950` sidebar), cream content canvas, white data surfaces, gold only
for active nav and primary actions. Dense 14 px tables, no serif except page titles.

---

## 9. Accessibility checklist

- Skip-to-content link; single `<h1>` per page; landmarks (`header/nav/main/footer`).
- All interactive elements reachable and operable by keyboard; visible focus never removed.
- Cart drawer/dialog: focus trap, Esc, restore focus, `aria-modal`, labelled title.
- Qty steppers: real buttons with accessible names ("Increase quantity of Beef Burger").
- Form errors announced; success announced politely.
- `prefers-reduced-motion`, `prefers-contrast` respected.
- Touch targets ≥ 44×44 px; 8 px minimum spacing.
- Images have alt; decorative images `alt=""`.
- Video/animation never conveys essential information.

---

## 10. Token implementation

Single source of truth in `client/tailwind.config.js` (`theme.extend.colors`, `fontFamily`,
`boxShadow`, `borderRadius`, `keyframes`) plus CSS variables in `src/styles/tokens.css` for
runtime theming of the admin surface. Tailwind classes only in components; no ad-hoc hex values
outside the token file (lint rule via `eslint-plugin-tailwindcss` later).

Suggested token names: `bg`, `surface`, `surface-strong`, `text`, `text-muted`, `border`, `action`,
`action-hover`, `focus`, `success`, `warning`, `danger`, `info` (semantic) mapped onto the
primitive scale above.

---

## 11. Do / Don't

**Do** use whitespace as a material; let one hero photograph carry the page; align prices on a
tabular grid; keep category colour coding to status only; write real menu copy from supplied data.

**Don't** add a gradient to every section; round every card to 24 px; place three identical icon
features under each heading; use gold body text; use emoji in navigation or buttons; auto-play
carousels; invent dish descriptions, ingredients, allergens, awards or review counts.
