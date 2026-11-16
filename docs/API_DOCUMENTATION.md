# FAB FOODS — API Documentation (design)

Base URL: `/api/v1`. Status: Phase 0 design plus the Phase 2 Stage 2 implemented subset
documented in §0. Endpoints in later sections are planned and may not exist yet.

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
admin CRUD.

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
- Idempotency: `Idempotency-Key` accepted on `POST /orders`, `POST /orders/:orderNumber/payments`
  and `POST /reservations`.
- Payments are provider-agnostic. Method (`mobile_money|card|cash_on_delivery|pay_at_restaurant`)
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
| POST | `/webhooks/payments/:provider` | signature | Raw body, provider signature header verified with env secret. Records `PaymentWebhookEvent` before processing. Returns 2xx fast; processing is idempotent |
| GET | `/webhooks/payments/:provider/health` | internal | Last event timestamp per provider (also surfaced in admin) |

Rules: the route is mounted **before** `express.json()`; a failed signature returns `401` and is
never processed; unknown provider keys return `404`; duplicates by `(provider, eventId)` return
`200` without side effects; only `succeeded` events may mark an order paid.

### Reservations
| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/reservations` | optional | **Implemented.** Create request → `pending` + `RS-…` reference |
| GET | `/reservations/mine` | required | **Implemented.** Signed-in user's request history |
| GET | `/reservations/availability` | public | Planned. `?date=` returns slots, closed flag, capacity remaining (advisory) |
| GET | `/reservations/:reference` | email match | Planned. Lookup requires `?email=` matching the record |
| POST | `/reservations/:reference/cancel` | email match | Planned. Cancel while `pending\|confirmed` |

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
| GET | `/me` | Profile |
| PATCH | `/me` | name, phone, marketingOptIn |
| POST | `/me/password` | Current + new password; revokes other sessions |
| GET/POST/PATCH/DELETE | `/me/addresses[/:id]` | Max 5 |
| GET | `/me/orders` | Paginated history |
| GET | `/me/orders/:id` | Ownership enforced |
| POST | `/me/orders/:id/reorder` | Returns current cart payload with price/availability deltas |
| GET | `/me/reservations` | History |
| POST | `/me/reservations/:id/cancel` | Ownership enforced |

---

## 3. Admin (auth: staff/manager/admin unless noted)

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
| GET | `/admin/orders` | S+ | `?status=&search=&from=&to=&page=&limit=` |
| GET | `/admin/orders/:id` | S+ | Full detail + timeline + email logs |
| PATCH | `/admin/orders/:id/status` | S+ | `{status, note}`; matrix enforced |
| PATCH | `/admin/orders/:id/payment` | M+ | `{status, note}` manual reconciliation; audited |
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
| GET | `/admin/reservations` | S+ | `?status=&date=&search=` |
| GET | `/admin/reservations/:id` | S+ | Detail + email log |
| PATCH | `/admin/reservations/:id/status` | S+ | Accept/reject/seat/complete/no-show |
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
| GET | `/admin/settings` | A | Full settings (no secrets) |
| PATCH | `/admin/settings/:section` | A | `brand\|contact\|hours\|social\|fulfillment\|reservations\|payments\|content\|seo`. Payments section returns masked config state only; enabling an online method is rejected unless the provider is configured and the webhook is healthy |
| GET | `/admin/reviews` | M+ | Moderation queue |
| PATCH | `/admin/reviews/:id` | M+ | Approve/feature/reply |
| GET | `/admin/staff` | A | List |
| POST | `/admin/staff` | A | Invite with role |
| PATCH | `/admin/staff/:id` | A | Role/status |
| POST | `/admin/email/test` | A | Sends test through Brevo, logs result |
| GET | `/admin/email-logs` | M+ | Delivery diagnostics + retry |
| POST | `/admin/email-logs/:id/retry` | M+ | |
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
