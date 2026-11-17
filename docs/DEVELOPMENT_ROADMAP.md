# FAB FOODS — Development Roadmap

Status: Phase 0 complete; Phase 1 complete; Phase 2 Stage 1 complete (PDF-sourced menu schema,
manifest, seed and pricing resolver); Phase 2 Stage 2 complete (public website, public APIs, cart,
reservation requests, contact messages, account views and checkout foundation); Phase 2 Stage 3
complete (server-priced orders, offline payment recording, Flutterwave adapter, email outbox,
account management, reservation cancellation, settings and staff operations). Stage 2 Playwright
(7/7) and Stage 3 Playwright (4/4) pass; Lighthouse has been measured with performance limited by
remote imagery. Each phase has a written scope, working functionality, tests, a completion report
and an approval checkpoint. Capabilities outside the current phase are not started early.

---

## Environment snapshot (verified 2026-11-15)

| Item | Value |
| --- | --- |
| Workspace | `C:\Users\HP\Documents\klab\Fabs Restaurant` |
| Node | v24.18.0 |
| npm | 11.16.0 |
| Git | 2.54.0 |
| OS | Windows 11, PowerShell 5.1 |
| Quirk | `npm.ps1` blocked by execution policy — use `npm.cmd`, or run once: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` |
| Menu source | Both PDFs transcribed into `menu.pdf.manifest.js`; 24 review flags remain unapproved |

---

## Confirmed scope (all phases combined)

Pickup ordering, delivery ordering, Mobile Money, bank card payments, interactive menu, cart,
checkout, order tracking, reservations, customer accounts, admin dashboard, menu/content/order/
reservation/customer/payment management, Cloudinary media, Brevo email, WhatsApp contact.

Delivery and online payments are **built** as first-class capabilities and **activated** by
administrator flags when operations, provider contracts and credentials are ready. No payment
provider is assumed.

---

## Phase 0 — Research & planning  ✅ revised again

- [x] Workspace and toolchain inspection
- [x] Business reference review at `fabcafe.rw` (treated as unconfirmed and unpublished)
- [x] Design research: Sweetgreen (editorial food commerce), OpenTable (reservation utility)
- [x] Design system, 45-screen inventory, data model, API surface, payment architecture
- [x] PDF-sourced menu register: 121 priced lines, 118 modeled records, 19 categories, 24 review flags
- [x] Decisions recorded: both PDFs are the active source; all entries `needsReview`; no invented
      descriptions/ingredients/claims; unapproved business facts unpublished; pickup/delivery/MoMo/card
      confirmed scope
- [ ] **Client approval of this revised plan**

Exit criteria: documents approved; deferred items tracked without blocking development.

---

## Phase 1 — Foundation

### In scope
Workspace, build tooling, server skeleton, database connection, authentication, authorization,
security baseline, design tokens, base UI primitives, public shell, admin shell, dev style guide.

### Out of scope
Menu models/seed, cart, orders, reservations, payments, uploads, emails, dashboard data. No mock
pages are created to "look complete".

### Tasks

**1. Workspace**
1. Root `package.json` with npm workspaces (`client`, `server`), scripts `dev`, `dev:client`,
   `dev:server`, `lint`, `format`, `test`.
2. `.gitignore` (node_modules, .env, dist, coverage), `.editorconfig`, `.nvmrc`,
   `README.md` skeleton, `docs/` retained.
3. `.env.example` with every variable required across the project, grouped and commented —
   including `MONGODB_URI`, `JWT_*`, `COOKIE_*`, `CLIENT_ORIGIN`, Cloudinary, Brevo, and payment
   provider placeholders marked "required only when activating".

**2. Server foundation** (`server/src/`)
4. `app.js` + `server.js`: helmet, CORS allowlist, JSON limit, cookie parser, request id,
   rate limiter, mongo sanitisation, `hpp`, 404 + central error handler.
5. `config/`: `env.js` (validated, fail-fast), `db.js`, `constants.js` (roles, order statuses,
   payment methods/statuses, fulfillment types, reservation statuses) — the single enum source.
6. `utils/`: `ApiError`, `asyncHandler`, `response` helpers, `logger`, `formatRWF` server mirror.
7. Health endpoint `GET /api/v1/health` reporting app + Mongo state.
8. `models/User.js`, `models/Session.js` with indexes, hooks, `toJSON` that strips secrets.
9. Auth: register, login, refresh (rotation), logout, `GET /auth/me`; bcrypt cost 12; httpOnly
   access + refresh cookies; CSRF double-submit token; `requireAuth` and `requireRole` middleware.
10. Zod validators for auth payloads and a shared validation middleware.
11. `services/payments/providerContract.js` — documented adapter interface (initiate, verify,
    parseWebhook, refund) with no provider implementation, so later work cannot drift.

**3. Client foundation** (`client/src/`)
12. Vite + React + Tailwind + React Router + Axios instance with credentials and error
    normalisation.
13. `styles/tokens.css` + `tailwind.config.js` implementing the design tokens (cocoa, cream,
    ember, ink, semantic aliases, type scale, radii, shadows).
14. Base primitives: `Button`, `IconButton`, `Input`, `Textarea`, `Select`, `Checkbox`, `Field`,
    `Badge`, `Chip`, `Card`, `Skeleton`, `EmptyState`, `Toast`/`ToastProvider`, `Modal`,
    `ConfirmDialog`, `Spinner`, `Price`.
15. Public layout: header, desktop nav, mobile drawer (focus trap, Esc), cart button placeholder
    (no cart logic yet), footer, WhatsApp slot (disabled state).
16. Admin layout shell: sidebar, topbar, role-aware nav skeleton, breadcrumbs, 403/404 views.
17. Route skeleton with lazy-loaded placeholders for Home and Admin only; no fake content pages.
18. `/dev/ui` (dev-only) rendering every token and primitive in light/dark contexts.
19. Axios auth interceptor: silent refresh on 401, single-flight, logout on refresh failure.

**4. Tooling and tests**
20. ESLint + Prettier + Tailwind class linting; `npm run lint` clean.
21. Vitest + Supertest + `mongodb-memory-server` on the server; Vitest + React Testing Library +
    jsdom on the client.
22. Phase 1 tests: health, register/login/refresh/logout, duplicate email, weak password,
    wrong credentials, suspended user, role guard 403, cookie flags, validation errors, atomic
    refresh rotation, `formatRWF`, enum constants (order/payment/fulfillment), primitive rendering,
    mobile drawer open/close.
23. `.env.example` verified against `env.js` (a test fails if a required key is undocumented).

### Phase 1 file manifest

```
package.json  .gitignore  .editorconfig  .nvmrc  README.md  .env.example

server/src/
  server.js  app.js
  config/{env.js,db.js,constants.js}
  middleware/{auth.js,csrf.js,error.js,notFound.js,rateLimit.js,validate.js}
  models/{User.js,Session.js}
  routes/{index.js,health.routes.js,auth.routes.js}
  controllers/auth.controller.js
  services/{auth.service.js,payments/providerContract.js}
  validators/auth.validator.js
  utils/{ApiError.js,asyncHandler.js,response.js,logger.js,formatRWF.js}
server/tests/{health.test.js,auth.test.js,rbac.test.js}

client/src/
  main.jsx  App.jsx  router.jsx
  styles/{tokens.css,globals.css}
  lib/axios.js
  components/ui/{Button,IconButton,Input,Textarea,Select,Checkbox,Field,Badge,Chip,Card,
                 Skeleton,EmptyState,Spinner,Modal,ConfirmDialog,Toast,Price}.jsx
  layouts/{PublicLayout.jsx,AdminLayout.jsx}
  components/layout/{Header,Footer,MobileDrawer}.jsx
  pages/{Home.jsx,NotFound.jsx,Forbidden.jsx,dev/UiKit.jsx}
  pages/admin/AdminLogin.jsx
  context/AuthContext.jsx
  hooks/useAuth.js
client/tests/{primitives.test.jsx,drawer.test.jsx}
```

Anything not in this manifest belongs to a later phase.

### Exit criteria
Both apps boot with `npm run dev`; health check green against local Mongo; auth round-trip works;
role guard proven by test; tokens render on `/dev/ui`; lint and all Phase 1 tests pass; Phase 1
completion report delivered.

---

## Phase 2 — Public website + verified menu

### Delivery status

- **Stage 1 — complete.** `MenuCategory`/`MenuItem` models, PDF-sourced seed, option pricing
  resolver, tests and docs.
- **Stage 2 — implemented, pending approval.** Public menu API, Home, Menu, dish detail, About,
  Gallery, Reservations requests, Contact messages, auth pages, account overview, cart and
  checkout foundation. Playwright Stage 2 passes 7/7; Lighthouse was measured at `/` 48,
  `/menu` 67 and `/reservations` 64 performance, with accessibility 96, best-practices 96 and
  SEO 100.
- **Stage 3 — implemented, pending external inputs.** Server-priced pickup orders, offline
  payment recording, Flutterwave adapter, email outbox, account profile/password, order history,
  reservation cancellation, settings and staff order/reservation/settings screens. Stage 3
  Playwright passes 4/4. Online payment, delivery zones/fees, Brevo delivery and genuine
  photography remain inactive or pending business approval.

### In scope (delivered)

Every seeded menu entry is `needsReview: true`, `verified: false`, `dataSource: "pdf"`, with exact
PDF names/prices and no invented description/ingredients/allergens/claims. `includedItems`,
`sizeOptions`, `servingOptions` and paid `addonGroups` are populated only where stated. Unapproved
contact details, hours, social links and delivery fees are **not published**. Items carrying a
blocking review tag remain visible but cannot be ordered.

Public routes: `/`, `/menu`, `/menu/:slug`, `/about`, `/gallery`, `/reservations`, `/contact`,
`/cart`, `/checkout`, `/order/:orderNumber`, `/login`, `/register`, `/forgot-password`,
`/reset-password`, `/verify-email`, protected `/account`, and 404. Staff routes:
`/admin`, `/admin/orders`, `/admin/reservations`, `/admin/settings`.

Public APIs: menu categories/meta/items/detail, safe settings, server-authoritative order
quote/placement/lookup/cancel, payment initiate/verify, reservation create/history/cancel, contact
message creation, profile/password and signed-in order history. Staff APIs: order queue/detail/
status/offline payment, reservation queue/status, settings and email outbox. See
`docs/API_DOCUMENTATION.md` §0 and §0.1.

### Deferred beyond Stage 3

Delivery zone/fee operations, live online payment capture/webhooks activation, email delivery,
password reset/verification delivery, broader admin CRUD, uploads, reviews/testimonials,
promotions, public content/gallery endpoints, live reservation availability and WhatsApp
integration. Email outbox and the Flutterwave adapter exist but stay disabled without credentials
and business approval.

### Tasks (status)

1. [x] Models and Stage 1 seed/pricing.
2. [x] Public endpoints: categories, meta, items (search/filter/sort/paginate), detail; quote.
3. [x] Home, Menu, dish detail with live PDF-sourced data and no invented copy.
4. [x] About, Gallery with disclosed temporary imagery, Reservations request form, Contact form.
5. [x] Auth pages, protected account overview, signed-in reservation history.
6. [x] Cart with local persistence, quantity caps, remove/clear and server quote handoff.
7. [x] Checkout foundation with pickup/delivery choice, server re-price, pending payment state.
8. [x] Per-route meta and responsive layout implemented for 360/390/768/1024/1440 px targets;
   manual sign-off outstanding.
9. [x] Server public API tests, client format/cart/validation tests, lint, format check and build.
10. [x] Playwright desktop/tablet/mobile tests for the public flows (Stage 2 7/7; Stage 3 4/4).
11. [x] Lighthouse measurements recorded; manual accessibility sign-off remains outstanding.
12. [ ] Genuine photography and approved business facts.

### Verification (2026-11-17)

- `npm.cmd run lint` — passed (server + client).
- `npm.cmd run build` — passed; bundle 551.80 kB (163.68 kB gzip). Rollup removed two
  zod `@__PURE__` comments and warned about a >500 kB chunk; no build failure.
- `npm.cmd run test:server` — 5 files, 75 tests passed.
- `npm.cmd run test:client` — 4 files, 22 tests passed.
- `npx.cmd playwright test` — 11/11 passed (Stage 2 7/7, Stage 3 4/4) after blocking remote
  Unsplash images in the public-route suite to keep third-party image loading from stalling runs.
- Lighthouse mobile — `/` 48 performance, `/menu` 67, `/reservations` 64; accessibility 96,
  best-practices 96, SEO 100. Performance remains limited by remote imagery.
- Outstanding: manual accessibility sign-off and genuine photography/business facts.

### Measurable Phase 2 quality gates

| Gate | Target |
| --- | --- |
| Lighthouse mobile — Performance | ≥ 90 on `/` and `/menu` |
| Lighthouse mobile — Accessibility | ≥ 95 on `/` and `/menu` |
| Lighthouse mobile — Best Practices | ≥ 95 on `/` and `/menu` |
| Lighthouse mobile — SEO | ≥ 95 on `/` and `/menu` |
| Lighthouse desktop — Performance | ≥ 95 on `/` and `/menu` |
| Lighthouse desktop — Accessibility/Best Practices/SEO | ≥ 95 each |
| Lab LCP | ≤ 2.5 s |
| Lab CLS | ≤ 0.1 |
| Lab TBT | ≤ 200 ms |
| Keyboard | All interactive elements reachable; visible focus; no traps; drawer/filter sheet closes on Esc and restores focus |
| Playwright viewports | Desktop 1440×900, tablet 768×1024, mobile 390×844 |

Use mobile Lighthouse emulation with simulated slow 4G and a cold load. If a target cannot be met,
record the measured value, cause and follow-up rather than claiming success. Measurements are
recorded above and the Playwright viewport suite passes; performance targets remain unmet because
of remote imagery, while accessibility, best-practices and SEO targets pass.

### Exit criteria
All approved public routes render live PDF-sourced data; no invented descriptions/ingredients/
claims; no unapproved business fact is publicly visible; category filtering and search work; item
detail handles sizes, serving choices, add-ons, invalid and unavailable products; cart and checkout
foundation use server pricing; reservation requests remain `pending`; Playwright passes at all three
viewports; Lighthouse targets are met or honestly reported; Phase 2 report lists every entry still
`needsReview`.

---

## Phase 3 — Customer accounts, ordering, reservations

> **Delivered in Stage 2 and Stage 3:** customer auth UI, account hub, profile/password editing,
> order history, signed-in reservation history/cancellation, cart, server order quote/placement,
> guest order lookup, order timeline, pickup/delivery architecture, reservation request form,
> staff reservation approval and transactional email outbox. Remaining Phase 3 work is delivery
> zone/fee operations, live online-payment activation, reservation availability/lookup and email
> delivery credentials.

### In scope
Order placement with **pickup and delivery**, delivery zone/fee setup, guest tracking, complete
reservation lifecycle, profile editing, order history, transactional email outbox (test mode
allowed). Online methods stay flagged off until a provider is configured and approved.

### Out of scope
Live provider payment capture and webhooks (adapter exists but inactive), broader admin payment
reconciliation UI, refunds.

### Tasks
1. [x] Auth UI: register, login, protected routes, `next` return. Password reset/verification
   delivery remains blocked on email delivery.
2. [x] Account hub, profile editing, password change, order history, reservation cancellation.
   Standalone `/account/*` subpages and reorder remain planned.
3. [ ] Fulfilment: delivery zone/fee CRUD and operations. Pickup works end-to-end; delivery stays
   unavailable until zones and fees are approved. `orderingPaused` is enforced.
4. [x] Payment method selection, idempotent order placement, confirmation/status page, guest
   lookup by email and order timeline.
5. [x] Server-priced order creation, status matrix and `PaymentTransaction` records.
6. [x] Reservation request form, `pending` status, reference, staff approval/decline, customer
   cancellation and decision/cancellation email queueing. Availability and guest lookup remain
   planned.
7. [x] Email outbox, Brevo adapter and templates; email failure does not roll back business
   writes. Delivery remains disabled without `EMAIL_DELIVERY_ENABLED` and credentials.
8. [x] Tests for quote tampering/unavailable/blocked items, reservation creation/history/cancel,
   contact validation, order placement/idempotency/ownership, invalid transitions, guest lookup,
   settings guards, account profile/password and email outbox behavior. Delivery-fee tests remain
   pending with zone operations.

### Exit criteria
Guest can order for pickup and request a table end-to-end; prices cannot be manipulated; no online
payment is marked paid without provider verification; tests green; Phase 3 report. Delivery
ordering remains gated on approved zones/fees.

### Stage 3 verification (2026-11-17)

- Server: 5 files, 75 tests passed, including 15 Stage 3 tests for order placement, idempotency,
  ownership/guest lookup, offline and online payment guards, cancellation, settings, reservation
  approval, email outbox, profile/password and admin validation.
- Client: 4 files, 22 tests passed; production build passed (551.80 kB / 163.68 kB gzip).
- Playwright: 11/11 passed (Stage 2 7/7, Stage 3 4/4). Stage 3 covers offline ordering and account
  history, admin order status, reservation approval and the guarded settings screen.
- Lint passed for server and client.
- Not verifiable without external inputs: live Flutterwave checkout/webhooks, Brevo delivery,
  delivery zones/fees, password-reset/verification email and genuine photography.

---

## Phase 4 — Administration

### In scope
Admin auth/roles, dashboard, menu management with verification flags, order operations, reservation
operations, customers, content, settings, payments **read + manual settlement**, reports.

### Out of scope
Online provider activation, refunds to provider, webhook processing (Phase 5), exports hardening
(Phase 6).

### Tasks
1. Admin shell behaviour, role guards, 403 states, audit logging on every mutation.
2. Dashboard KPIs + Recharts sales/status charts; revenue only from completed + paid.
3. Menu management: list, create/edit, archive/restore, categories + reorder, image URL fields
   (upload comes in Phase 5), add-on builder, availability/featured, **needs-review badge**,
   verified/PDF-page metadata, "cannot seed production" reminder.
4. Orders: status tabs, search, date/fulfillment filters, detail, allowed transitions, cancel with
   reason, item/add-on/instruction display, print view.
5. Payments: transaction list/detail, manual cash settlement (manager+, audited), provider status
   placeholders, reconciliation summary.
6. Reservations: queue, accept/reject, reschedule, seat/complete/no-show, notes, same-slot hint.
7. Customers: directory, detail, suspend/reactivate (not last admin).
8. Content: promotions, gallery, homepage/about curation, contact/hours/social edits with
   "unconfirmed" banner until owner approval.
9. Fulfilment settings: pickup/delivery toggles, pause ordering, zones CRUD with fees/minimum/ETA.
10. Settings: brand, contact, hours, social, reservations, payments, staff, integrations.
11. Reports + CSV export; audit log viewer.
12. Tests: RBAC matrix, transition matrix, manual settlement rules, zone validation, review flag
    surfaced, revenue exclusion, settings guards (online method cannot be enabled unconfigured).

### Exit criteria
Staff can run a service day without code changes; manager can configure delivery and menu; every
admin route rejects the wrong role; Phase 4 report.

---

## Phase 5 — Integrations and payment activation

### In scope
Cloudinary signed uploads, Brevo production templates, WhatsApp verified number, delivery
operations polish, **provider research + one Mobile Money adapter + one card adapter behind the
contract**, sandbox webhook verification, refunds, activation gates.

### Tasks
1. **Provider research brief** (written before code): candidate Rwandan Mobile Money and card
   providers, fees, settlement, API docs, webhook signature scheme, sandbox availability, KYC
   requirements, recommendation. No provider is coded until the business approves.
2. Cloudinary: signed upload endpoint, client dropzone, transform helper, replace/cleanup,
   MIME/size re-validation.
3. Brevo: branded templates for all events, retry worker, admin log + test send.
4. WhatsApp: settings-driven float, pre-filled order message, hidden until verified.
5. Payments: implement `createSession`, `verify`, `parseWebhook`, `refund` adapters; raw-body
   webhook route with signature verification; `PaymentWebhookEvent` dedupe; status polling;
   return-page re-verification; sandbox tests with fixtures; feature flags remain off by default.
6. Activation checklist in admin: provider configured, webhook healthy, sandbox test passed,
   business sign-off recorded, then enable method.
7. Tests: signature failure, duplicate event, out-of-order events, amount mismatch, refund
   overrun, adapter contract conformance, flag gating.

### Exit criteria
Sandbox payment for both Mobile Money and card passes with signed webhooks; activation requires
explicit checklist; live keys never required to ship Phase 5; Phase 5 report.

---

## Phase 6 — Testing, hardening, deployment

1. Full regression suite + Playwright E2E: guest pickup order, delivery order, registered order,
   reservation → admin confirm, admin menu edit → public reflection, payment sandbox success and
   failure.
2. Security review: headers, cookies, CSRF, injection, mass assignment, rate limits, webhook
   signature, secret scan, dependency audit, PII masking.
3. Performance: code splitting, bundle analysis, image budgets, cache headers.
4. Deployment: Vercel, Render, Atlas; env matrix; indexes; backups; runbook; rollback.
5. Documentation: final API reference, ops runbook, admin guide, launch checklist, and a menu
   register export listing every `needsReview` entry for business sign-off.
6. SEO decision: Vite prerender vs. Next migration for dynamic dish pages.

Exit criteria: suite green, staging smoke test, checklist signed, known issues listed.

---

## Test matrix (minimum)

| Area | Cases |
| --- | --- |
| Auth | duplicate, weak password, wrong/right login, rotation, reset single-use, suspended blocked |
| RBAC | customer → admin 403, staff → settings 403, manager → staff 403 |
| Menu | archived excluded, search/filter, admin CRUD, integer price, unverified seed blocked |
| Fulfilment | pickup/delivery flags, zone required, fee server-derived, paused ordering |
| Orders | total recalculated, unavailable rejected, qty bounds, invalid transition 409, cancel rules, guest lookup needs email, idempotency |
| Payments | no paid without verification, signature failure, duplicate webhook, amount mismatch, refund overrun, method gating, manual settlement audited |
| Reservations | past date, closed day, out-of-hours, party bounds, no auto-confirm, double accept |
| Content | promotion outside window hidden, unapproved review hidden |
| Frontend | cart maths/persistence, checkout validation, menu no-results, drawer a11y, admin status update |
| E2E | pickup order, delivery order, reservation → confirm, menu edit → public, sandbox payment |

---

## Risks and mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| PDF unavailable at this stage | Provisional names/prices may differ | Seed all lines as `needsReview`, keep admin-editable, reconcile when PDF arrives (Q1) |
| No drinks data | Coffee section empty | Scaffold + admin entry; never invent (Q5) |
| Payment provider unselected | Activation blocked | Provider-agnostic contract, sandbox adapters, activation checklist (Q7) |
| Unverified business facts | Legal/trust | Publication gate: unapproved contact/hours/fees never rendered (Q3/Q4/Q6) |
| Delivery operations unknown | Wrong fees/ETA | Zones configure fees; defaults off; admin controls (Q6) |
| Cloudinary/Brevo keys absent | Integrations unverifiable | Adapter + logged test mode; never claim success without keys |
| Webhook spoofing | False paid orders | Raw-body signature verification, event dedupe, server re-verify |
| SPA SEO | Weak indexing | Meta + JSON-LD now; prerender/Next decision in Phase 6 |

---

## Open decision for Phase 6

`Vite SPA + prerender` vs `Next.js` for indexable dish pages. Recommendation: stay on Vite and
prerender `/`, `/menu`, `/about`, `/contact`, `/gallery`; serve dish routes with server-injected
meta via a Vercel edge function. Needs your decision before Phase 6, not before Phase 1.
