# FAB FOODS — Project Requirements

Status: Phase 0 (planning). No application code has been written.
Last updated: 2026-11-13

---

## 1. Purpose

Build a production-grade restaurant and coffee digital platform for **FAB FOODS** (Kacyiru,
Kigali), replacing the current marketing site at `fabcafe.rw` with a platform that supports
discovery, an interactive menu, online ordering, table reservations, customer accounts and an
administrative back office.

**Confirmed commercial scope:** restaurant pickup ordering, delivery ordering, Mobile Money
payments and bank card payments. All four are required in the architecture, database, API and
roadmap from the start. Delivery and online payment activation are individually switchable by an
administrator once operations, providers and credentials are ready. Provider selection remains an
open business dependency — no provider is assumed.

### Menu decisions (updated 2026-11-14)

1. **PDF-sourced menu data.** Both source PDFs are transcribed into the active manifest: 19
   categories, 111 product records, 7 add-ons, 118 modeled records and 121 priced lines. The
   client's "55 entries" figure is retained as `provisionalEntryCount` and reconciled as 48 food
   products + 7 add-ons = 55 modeled food records. Nothing is deleted to force a count.
2. **Every PDF-sourced menu entry carries `needsReview: true`**, `verified: false`,
   `dataSource: "pdf"`, exact printed name/price, and is fully editable in the admin dashboard.
   All 24 business-review flags are retained.
3. **No invented content.** No descriptions, ingredients, allergens, claims, serving details or
   extra products are written to fill gaps. `includedItems` use only stated components.
4. **Unpublished business facts.** Contact details, opening hours, delivery fees and other
   unverified business information stay unpublished on the public site until the owner approves
   them. They remain editable in the admin dashboard.
5. **Coffee/drinks** use the same category/product system and are now PDF-sourced: 8 drink
   categories and 63 product records.
6. **Payments and fulfilment remain confirmed scope**, built behind activation flags.

The existing website is a **business reference only**. Its source code is not available and must
not be depended on. This is a greenfield build.

Authoritative sources:

| Domain | Source of truth |
| --- | --- |
| Menu items and prices | Supplied food and drink PDFs, transcribed into `menu.pdf.manifest.js`; all entries `needsReview` until business review |
| Menu items added by prompt | Historical Phase 0 brief only; superseded by the PDF-sourced manifest |
| Business contact details | Existing public website (**unconfirmed until owner approval** — see §9) |
| Brand look and feel | Supplied menu cover (deep brown / cream / golden orange), logo, slogan "FEED YOUR BRAIN" |

---

## 2. Users and roles

| Role | Description | Access |
| --- | --- | --- |
| Guest | Unauthenticated visitor | Public site, menu, cart, guest checkout, reservation request, contact |
| Customer | Registered account holder | Guest abilities + profile, order history, reservation history, saved addresses |
| Staff | Front-of-house / kitchen | Admin dashboard read access to orders & reservations, status updates |
| Manager | Operations | Staff abilities + menu/content management, reports, customer view |
| Admin | Owner / technical | Everything, including staff & role management, settings, destructive actions |

Permission model is capability-based on the server. The client only hides UI; **every** admin
route re-checks the role server-side.

---

## 3. Functional requirements

### 3.1 Public website

- **FR-1** Homepage with: navigation, hero, featured dishes, popular categories, restaurant
  introduction, coffee/dining experience, offers, testimonials, gallery, reservation CTA,
  location/contact block, footer.
- **FR-2** Interactive menu page with category navigation, search, filters (category, featured,
  popular, availability), product cards with image/name/description/price, and add-to-cart.
- **FR-3** Product detail view with description, price, category, availability, confirmed
  ingredients (only if supplied), confirmed add-ons, quantity, special instructions.
- **FR-4** About page with brand story and gallery. All unknown content is admin-editable, never
  invented.
- **FR-5** Reservations page with validated request form; requests are **never** auto-confirmed.
- **FR-6** Contact page with form, clickable address/phone/email links, opening hours and a map
  link. Approved `RestaurantSettings` values override the supplied reference defaults. Owner
  sign-off on those reference values is still outstanding; admin-editable approved values become
  visible without a code change. WhatsApp and social links remain unpublished until supplied.
- **FR-6a** Delivery fees, minimum orders and ETAs are likewise unpublished and unusable until an
  admin marks the zone/rule verified; ordering falls back to pickup.
- **FR-7** Prices displayed in RWF with grouped thousands (`RWF 8,000`). Stored as integers.
- **FR-8** Every menu page must reflect **live** database content, not a hard-coded array.

### 3.2 Ordering

- **FR-9** Cart: add, increment, decrement, remove, per-line special instructions, add-on
  selection, subtotal, server-derived delivery fee (delivery), total. Persisted client-side across
  reloads.
- **FR-10** Checkout collects customer details and a fulfillment method. **Restaurant pickup and
  delivery are both confirmed scope.** Each is controlled by an operational feature flag so the
  admin can enable or pause it without a code change; when delivery is paused the UI explains why
  and offers pickup. Delivery requires a configured zone before it can be offered.
- **FR-11** The server recomputes every line total and the order total from current database
  prices and add-on prices. Client-supplied prices are ignored.
- **FR-12** Order submission validates availability and quantity bounds (1–20 per line).
- **FR-13** Order statuses: `pending → confirmed → preparing → ready → out_for_delivery →
  completed`, plus `cancelled`. Invalid transitions rejected server-side. `out_for_delivery` is
  only valid for delivery orders.
- **FR-14** Customers receive an order number and can look up status without an account using
  order number + email (or phone). Registered customers also see history.
- **FR-15** Payment methods are **confirmed scope**: `cash_on_delivery`, `pay_at_restaurant`,
  `mobile_money`, `card`. Mobile Money and card are provider-agnostic integrations behind a
  feature flag; the admin activates them when the business is operationally ready. Payment status
  is modelled **separately** from order status.
- **FR-16** No payment is ever marked `paid` without a server-side verification: either a
  signature-verified provider webhook or an explicit, audited manual reconciliation by a manager
  for cash/offline settlement. Provider redirects and client callbacks alone never confirm payment.
- **FR-17** Payment attempts are recorded as immutable transactions (amount, method, provider,
  provider reference, status, failure reason). Initiation is idempotent; duplicate webhooks are
  deduplicated by provider event id. Refunds are recorded, never inferred.
- **FR-18** Payment provider selection, merchant onboarding, credentials and webhook secrets are
  external business dependencies. The architecture supports providers without naming one as
  chosen.

### 3.3 Reservations

- **FR-19** Fields: full name, email, phone, date, time, party size, special requests.
- **FR-20** Reject past dates, dates beyond a configurable horizon (default 90 days), times
  outside opening hours, party sizes outside configured bounds. Until hours are owner-approved,
  documented defaults are used for validation and the UI states that hours are pending.
- **FR-21** Statuses: `requested → confirmed | rejected | cancelled | seated | completed |
  no_show`. Only staff can move a request to `confirmed`.
- **FR-22** Optional capacity guard per slot from settings; if unset, no auto-rejection, but
  admins see a "same-slot" count to decide manually.
- **FR-23** Confirmation/rejection emails are sent after the database write succeeds.

### 3.4 Accounts

- **FR-24** Register, login, logout, refresh session, forgot/reset password, email verification.
- **FR-25** Passwords hashed with bcrypt (cost ≥ 12). Password reset tokens are single-use,
  hashed at rest, and expire in 30 minutes.
- **FR-26** Profile management (name, phone, marketing opt-in), order and reservation history.
- **FR-27** Protected routes on both client and server.

### 3.5 Admin dashboard

- **FR-28** Overview KPIs: total orders, pending orders, completed orders, total reservations,
  pending reservations, registered customers, revenue from **completed/paid** orders only, recent
  orders, recent reservations, sales chart.
- **FR-29** Menu management: create/edit/archive products, manage categories, upload images,
  prices, descriptions, availability, add-ons, featured flag, display order, and a visible
  "needs review" state for entries pending business confirmation.
- **FR-30** Order management: list, search (order number, phone, email), filter by status/date/
  fulfillment, detail view, status updates, special-instruction visibility, CSV export.
- **FR-31** Reservation management: list, accept, reject, reschedule, mark seated/completed/
  no-show, notes, search/filter, CSV export.
- **FR-32** Customer management: list, detail, order/reservation history, suspend/reactivate.
- **FR-33** Content management: featured dishes, promotions, hero banners, gallery, contact
  details, business hours, social links, about copy, SEO defaults — all unconfirmed business
  facts remain editable until owner approval.
- **FR-34** Reports: sales summary, orders by status, popular items, reservation stats, date
  filtering, CSV export.
- **FR-35** Payment management: transaction list and detail, provider status, webhook health,
  manual settlement with reason, refunds (manager+), and reconciliation views. Payment settings
  show only masked/boolean configuration state; secrets live in environment variables.
- **FR-36** Fulfilment management: pickup toggle, delivery toggle, delivery zones with fees,
  minimum order and ETA, plus an explicit "pause online ordering" switch.
- **FR-37** Dashboard is visually and structurally separate from the public site (own layout,
  own theme density, no public footer).

### 3.6 Integrations

- **FR-38** Cloudinary for menu/gallery media via **signed** uploads issued by the backend;
  store `url`, `publicId`, `alt`.
- **FR-39** Brevo for transactional email: registration, password reset, order placed, order
  confirmed, status updates, reservation received/accepted/rejected, payment receipt/failure.
  Branded HTML templates.
- **FR-40** Email delivery is decoupled from business writes (outbox `EmailLog`), retried, and
  failures are visible to admins. A failed email never rolls back a valid order.
- **FR-41** WhatsApp: floating contact button using a settings-driven number; optional "share
  order via WhatsApp" link that opens a pre-filled message. Disabled until the number is verified.
- **FR-42** Mobile Money and card payment adapters implement one internal provider contract
  (initiate, verify, refund, parse webhook) so a provider can be added or replaced without
  touching order logic.

---

## 4. Non-functional requirements

| ID | Requirement |
| --- | --- |
| NFR-1 | Mobile-first responsive at 360, 390, 768, 1024, 1280, 1440, 1920 px |
| NFR-2 | WCAG 2.2 AA: keyboard reachable, visible focus, semantic landmarks, labelled inputs, `aria-live` for cart/toasts, contrast-checked palette |
| NFR-3 | Lighthouse targets: Performance ≥ 90 mobile, Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 95 |
| NFR-4 | LCP < 2.5 s on 4G; images via Cloudinary `f_auto,q_auto`, responsive `srcset`, lazy loading below the fold |
| NFR-5 | All list views have loading, empty and error states; all mutations have success/error feedback |
| NFR-6 | Server-side validation on every write; payload limit 1 MB JSON / 5 MB image metadata; rate limiting per route class |
| NFR-7 | No secret in client code; `.env.example` documents every variable |
| NFR-8 | Money is integer RWF end-to-end; no floats |
| NFR-9 | Timezone: Africa/Kigali (UTC+2, no DST). Reservation dates stored as `YYYY-MM-DD` + `HH:mm` strings to avoid date drift |
| NFR-10 | Deterministic, indexed queries; pagination on all admin lists |
| NFR-11 | Every admin mutation writes an audit entry (actor, action, target, before/after digest) |
| NFR-12 | Payment integrity: idempotent initiation, unique provider transaction references, webhook replay protection, and no revenue counted without verified `paid` status |
| NFR-13 | PCI scope minimisation: card data never touches our servers or database. Card flows use provider-hosted fields/redirects only. Mobile Money uses provider-initiated prompts and server verification |
| NFR-14 | Delivery pricing is always server-derived from zone rules; the client may display an estimate but never submit a fee |

---

## 5. Constraints

- Stack is fixed: React + Vite + Tailwind on the frontend; Node + Express + MongoDB/Mongoose on
  the backend. Deviations require discussion first.
- No invented menu items, prices, ingredients, allergens, awards, founding dates or reviews.
- Online payments are **in scope**, but no simulated success: a provider must be selected,
  contracted, credentialed and webhook-verified before activation.
- Pickup and delivery are **in scope**; each is independently switchable by the administrator and
  delivery requires configured zones.
- No stock or scraped photography may be described as an actual FAB FOODS dish unless the
  restaurant supplies it. Placeholder imagery must be clearly replaceable via Cloudinary fields.
- The coffee/beverage catalogue is supplied by the drink PDF: 8 categories and 63 product records,
  all `needsReview: true` until business review. No descriptions or health claims are invented.
- The two menu PDFs are authoritative. Their exact names and prices are transcribed into the active
  manifest, including `includedItems`, size/cut options, serving choices and paid add-ons. Every
  entry remains `needsReview: true`, `verified: false` and `dataSource: "pdf"`; transcribed data is
  never presented as verified.

---

## 6. Out of scope (initial release)

- Real-time rider tracking and fleet management.
- Multi-branch / franchise support (single location, schema kept branch-agnostic where cheap).
- Loyalty points, gift cards, table-side QR ordering.
- Native mobile apps.
- Live chat staffed in-app (WhatsApp link instead).
- Merchant onboarding, KYC, provider contract negotiation and PCI attestation — these are
  business/legal work, not application code. The software integrates once credentials exist.

---

## 7. Assumptions (to confirm)

1. Prices are in RWF and inclusive of any applicable tax; no tax line is displayed unless the
   client confirms VAT treatment.
2. The restaurant has authority to publish the brand and menu shown on `fabcafe.rw`, pending owner
   sign-off; unapproved contact facts remain unpublished.
3. Opening hours from the live site (Mon–Fri 08:00–21:30, Sat 09:00–21:30, Sun closed) are
   **unconfirmed**. They are stored for development but not published or used for validation
   until approved.
4. Reservations are manual-confirmation only.
5. Pickup and delivery are confirmed services. Delivery stays unavailable to customers until a
   verified zone/fee exists and an admin enables it.
6. One admin role owner exists at launch; staff accounts are created by that owner.
7. Mobile Money and card are built and sandbox-tested; they become customer-visible only after the
   business completes provider selection and activation. Until then, enabled methods default to
   cash/offline — this is an activation state, not a scope limitation.
8. Provisional menu data is published for development/staging with `needsReview` flags retained;
   the admin dashboard must display an unverified-content notice until PDF reconciliation.

---

## 8. Definition of done (per phase)

A phase is done only when: its scope is written down, features are implemented, server-side
validation exists, tests for the changed behaviour pass, lint/typecheck pass, documentation is
updated, and the phase completion report is approved. Capabilities not listed in the current
phase scope are not started early.

---

## 9. Open business questions (blocking where noted)

| # | Question | Blocks |
| --- | --- | --- |
| Q1 | **PDFs transcribed; business review pending.** Active manifest has 121 priced lines, 118 modeled records and 24 flags. Confirm flagged names, prices, categories, breakfast components and options before clearing `needsReview`. | Public menu copy accuracy; not development progress |
| Q2 | ~~Brand spelling~~ **Decided:** use "FAB FOODS" as the working name. Keep it un-finalised and admin-editable; no alternative spelling is adopted. | — |
| Q3 | **Owner confirmation outstanding** for address, phone, email and WhatsApp number. The supplied reference values are published as clickable defaults: 44 KG 548 St, Kacyiru, Kigali, Rwanda; +250 788 756 286; info@fablab.rw. Approved `RestaurantSettings` override them; WhatsApp remains unpublished. | Final business sign-off, WhatsApp publication |
| Q4 | **Owner confirmation outstanding** for opening hours, including public holidays. Supplied reference hours are published as defaults and do not drive reservation validation. Approved `RestaurantSettings` hours override them. | Final business sign-off, reservation rules |
| Q5 | **Drinks/coffee catalogue**: the drink PDF is transcribed (8 categories, 63 product records), all `needsReview: true`. Confirm flagged naming/category items and supply descriptions/claims only if printed or approved. | Drink public copy accuracy |
| Q6 | Delivery operating rules: zones, fees, minimum order, ETA, pickup prep time. Unapproved rules stay unpublished and unusable; delivery remains off. | Delivery activation |
| Q7 | **Payment provider selection** for Mobile Money and card (e.g. MTN MoMo / Airtel Money / a card gateway), merchant account, webhook secret, sandbox credentials, refund policy. Architecture proceeds provider-agnostically; activation is blocked. | Phase 5 activation |
| Q8 | Reservation policy: max party size, slot interval, lead time, max days ahead, per-slot capacity. | Reservation rules (defaults configurable) |
| Q9 | Confirm the Pizza entry printed as "Fabfood Sandwich — 10,000 RWF". Keep as printed or rename? Also confirm intended "Masedoine" spelling. | Menu data flag |
| Q10 | Confirm paid add-ons and their prices (grilled chicken +3,000; beef strips +2,500; etc.) against the PDF. | Product customisation |
| Q11 | Are ingredient and allergen disclosures approved for publication? | Product detail legal |
| Q12 | Provide the real logo file (vector) and confirm photography rights for any images we may use. | Brand, gallery |
| Q13 | May we publish real customer reviews? Source and permission (e.g. Google reviews)? The "4.9 ★" claim on the live site is unverified. | Testimonials |
| Q14 | Social media handles (Instagram, Facebook, TikTok, X). | Footer, contact |
| Q15 | Which Brevo sender address/domain should transactional email come from? | Email |
| Q16 | Production domains (frontend, API) and hosting accounts. | Deployment |
| Q17 | Legal entity name, privacy policy and terms ownership. | Footer/legal pages |
| Q18 | Cash reconciliation: who may mark an order paid manually, and is a printed receipt required? | Payment settlement policy |
| Q19 | Tax/receipt requirements in Rwanda (VAT treatment, EBM/RRA receipts). Are prices tax-inclusive? | Totals, receipts, invoices |
| Q20 | Reservation deposit: none, or paid via MoMo/card? | Reservation → payment link |
| Q21 | Order cancellation/refund policy and who authorises refunds. | Refund flow, customer copy |
| Q22 | Delivery ownership: in-house riders or a third-party delivery integration? | Delivery status/ETA model |
