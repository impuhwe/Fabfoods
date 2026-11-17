# FAB FOODS — Screen Inventory

Status: Phase 0 proposal, with the Phase 2 Stage 2 and Stage 3 implemented subsets noted below.
45 screens (27 public/customer, 18 admin) remain the target inventory.
Legend: **Auth** = G guest · C customer · S staff · M manager · A admin.

Stage 2 implemented public/customer routes: P-01 Home, P-02 Menu, P-03 Dish detail, P-04 About,
P-05 Gallery, P-06 Reservations, P-07 Contact, P-08 Cart, P-09 Checkout, P-12 Login, P-13 Register,
P-14 Forgot password, P-15 Reset notice, P-16 Verify notice, P-17 Account hub, P-22 Not found.
Stage 3 adds server-priced order placement at P-09, order confirmation/status at P-10, profile,
password, order history and reservation cancellation inside P-17, and staff A-07 Orders,
A-09 Reservations and A-16 Settings. Standalone `/account/*` subpages, delivery operations, online
payment handoff/return, live tracking lookup and legal pages remain planned. Rows below describe
the target surface; unimplemented states are planned.

---

## 1. Public / customer

| # | Screen | Route | Auth | Purpose | Key components | States |
| --- | --- | --- | --- | --- | --- | --- |
| P-01 | Home | `/` | G | Brand entry point | Hero, live category tiles, featured plates, story band, coffee, gallery teaser, reservation CTA, pending-contact footer | loading skeletons, menu load error |
| P-02 | Menu | `/menu` | G | Browse/search/filter full menu | Sticky category rail, debounced search, kind/category chips, sort, dish grid, load more, cart drawer; `q`, `category`, `kind` and `sort` persist in the URL; PDF-sourced items render name/price/image and stated options only, no invented copy | loading skeleton grid, empty search, clear filters, awaiting-confirmation items not orderable |
| P-03 | Dish detail | `/menu/:slug` | G | Full dish info + purchase | Image, name, price, description only when supplied, `includedItems`, size/serving choices, confirmed paid add-ons, qty, add-to-cart | loading, 404, awaiting-confirmation state, required-choice validation |
| P-04 | About | `/about` | G | Story, identity, space | Editorial intro, image pair, values (only confirmed claims), gallery strip, contact strip | image fallback |
| P-05 | Gallery | `/gallery` | G | Full photo set | Filterable masonry grid, lightbox (keyboard, focus trap) | empty, loading |
| P-06 | Reservations | `/reservations` | G | Request a table | Intro, request form (name, email, phone, date, time, guests, requests), "request not confirmed" notice, pending reference panel; no availability or capacity claim | validation errors, submitting, success with `pending` status, server error |
| P-07 | Contact | `/contact` | G | Reach the restaurant | Contact form plus a neutral "details being confirmed" block; no unapproved address/phone/email, hours, map, WhatsApp or socials | form errors, submitting, saved-message success, server error |
| P-08 | Cart | `/cart` | G | Review basket | Line items, add-on summary, qty steppers, remove/clear, subtotal estimate, checkout CTA | empty cart, quantity cap |
| P-09 | Checkout | `/checkout` | G/C | Review fulfilment and place an order | Pickup/delivery choice, contact/address fields, server quote, payment method selection, idempotent order placement, delivery-unavailable and payment-pending panels | validation, quote loading/error, delivery unavailable, offline order placed, online payment pending |
| P-09a | Payment handoff | `/checkout/payment/:reference` | G/C | Handle MoMo prompt or card redirect | **Planned.** Method-specific instructions, countdown/expiry, "I've paid, check status" polling, cancel | awaiting customer, processing, failed, expired, provider unavailable |
| P-09b | Payment return | `/payments/return/:reference` | G/C | Provider redirect landing | **Planned.** Server re-verification spinner, resolves to confirmation or retry | verifying, success, failed, already-processed |
| P-10 | Order confirmation/status | `/order/:orderNumber` | G/C | Post-purchase + status timeline | **Implemented.** Order number, payment state (separate from order state), status timeline, items, totals, guest email gate, payment re-check, cancellation | not-found, guest email gate, payment pending, cancelled |
| P-11 | Order tracking | `/track` | G | Look up order | Form (order no. + email/phone), then status timeline | lookup error, expired, loading |
| P-12 | Login | `/login` | G | Sign in | Email/password, remember me, forgot link, register link | invalid credentials, lockout/rate-limit message |
| P-13 | Register | `/register` | G | Create account | Name, email, phone, password, confirm, terms checkbox | field errors, email exists, weak password |
| P-14 | Forgot password | `/forgot-password` | G | Request reset | Email field | neutral success (never reveals account existence) |
| P-15 | Reset notice | `/reset-password` | G | Explain pending reset delivery | Honest notice that email reset links are not connected yet, link back to sign in | - |
| P-16 | Verify notice | `/verify-email` | G | Explain pending verification delivery | Honest notice that email verification is not connected yet, link back to sign in | - |
| P-17 | Account hub | `/account` | C | Profile and history hub | **Implemented.** Profile editing, password change, order history, signed-in reservation history with cancellation, sign out | loading, empty history, save error, cancel confirm |
| P-18 | Profile | `/account/profile` | C | Edit details | Planned standalone route; editing is delivered inside P-17 | saving, success, server error |
| P-19 | My orders | `/account/orders` | C | History | Planned standalone route; history is delivered inside P-17 | empty, loading |
| P-20 | Order detail (account) | `/account/orders/:id` | C | Reorder + track | Planned standalone route; order status is delivered at `/order/:orderNumber` | not-found (ownership), cancelled |
| P-21 | My reservations | `/account/reservations` | C | History | Planned standalone route; history and cancellation are delivered inside P-17 | empty, cancel confirm |
| P-22 | Not found | `*` | G | 404 | Editorial 404, links home/menu | — |
| P-23 | Server error | error boundary | G | 500 | Recovery UI, retry | — |
| P-24 | Privacy policy | `/privacy` | G | Legal | Rendered content | content pending (Q17) |
| P-25 | Terms | `/terms` | G | Legal | Rendered content | content pending (Q17) |

Global public components: header (sticky, mobile drawer, cart badge), cart sheet, footer,
WhatsApp float, toast host, cookie/consent note (if analytics added), scroll-to-top.

---

## 2. Admin

Admin base path `/admin`, own layout (sidebar + topbar), role-gated, no public footer.

| # | Screen | Route | Auth | Purpose | Key components | States |
| --- | --- | --- | --- | --- | --- | --- |
| A-01 | Admin login | `/admin/login` | G | Staff sign-in | Email/password, 2-field form, rate-limit notice | invalid, locked, unauthenticated redirect back |
| A-02 | Dashboard | `/admin` | S+ | Operational overview | KPI cards, sales area chart (Recharts), orders-by-status bar, payment-state mix, recent orders, recent reservations, popular items | loading KPIs, empty state, range selector |
| A-03 | Menu items | `/admin/menu` | M+ | Manage dishes | Search, category filter, availability toggle, needs-review badge, verified/PDF-page metadata, table (image, name, category, price, status, featured), bulk archive, pagination | empty, loading, unavailable filter, unverified seed warning |
| A-04 | Create item | `/admin/menu/new` | M+ | Add dish | Form (name, slug auto, category, price, description, image upload, availability, featured, add-ons builder, display order) | validation, upload progress, draft saved |
| A-05 | Edit item | `/admin/menu/:id` | M+ | Update dish | Same form + metadata (source ref, needs-review flag), archive/restore, delete (admin only) | not-found, dirty-state guard |
| A-06 | Categories | `/admin/menu/categories` | M+ | Structure the menu | List, reorder (drag), visibility toggle, create/edit drawer, kind (food/drink) | empty, duplicate slug, in-use delete blocked |
| A-07 | Orders | `/admin/orders` | S+ | Fulfilment queue | **Implemented.** Status filter, table, order detail drawer, status actions and offline payment recording; search/date range/bulk/CSV remain planned | empty, loading, transition rejected |
| A-08 | Order detail | `/admin/orders/:id` | S+ | Process an order | **Implemented in the orders screen.** Customer, items, totals, payment state, allowed status transitions and history; print/refunds remain planned | not-found, transition rejected, online payment not verified |
| A-08a | Payments | `/admin/payments` | S+ | Transaction ledger | Filters (status/method/provider/date), transaction table, reconciliation totals, manual settlement, provider health strip | empty, loading, provider unconfigured |
| A-08b | Payment detail | `/admin/payments/:id` | S+ | Investigate a payment | Transaction fields, webhook events, signature status, order link, refunds, audit trail | not-found, refund overrun blocked |
| A-09 | Reservations | `/admin/reservations` | S+ | Manage requests | **Implemented.** Date/status filters, table, confirm/decline/complete/no-show actions and history; capacity hints and CSV remain planned | empty, loading, transition rejected |
| A-10 | Reservation detail | `/admin/reservations/:id` | S+ | Handle a booking | **Implemented in the reservations screen.** Guest details, notes, status history; reschedule and email log remain planned | not-found, transition rejected |
| A-11 | Customers | `/admin/customers` | M+ | Customer directory | Search, registered date, order count, spend, status | empty, loading |
| A-12 | Customer detail | `/admin/customers/:id` | M+ | Support view | Profile, orders, reservations, notes, suspend/reactivate | not-found |
| A-13 | Promotions | `/admin/content/promotions` | M+ | Campaigns | List (active/scheduled/expired), create/edit, placement, schedule | empty, invalid date range, conflict warning |
| A-14 | Gallery | `/admin/content/gallery` | M+ | Photo library | Grid, upload (signed), alt/caption/category, publish toggle, reorder, delete | upload error, unsaved changes |
| A-15 | Homepage & About | `/admin/content/pages` | M+ | Curate marketing | Featured dish picker, hero banner slots, story copy + image, section toggles | unsaved changes, missing required image |
| A-16 | Settings | `/admin/settings` | M+ | Business configuration | **Implemented subset.** Contact approval/publish, opening hours, reservations, fulfillment/pickup/delivery flags, delivery zones, payment methods and verification approvals; brand/SEO/social/staff/email-template tabs remain planned | validation, secret never echoed, method cannot be enabled while unconfigured, unverified fields clearly marked "not public" |

Cross-cutting admin components: role-aware sidebar, breadcrumbs, command/search (orders, dishes,
customers), data table with server pagination, confirm dialog, drawer form, upload dropzone,
status badge, empty state, CSV export button, audit-log drawer (per entity).

---

## 3. Route guards

- Public routes: no guard; cart persists locally.
- `/account`: requires a valid session; unauthenticated visitors are redirected to `/login`
  and returned to `/account` after signing in. Additional `/account/*` screens are planned.
- `/admin/*`: requires role `staff|manager|admin`; unauthorized → `/admin/login` with notice;
  `customer` role → 403 screen (not a redirect loop).
- Server mirrors every guard; client guards are UX only.

---

## 4. Responsive notes per area

| Area | Mobile | Tablet | Desktop |
| --- | --- | --- | --- |
| Menu | 1 col, sticky category scroll, filters in sheet, item opens route | 2 col | 3 col + right drawer |
| Cart | bottom sheet / full page | drawer | drawer 420 px |
| Checkout | single column, sticky total bar | 1 col | 7/5 split, sticky summary |
| Admin tables | stacked record cards | condensed table | full table |
| Admin nav | bottom tabs (5 max) + "More" sheet | icon rail | 240 px sidebar |
| Reservation form | stacked, native pickers | 2-up fields | 2-up with side policy panel |
