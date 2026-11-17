# FAB FOODS — API Documentation (design)

Base URL: `/api/v1`. Status: Phase 0 design plus the Phase 2 Stage 2 and Stage 3 implemented
subsets documented in §0 and §0.1. Endpoints in later sections are planned and may not exist yet.

---

## 0. Implemented in Phase 2 Stage 2

These endpoints are live and covered by `server/tests/public.test.js`:

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/menu/categories` | Visible categories with item counts |
| GET | `/menu/meta` | Categories, total item count, featured count, orderability notice |
| GET | `/menu/items` | `?category=&kind=&search=&sort=&page=&limit=`; `kind` is `food\|drink\|dessert`; sort is `recommended\|price-asc\|price-desc\|name` |
| GET | `/menu/items/:slug` | Detail with stated `includedItems`, `sizeOptions`, `servingOptions`, paid `addonGroups`; internal review/provenance fields are omitted |
| POST | `/orders/quote` | Server re-prices a cart; validates availability and orderability; returns pickup/delivery availability and pending-payment state |
| POST | `/reservations` | Creates a request with status `pending` and an `RS-…` reference; never confirms a table |
| GET | `/reservations/mine` | Authenticated reservation history for the signed-in user |
| POST | `/contact` | Saves a contact message for staff; email delivery is not connected |

Request notes:

- All unsafe methods, including unauthenticated `POST /orders/quote`, `POST /reservations` and
  `POST /contact`, require the double-submit `X-CSRF-Token` header. The browser client obtains
  the `ff_csrf` cookie from `GET /auth/csrf` automatically.
- `POST /orders/quote` body is strict: `{ items: [{ slug, quantity, sizeLabel?,
  servingSelections?, addonSelections? }], fulfillmentType: "pickup"|"delivery" }`. Any
  client-supplied price is rejected by validation.
- Delivery is returned as `available: false` with a pending-zones message. Online payment is
  returned as `onlineEnabled: false`. No order is placed by the quote endpoint.
- Menu items with a blocking review tag (`MENU_ORDER_BLOCKING_REVIEW_TAGS`) remain visible but
  return `isOrderable: false` and are rejected by the quote endpoint.

Not implemented in Stage 2: `POST /orders`, payment initiation/webhooks, public settings/content/
gallery/reviews/promotions, reservation lookup/cancel by reference, uploads, email delivery and
admin CRUD. Stage 3 adds orders, payments, settings, cancellation and the staff subset documented
in §0.1; the remaining items stay deferred.

## 0.1 Implemented in Phase 2 Stage 3

These endpoints are live and covered by `server/tests/stage3.test.js`:

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/settings/public` | Safe public subset; contact/hours stay hidden until approved; online methods stay hidden until provider-ready |
| POST | `/orders` | Server-priced pickup order placement; guest or signed-in; offline payment starts `confirmed` with `paymentStatus: pending`; `Idempotency-Key` supported |
| GET | `/orders/:orderNumber` | Owner or guest `?email=` lookup; public timeline only |
| POST | `/orders/:orderNumber/cancel` | Owner/guest email match; allowed only while `pending_payment\|confirmed` and unpaid |
| POST | `/orders/:orderNumber/payments/initiate` | Online methods only; returns a provider checkout URL; disabled until provider configured |
| POST | `/orders/:orderNumber/payments/verify` | Re-verifies with the provider; browser redirects are not proof of payment |
| POST | `/payments/webhooks/:provider` | Signature-verified provider webhook; inactive while the provider is disabled |
| GET | `/me/orders` | Paginated signed-in order history |
| GET | `/me/orders/:orderNumber` | Signed-in order detail with ownership enforced |
| PATCH | `/me/profile` | Update name, email or phone; duplicate email returns 409 |
| POST | `/me/password` | Current + new password; other sessions are revoked |
| POST | `/reservations/:reference/cancel` | Owner or guest email match; allowed while `pending\|confirmed` |
| GET | `/admin/orders` | Staff queue with `?status=&page=&limit=` |
| GET | `/admin/orders/:id` | Order detail plus payment transactions |
| PATCH | `/admin/orders/:id/status` | Matrix-enforced staff status transition |
| PATCH | `/admin/orders/:id/payment` | Offline payment reconciliation only; online orders require provider verification |
| GET | `/admin/reservations` | Staff queue with `?status=&date=&page=&limit=` |
| PATCH | `/admin/reservations/:id/status` | Approve/decline/complete/no-show with history |
| GET/PATCH | `/admin/settings` | Manager/admin settings; unsafe delivery or online-payment combinations are rejected |
| GET | `/admin/emails` | Outbox list with `?status=&page=&limit=` |
| POST | `/admin/emails/process` | Process queued mail; returns `skipped: true` while delivery is disabled |
| POST | `/admin/emails/:id/retry` | Requeue a failed outbox message |

Stage 3 request notes:

- `POST /orders` is strict: `{ items: [{ slug, quantity, sizeLabel?, servingSelections?,
  addonSelections? }], fulfillmentType, customer: { name, email, phone }, paymentMethod,
  deliveryAddress?, notes? }`. The server re-prices every line; client prices/fees are rejected.
- `pay_at_restaurant` requires pickup and `cash_on_delivery` requires delivery. Delivery remains
  unavailable until zones and fees are approved.
- Offline orders are created as `confirmed` with `paymentStatus: pending`; staff record payment
  separately. Online orders require a configured provider and approved payment settings, then start
  as `pending_payment` until the provider is verified.
- Email failures never roll back an order or reservation. Messages are written to the outbox and
  only delivered when `EMAIL_DELIVERY_ENABLED=true` with Brevo credentials.
- Reservation requests are always `pending`; `autoConfirm: true` is rejected by validation.

Stage 3 deliberately does not implement delivery zone CRUD, live provider webhook testing or
activation, refunds, Cloudinary uploads, broader admin CRUD, promotions/reviews/gallery APIs, or
password-reset/verification email delivery.

---

## 1. Conventions

**Success envelope**
```json
{ "success": true, "data": {}, "meta": { "page": 1, "limit": 20, "total": 84 } }
```

**Error envelope**
```json
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "…",
  "details": [{ "field": "price", "message": "Must be a positive integer" }] },
  "requestId": "…" }
```

- Codes: `VALIDATION_ERROR` 400 · `UNAUTHENTICATED` 401 · `FORBIDDEN` 403 · `NOT_FOUND` 404 ·
  `CONFLICT` 409 · `INVALID_TRANSITION` 409 · `RATE_LIMITED` 429 · `INTERNAL` 500.
- Pagination: `?page=1&limit=20` (endpoint-specific caps; public menu max 60). Sort:
  `?sort=-createdAt`.
- Money: integer RWF. Dates: ISO 8601. Reservation `date` `YYYY-MM-DD`, `time` `HH:mm`.
- All mutating requests require `Content-Type: application/json` and an `X-CSRF-Token` header
  matching the readable `ff_csrf` cookie (double-submit). This applies to public POSTs too.
- Idempotency: `Idempotency-Key` is accepted on `POST /orders`; replaying the same key returns the
  original order for the same owner/email. Payment initiation reuses an existing checkout session.
- Payments are provider-agnostic. Method (`mobile_money|bank_card|cash_on_delivery|pay_at_restaurant`)
  and provider key are separate fields. No provider is assumed selected. Browser return URLs are
  never trusted as payment proof; the server re-verifies with the provider or waits for a signed
  webhook.
- Delivery fees and totals are always server-derived; any client-supplied fee is discarded.
- **Publication gate:** unapproved business facts (contact, hours, social links, delivery rules)
  are never serialised by public endpoints. They are stored and editable via admin endpoints only.
- Auth: access token in httpOnly `SameSite=Lax` cookie (15 min) + refresh cookie (7 days,
  rotated). No tokens in `localStorage`.

---

## 2. Public

### Meta
| Method | Path | Description |
| --- | --- | --- |
| GET | `/health` | Liveness + dependency status (no secrets) |

### Menu
| Method | Path | Description |
| --- | --- | --- |
| GET | `/menu/categories` | Visible categories with item counts, ordered |
| GET | `/menu/items` | Paginated items. `?search=&category=&kind=&sort=&page=&limit=` (featured/popular/available filters are planned) |
| GET | `/menu/items/:slug` | Item detail + category + `includedItems`, `sizeOptions`, `servingOptions` and paid `addonGroups`. Prices are display values; order pricing must be server-resolved. `needsReview` and provenance are admin-only fields |
| GET | `/menu/meta` | Categories, total item count, featured count and orderability notice (for filters UI) |

PDF-sourced entries are returned normally (name, price, category, image and stated options) with
empty description fields omitted, never filled with invented copy. Admin endpoints expose
`needsReview`, `dataSource`, `verified` and `reviewNote`.

### Content
| Method | Path | Description |
| --- | --- | --- |
| GET | `/settings/public` | Safe subset: brand, **only approved** contact and hours, published social links, fulfillment flags, enabled payment methods, reservation policy. Unapproved fields are omitted with a `pendingVerification` list of section keys |
| GET | `/content/home` | Hero slides, featured items, active promotions, published gallery teaser, approved featured reviews |
| GET | `/gallery` | Published images, optional `?category=` |
| GET | `/promotions` | Active, in-window promotions only |
| GET | `/reviews` | Approved, paginated; `?featured=true` |
| POST | `/reviews` | Submit review (rate-limited, moderated, optional auth) |
| POST | `/contact` | Contact message → EmailLog (staff notification), rate-limited |

### Fulfilment
| Method | Path | Description |
| --- | --- | --- |
| GET | `/fulfillment/options` | Pickup/delivery availability, active zones, ETA, minimums, ordering-paused reason |
| POST | `/fulfillment/quote` | `{type, zoneId, subtotal, items[]}` → server-derived `{deliveryFee, etaMinutes, available, reason}`. Client never submits a final fee |
| GET | `/payments/methods` | Enabled methods with display label and approved icon key (no secrets). Empty for online methods until configured |

### Orders
| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/orders` | optional | Place order. Server re-prices every line and derives delivery fee. Guest allowed |
| POST | `/orders/quote` | optional | Re-price a cart (validates availability, returns authoritative totals + fulfillment options) |
| GET | `/orders/:orderNumber` | token/guest | Confirmation lookup: `?email=` or `?token=` |
| GET | `/orders/:orderNumber/track` | token/guest | Status timeline (no PII beyond masked name) |
| POST | `/orders/:orderNumber/cancel` | token/customer | Allowed only in `pending\|confirmed` |
| POST | `/orders/:orderNumber/payments` | token/customer | Initiate a payment session for the order. Body `{method, returnUrl?}`. Idempotent |
| GET | `/orders/:orderNumber/payments/current` | token/customer | Current payment state (re-fetches from provider when `processing`) |
| GET | `/payments/return/:reference` | token/guest | Provider return landing; **does not trust the redirect** — server re-verifies, then redirects to the confirmation page |

`POST /orders` body (shape):
```json
{
  "customer": { "name": "", "email": "", "phone": "" },
  "fulfillment": { "type": "delivery",
                   "address": { "line1": "", "line2": "", "city": "Kigali",
                                "district": "Kacyiru", "notes": "" },
                   "zoneId": "…", "instructions": "" },
  "items": [{ "menuItemId": "…", "quantity": 2, "addons": [{ "optionId": "…" }],
              "instructions": "" }],
  "paymentMethod": "mobile_money",
  "promotionCode": null,
  "idempotencyKey": "…"
}
```
`paymentMethod` must be present in `settings.payments.enabledMethods`. For online methods, order
creation returns `payment.nextAction` (`redirect` with provider URL, or `await_customer` for a
Mobile Money prompt) instead of marking anything paid. Server returns authoritative `pricing` and
ignores any client-sent prices or fees.

### Payment webhooks (raw body, unversioned path)

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/payments/webhooks/:provider` | signature | **Implemented.** Provider signature header verified with env secret; duplicate provider event ids are ignored; only verified payments mark an order paid |
| GET | `/payments/webhooks/:provider/health` | internal | Planned |

Rules: the webhook path is exempt from CSRF and authenticated by the provider signature; a failed
signature returns `403`; unknown provider keys return `404`; duplicates by `(provider, eventId)`
return `200` without side effects; only provider-verified `succeeded` payments may mark an order
paid. The adapter is inactive while `PAYMENT_PROVIDER=disabled`.

### Reservations
| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/reservations` | optional | **Implemented.** Create request → `pending` + `RS-…` reference |
| GET | `/reservations/mine` | required | **Implemented.** Signed-in user's request history |
| GET | `/reservations/availability` | public | Planned. `?date=` returns slots, closed flag, capacity remaining (advisory) |
| GET | `/reservations/:reference` | email match | Planned. Lookup requires `?email=` matching the record |
| POST | `/reservations/:reference/cancel` | owner/email match | **Implemented.** Cancel while `pending\|confirmed`; queues a cancellation email |

### Auth
| Method | Path | Description |
| --- | --- | --- |
| POST | `/auth/register` | Create customer, send verification email |
| POST | `/auth/login` | Sets access + refresh + csrf cookies; role returned |
| POST | `/auth/logout` | Revokes session, clears cookies |
| POST | `/auth/refresh` | Rotates refresh token |
| GET | `/auth/me` | Current user (or 401) |
| POST | `/auth/forgot-password` | Always 200 (no account enumeration) |
| POST | `/auth/reset-password/:token` | Single-use, 30 min expiry |
| POST | `/auth/verify-email/:token` | Marks verified |
| POST | `/auth/resend-verification` | Rate-limited |

### Customer (auth: customer+)
| Method | Path | Description |
| --- | --- | --- |
| GET | `/auth/me` | **Implemented.** Current profile |
| PATCH | `/me/profile` | **Implemented.** Update name, email or phone |
| POST | `/me/password` | **Implemented.** Current + new password; revokes other sessions |
| GET/POST/PATCH/DELETE | `/me/addresses[/:id]` | Planned. Max 5 |
| GET | `/me/orders` | **Implemented.** Paginated order history |
| GET | `/me/orders/:orderNumber` | **Implemented.** Ownership enforced |
| POST | `/me/orders/:id/reorder` | Planned. Returns current cart payload with price/availability deltas |
| GET | `/reservations/mine` | **Implemented.** Reservation history |
| POST | `/reservations/:reference/cancel` | **Implemented.** Owner/email match enforced |

---

## 3. Admin (auth: staff/manager/admin unless noted)

Stage 3 implements the order queue/detail/status/payment endpoints, reservation queue/status,
the settings read/update endpoint and the email outbox list/process/retry endpoints below.
Analytics, menu CRUD, payments ledger, customers, content, staff, uploads and audit logs remain
planned.

### Analytics
| Method | Path | Role | Description |
| --- | --- | --- | --- |
| GET | `/admin/stats/overview` | S+ | KPIs + recent orders/reservations |
| GET | `/admin/stats/sales?from=&to=&granularity=day\|week` | M+ | Revenue series (completed + paid only) |
| GET | `/admin/stats/orders-by-status?from=&to=` | S+ | Counts |
| GET | `/admin/stats/popular-items?from=&to=&limit=` | M+ | Aggregation over order items |
| GET | `/admin/stats/reservations?from=&to=` | S+ | Totals by status, party sizes |
| GET | `/admin/stats/export?type=orders\|reservations\|items&from=&to=` | M+ | CSV (≤ 10k rows, audited) |

### Menu
| Method | Path | Role | Description |
| --- | --- | --- | --- |
| GET | `/admin/menu/items` | M+ | All items incl. archived, searchable |
| POST | `/admin/menu/items` | M+ | Create |
| GET | `/admin/menu/items/:id` | M+ | Detail incl. admin flags |
| PATCH | `/admin/menu/items/:id` | M+ | Update |
| PATCH | `/admin/menu/items/:id/availability` | M+ | Quick toggle |
| POST | `/admin/menu/items/:id/archive` · `/restore` | M+ | Soft lifecycle |
| DELETE | `/admin/menu/items/:id` | A | Hard delete only if never ordered, else 409 |
| PATCH | `/admin/menu/items/reorder` | M+ | `[{id, displayOrder}]` |
| CRUD | `/admin/menu/categories[/:id]` | M+ | Delete blocked when in use |
| PATCH | `/admin/menu/categories/reorder` | M+ | |

### Orders
| Method | Path | Role | Description |
| --- | --- | --- | --- |
| GET | `/admin/orders` | S+ | **Implemented.** `?status=&page=&limit=` |
| GET | `/admin/orders/:id` | S+ | **Implemented.** Full order detail + payment transactions |
| PATCH | `/admin/orders/:id/status` | S+ | **Implemented.** `{status, note}`; matrix enforced |
| PATCH | `/admin/orders/:id/payment` | S+ | **Implemented.** Offline `{paymentStatus, note}` reconciliation; online orders require provider verification |
| POST | `/admin/orders/:id/cancel` | M+ | Requires reason |
| POST | `/admin/orders` | M+ | Phone/walk-in order capture (optional, Phase 4) |

### Payments
| Method | Path | Role | Description |
| --- | --- | --- | --- |
| GET | `/admin/payments` | S+ | Transaction list: `?status=&method=&provider=&from=&to=&search=` |
| GET | `/admin/payments/:id` | S+ | Transaction detail + webhook events + order link |
| POST | `/admin/payments/settle` | M+ | Manual cash/offline settlement `{orderId, amount, note}`; audited |
| POST | `/admin/payments/:id/refund` | M+ | `{amount, reason}`; online refunds call the provider adapter, offline refunds are recorded |
| GET | `/admin/payments/reconciliation?date=` | M+ | Expected vs captured vs refunded totals |
| GET | `/admin/payments/providers` | A | Configured/healthy status per provider, sandbox/live mode (no secrets) |

### Fulfilment
| Method | Path | Role | Description |
| --- | --- | --- | --- |
| GET/POST/PATCH/DELETE | `/admin/fulfillment/zones[/:id]` | M+ | Delivery zones, fees, minimums, ETA, active flag |
| PATCH | `/admin/fulfillment/ordering` | M+ | `{pickupEnabled, deliveryEnabled, orderingPaused}` with guard checks |

### Reservations
| Method | Path | Role | Description |
| --- | --- | --- | --- |
| GET | `/admin/reservations` | S+ | **Implemented.** `?status=&date=&page=&limit=` |
| GET | `/admin/reservations/:id` | S+ | Planned. Detail + email log |
| PATCH | `/admin/reservations/:id/status` | S+ | **Implemented.** Confirm/decline/complete/no-show with history |
| PATCH | `/admin/reservations/:id` | M+ | Reschedule/party size/notes |
| POST | `/admin/reservations` | S+ | Record phone/walk-in reservation |
| DELETE | `/admin/reservations/:id` | A | Only `rejected\|cancelled` |

### Customers
| Method | Path | Role | Description |
| --- | --- | --- | --- |
| GET | `/admin/customers` | M+ | Search, paginated |
| GET | `/admin/customers/:id` | M+ | Profile + orders + reservations |
| PATCH | `/admin/customers/:id/status` | A | Suspend/reactivate (not last admin) |
| GET | `/admin/customers/:id/orders` | M+ | |

### Content & settings
| Method | Path | Role | Description |
| --- | --- | --- | --- |
| CRUD | `/admin/promotions[/:id]` | M+ | Validate window + placement |
| CRUD | `/admin/gallery[/:id]` | M+ | Publish toggle, order |
| PATCH | `/admin/content/home` | M+ | Hero slides, featured dish ids, section toggles |
| PATCH | `/admin/content/about` | M+ | Story copy + image |
| GET | `/admin/settings` | M+ | **Implemented.** Full settings plus safe public projection |
| PATCH | `/admin/settings` | M+ | **Implemented.** Partial nested patch for contact, hours, fulfillment, reservations, payments and verification. Enabling delivery or online payment without approval/configuration is rejected |
| GET | `/admin/reviews` | M+ | Moderation queue |
| PATCH | `/admin/reviews/:id` | M+ | Approve/feature/reply |
| GET | `/admin/staff` | A | List |
| POST | `/admin/staff` | A | Invite with role |
| PATCH | `/admin/staff/:id` | A | Role/status |
| POST | `/admin/email/test` | A | Planned. Sends test through Brevo, logs result |
| GET | `/admin/emails` | M+ | **Implemented.** Outbox diagnostics with `?status=&page=&limit=` |
| POST | `/admin/emails/process` | M+ | **Implemented.** Processes queued mail; returns `skipped: true` while delivery is disabled |
| POST | `/admin/emails/:id/retry` | M+ | **Implemented.** Requeues a failed outbox message |
| POST | `/admin/uploads/signature` | M+ | Signed Cloudinary params; folder + allowed formats enforced |
| GET | `/admin/audit-logs` | A | Filter by actor/target/date |

### Upload contract
```
POST /admin/uploads/signature
{ "folder": "menu-items" }
→ { "cloudName":"…", "apiKey":"…", "timestamp":…, "signature":"…",
    "folder":"fabfoods/menu-items", "allowedFormats":["jpg","jpeg","png","webp"],
    "maxFileSize": 5242880 }
```
Signature is server-generated; `api_secret` never leaves the server. Client posts directly to
Cloudinary, then sends `{url, publicId, alt}` back with the entity write. MIME/extension and size
are re-validated server-side.

---

## 4. Rate limits

| Group | Window | Max |
| --- | --- | --- |
| Global per IP | 15 min | 300 |
| `POST /auth/login` per IP+email | 15 min | 10 (then exponential backoff) |
| `POST /auth/register` per IP | 1 h | 5 |
| `POST /auth/forgot-password` per IP | 1 h | 5 |
| `POST /orders` per IP | 10 min | 8 |
| `POST /orders/:orderNumber/payments` per IP+order | 10 min | 5 |
| `POST /webhooks/payments/:provider` per provider | 1 min | 120 (signature-checked; flood-safe) |
| `POST /reservations` per IP | 1 h | 6 |
| `POST /contact` per IP | 1 h | 5 |
| `POST /reviews` per IP | 24 h | 3 |
| `POST /admin/uploads/signature` per user | 1 h | 60 |
| `POST /admin/payments/settle` per user | 1 h | 30 |

---

## 5. Security middleware order

1. `helmet` (CSP, HSTS in production, no `x-powered-by`)
2. CORS allowlist from `CLIENT_ORIGIN` with credentials
3. **payment webhooks mounted first** with `express.raw({ type: "application/json" })` + signature
   verification (must precede the JSON parser)
4. `express.json({ limit: "1mb" })`, `urlencoded`
5. cookie parser + request id
6. global rate limiter
7. Mongo operator sanitisation + `hpp`
8. route-level validation (Zod)
9. auth → role guard → CSRF (mutations; webhooks exempt, signature is the auth)
10. controller → service → Mongoose
11. central error handler (no stack traces in production, always `requestId`)

---

## 6. Endpoint build order

Phase 1: health, auth, public menu read, `me`, admin auth/role guard.
Phase 3: fulfillment options/quote, orders, order quote, reservations, me/*.
Phase 4: admin menu, orders, reservations, customers, stats, content, settings, payments
(read-only transaction list, manual settlement).
Phase 5: payment initiation + webhook + provider adapter (sandbox), delivery zones, uploads
signature, email logs/retry, WhatsApp link helper, refunds.
Phase 6: exports, audit-logs, reconciliation report, test endpoint.
