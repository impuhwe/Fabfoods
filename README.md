# FAB FOODS

Restaurant and coffee platform for FAB FOODS, Kigali. This repository is a
two-package npm workspace:

- `server/` — Node.js, Express 4, MongoDB (Mongoose), cookie-based JWT auth.
- `client/` — React 18, Vite 7, Tailwind CSS 3, React Router 7.

Phase 0 planning lives in `docs/`. Phase 1 delivers the foundation: authentication,
RBAC, security middleware, design tokens, accessible UI primitives, public/admin
shells and tests. Phase 2 Stage 1 adds the PDF-sourced menu models, manifest, seed
and server-side option pricing. Phase 2 Stage 2 adds the public restaurant website,
live menu browsing, cart, reservation requests, contact messages, account views and
checkout. Phase 2 Stage 3 adds server-priced order placement, offline payment
recording, a modular Flutterwave adapter, an email outbox, account profile/password
management, reservation cancellation, configurable business settings and staff
order/reservation/settings screens. Online payments and email delivery stay disabled
until credentials and business approval are supplied.

## Requirements

- Node.js 22.12+ (developed on 24.x)
- npm 10+
- MongoDB 7+ locally, or a MongoDB connection string
- Windows: use `npm.cmd` if PowerShell blocks `npm.ps1` under the execution policy

## Setup

```sh
npm install
copy .env.example .env
```

Edit `.env`, generate two different secrets, then start both apps:

```sh
npm run dev
```

- Web: http://localhost:5173
- API: http://localhost:5000
- Liveness: http://localhost:5000/api/v1/health/live
- Readiness: http://localhost:5000/api/v1/health/ready

Create the first administrator (no credentials are hardcoded):

```sh
set ADMIN_NAME=Owner
set ADMIN_EMAIL=owner@example.com
set ADMIN_PASSWORD=use-a-long-unique-password
npm run create-admin
```

The script refuses weak passwords, never prints the password, and cannot be run
in production unless `ALLOW_ADMIN_BOOTSTRAP=true` is explicitly set.

## Scripts

| Command                   | Purpose                              |
| ------------------------- | ------------------------------------ |
| `npm run dev`             | Run API and web client together      |
| `npm run dev:server`      | Run the API with Node watch mode     |
| `npm run dev:client`      | Run the Vite dev server              |
| `npm run build`           | Production build of the client       |
| `npm run start`           | Start the API                        |
| `npm run lint`            | Lint server and client               |
| `npm run test`            | Run server and client tests          |
| `npm run test:e2e`        | Run Playwright QA against the QA API |
| `npm run test:e2e:stage2` | Run the Stage 2 public-site QA spec  |
| `npm run test:e2e:stage3` | Run the Stage 3 order/admin QA spec  |
| `npm run qa:lighthouse`   | Run Lighthouse against a preview URL |
| `npm run format`          | Format the repository with Prettier  |
| `npm run create-admin`    | Bootstrap an administrator account   |
| `npm run seed:menu`       | Seed the PDF-sourced menu register   |

Seed the PDF-sourced menu only after MongoDB is running:

```sh
npm run seed:menu -- --allow-unverified
```

The flag acknowledges that every entry still needs business review. The active manifest is
`server/src/scripts/data/menu.pdf.manifest.js`: 19 categories, 111 products, 7 add-ons and 24 review
flags. The seed is create-only by slug, preserves existing admin edits, and does not claim
verification. `--reset` is development-only. A database already seeded from the Stage 1 brief
manifest needs a development reset or a migration.

## Stage 2 and Stage 3 website

Implemented public routes:

- `/` home, `/menu`, `/menu/:slug`, `/about`, `/gallery`, `/reservations`, `/contact`
- `/cart`, `/checkout` (server-priced order placement for pickup; delivery stays gated)
- `/order/:orderNumber` (guest email lookup, status timeline, payment state, cancellation)
- `/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify-email`
- `/account` (protected; profile editing, password change, order history, reservation history
  and cancellation)

Implemented staff routes (staff/manager/admin, with settings limited to manager/admin):

- `/admin`, `/admin/orders`, `/admin/reservations`, `/admin/settings`

Implemented public APIs:

- `GET /api/v1/menu/categories`, `/menu/meta`, `/menu/items`, `/menu/items/:slug`
- `GET /api/v1/settings/public`
- `POST /api/v1/orders/quote` (server-authoritative pricing and fulfilment checks)
- `POST /api/v1/orders`, `GET /api/v1/orders/:orderNumber`,
  `POST /api/v1/orders/:orderNumber/cancel`
- `POST /api/v1/orders/:orderNumber/payments/initiate`,
  `POST /api/v1/orders/:orderNumber/payments/verify`
- `POST /api/v1/payments/webhooks/:provider` (signature-verified; inactive while disabled)
- `POST /api/v1/reservations`, `GET /api/v1/reservations/mine`,
  `POST /api/v1/reservations/:reference/cancel`
- `POST /api/v1/contact`
- `GET /api/v1/me/orders`, `GET /api/v1/me/orders/:orderNumber`,
  `PATCH /api/v1/me/profile`, `POST /api/v1/me/password`

Implemented staff APIs:

- `GET /api/v1/admin/orders`, `GET /api/v1/admin/orders/:id`,
  `PATCH /api/v1/admin/orders/:id/status`, `PATCH /api/v1/admin/orders/:id/payment`
- `GET /api/v1/admin/reservations`, `PATCH /api/v1/admin/reservations/:id/status`
- `GET /api/v1/admin/settings`, `PATCH /api/v1/admin/settings`
- `GET /api/v1/admin/emails`, `POST /api/v1/admin/emails/process`,
  `POST /api/v1/admin/emails/:id/retry`

The public site never publishes unapproved contact details, opening hours, social
links, delivery fees or business claims. PDF-sourced items with blocking review tags
are visible but cannot be ordered. Reservation submissions are requests, not confirmed
bookings. Temporary Unsplash editorial imagery is disclosed in the footer and gallery
until genuine FAB FOODS photography is supplied. Online payments remain unavailable until
a provider is configured and approved; email messages are queued in the outbox but not
delivered until Brevo credentials are supplied and delivery is enabled.

Known pending integrations: payment provider credentials and business approval, delivery
zones and fees, Brevo email delivery (including password reset and verification), and
genuine photography. See `docs/API_DOCUMENTATION.md`, `docs/DATABASE_DESIGN.md` and
`docs/SCREEN_INVENTORY.md` for the implemented subset.

## Security baseline

- Access and refresh JWTs are stored in `HttpOnly` cookies; refresh tokens are
  hashed at rest and rotated on every use with reuse detection and family
  revocation.
- Every state-changing request authenticated by cookies requires a CSRF token
  (`X-CSRF-Token`) that must match the `ff_csrf` cookie.
- Suspended accounts and revoked sessions are rejected on every authenticated
  request.
- Login and registration are rate limited; Helmet, HPP and Mongo operator
  sanitisation are enabled.
- `/health/live` never touches the database. `/health/ready` reports 503 until
  MongoDB is reachable.
- No secrets, password hashes or token values are returned by the API or logged.

## Phase status

- Phase 0 — planning: complete (`docs/`).
- Phase 1 — foundation: complete.
- Phase 2 — Stage 1 PDF-sourced menu models, manifest, seed and pricing: complete, awaiting business review.
- Phase 2 — Stage 2 public website, menu API, cart, reservation requests, contact messages,
  account views and checkout foundation: complete, awaiting approval and business inputs.
- Phase 2 — Stage 3 server-priced orders, offline payments, payment adapter, email outbox,
  account management, reservation cancellation, settings and staff order/reservation/settings
  screens: complete, awaiting provider credentials, business approval and genuine photography.
- Phase 3+ — delivery operations, live payment capture/webhooks, email delivery, broader admin
  CRUD and later phases: pending external inputs.
