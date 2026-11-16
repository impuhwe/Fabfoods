# FAB FOODS — Database Design

MongoDB Atlas + Mongoose. Status: Phase 0 proposal, updated for Phase 2 Stage 2.

## 0. Implemented in Phase 2 Stage 2

Collections that exist and are exercised by tests:

- `users`, `sessions` — Phase 1 auth.
- `menucategories`, `menuitems` — PDF-sourced menu; `reviewTags` added for the public
  orderability gate.
- `reservations` — website table requests, status starts at `pending`.
- `contactmessages` — website contact messages saved for staff review.

Collections below that are marked **planned** (orders, payments, settings, gallery,
promotions, reviews, email/audit logs) are not created by Stage 2. No online order or payment
record is written by the public site.

---

## 1. Conventions

- Money: integer **RWF**, no decimals, field names suffixed where ambiguous (`price`, `unitPrice`,
  `subtotal`, `deliveryFee`, `total`). Never float.
- Timestamps: `createdAt` / `updatedAt` on every collection (`timestamps: true`).
- Soft deletion: `isArchived` for menu items/categories (history references must not break).
  Hard delete only for gallery images and empty categories, admin-only.
- Slugs: lowercase kebab, unique sparse index, generated from name, editable by admin.
- References: `ObjectId` + `ref`; denormalise the minimum needed for historical accuracy
  (order line snapshots), never denormalise mutable price data into orders.
- Enums: TypeScript-free JSDoc constants in `server/src/config/constants.js`, validated in schema.
- Timezone: business runs `Africa/Kigali`. Reservation `date` stored as `YYYY-MM-DD` string and
  `time` as `HH:mm` string; `startAt` (UTC Date) is derived and stored for sorting/querying.
- Text search: Stage 2 uses a case-insensitive regex over menu item `name`, `description` and
  `includedItems`. A dedicated text index can replace it if the menu grows.

---

## 2. Collection map

```
User ──< Order >── OrderItem (snapshot)
  │        ├── Promotion (optional)
  │        └──< PaymentTransaction (refunds embedded)
  ├──< Reservation
  ├──< Review
  └──< Session

MenuCategory ──< MenuItem
MenuItem ──< OrderItem (ref + snapshot)
MenuItem ──< Review (optional)

RestaurantSettings (singleton)
GalleryImage
Promotion
PaymentWebhookEvent
EmailLog
AuditLog
```

---

## 3. Collections

### 3.1 `users`

| Field | Type | Rules |
| --- | --- | --- |
| `name` | String | 2–80, trimmed |
| `email` | String | unique, lowercase, RFC-valid |
| `phone` | String | optional, E.164-ish `+2507XXXXXXXX` |
| `passwordHash` | String | bcrypt cost 12, `select:false` |
| `role` | String | `customer` (default) · `staff` · `manager` · `admin` |
| `status` | String | `active` · `suspended` |
| `emailVerifiedAt` | Date | null until verified |
| `marketingOptIn` | Boolean | default false |
| `addresses` | Subdoc[] | `{label, line1, line2, city, district, notes, isDefault}` (max 5) |
| `lastLoginAt` | Date | |
| `passwordChangedAt` | Date | invalidates older sessions |

Indexes: `{email: 1}` unique, `{role: 1, status: 1}`, `{createdAt: -1}`.
Invariants: cannot suspend last active admin; role change audited; password never serialised.

### 3.2 `sessions`

| Field | Type | Rules |
| --- | --- | --- |
| `user` | ObjectId → User | required |
| `refreshTokenHash` | String | SHA-256 of token, `select:false` |
| `userAgent`, `ip` | String | truncated |
| `expiresAt` | Date | TTL index |
| `revokedAt` | Date | rotation/revocation |

Indexes: `{refreshTokenHash: 1}` unique, `{user: 1, revokedAt: 1}`, `{expiresAt: 1}`
TTL (`expireAfterSeconds: 0`). Refresh tokens rotate on every use; reuse revokes the family.

### 3.3 `menucategories`

| Field | Type | Rules |
| --- | --- | --- |
| `name` | String | unique, 2–60 |
| `slug` | String | unique |
| `description` | String | ≤ 240, optional |
| `kind` | String | `food` · `drink` · `dessert` |
| `image` | Media | `{url, publicId, alt}` |
| `displayOrder` | Number | default 0 |
| `isVisible` | Boolean | default true |

Indexes: `{slug: 1}` unique, `{kind: 1, displayOrder: 1}`.
Delete blocked if items reference it (archive instead).

### 3.4 `menuitems`

| Field | Type | Rules |
| --- | --- | --- |
| `name` | String | 2–90, required, **exact as supplied** |
| `slug` | String | unique |
| `category` | ObjectId → MenuCategory | required |
| `price` | Number | integer ≥ 0, RWF; when `sizeOptions` exist it must equal the lowest size price and is only a starting/list price |
| `description` | String | ≤ 600; exact PDF text or empty |
| `includedItems` | String[] | exact stated components/accompaniments; no invented ingredients; no automatic charge |
| `image` | Media | `{url, publicId, alt}` |
| `gallery` | Media[] | max 5 |
| `ingredients` | String[] | **only confirmed data**; default `[]` |
| `allergens` | String[] | **only confirmed data**; default `[]` |
| `sizeOptions` | Subdoc[] | `{label, price, priceText, isDefault, isAvailable, displayOrder}`; unique labels; exactly one default; selected size determines price |
| `servingOptions` | Subdoc[] | `{name, selectionType, isRequired, maxSelections, displayOrder, options:[{name, priceDelta, priceDeltaNote, isDefault, isAvailable, displayOrder}]}`; zero delta unless justified |
| `addonGroups` | Subdoc[] | paid add-ons only: `{name, selectionType: single\|multiple, isRequired, maxSelections, options:[{name, price, isDefault, isAvailable}]}` |
| `isAvailable` | Boolean | default true |
| `isFeatured` | Boolean | default false |
| `isPopular` | Boolean | default false |
| `isArchived` | Boolean | default false |
| `needsReview` | Boolean | **default true for PDF-transcribed entries pending business review** (admin-only flag) |
| `verified` | Boolean | default false; admin-only confirmation flag |
| `reviewNote` | String | e.g. pizza naming ambiguity |
| `reviewTags` | String[] | Stage 2 orderability gate. Tags in `MENU_ORDER_BLOCKING_REVIEW_TAGS` block online ordering while the item remains publicly visible |
| `dataSource` | String | `brief` · `pdf` · `admin` — provenance of the row |
| `sourceRef` | String | e.g. `menu-pdf p.7` |
| `sourcePage` | Number | PDF page for audit |
| `verifiedAt` / `verifiedBy` | Date / ObjectId | Menu verification sign-off |
| `tags` | String[] | e.g. `grill`, `vegetarian` (confirmed only) |
| `prepTimeMinutes` | Number | optional |
| `displayOrder` | Number | |
| `createdBy`, `updatedBy` | ObjectId → User | |

Indexes: `{slug: 1}` unique, `{category: 1, isArchived: 1, displayOrder: 1}`,
`{isFeatured: 1, isAvailable: 1}`, text index `{name: "text", description: "text", tags: "text"}`.
Rules: `menuPricing.service.js` is the single source for order pricing. It uses the selected
`sizeOptions` price, adds justified `servingOptions.priceDelta` values and separately priced
`addonGroups`, and ignores client-supplied prices. Products without options use `price`. Archived
items remain resolvable by id but cannot be ordered. `needsReview` is never exposed on the public
API.

### 3.5 `orders` (planned; not implemented in Stage 2)

| Field | Type | Rules |
| --- | --- | --- |
| `orderNumber` | String | unique, `FF-YYMMDD-XXXX` |
| `user` | ObjectId → User | optional (guest checkout) |
| `customer` | Subdoc | `{name, email, phone}` required |
| `fulfillment` | Subdoc | `{type: pickup\|delivery, zone?, zoneName?, zoneFee?, address?, instructions?, scheduledFor?}` |
| `items` | Subdoc[] | see below |
| `pricing` | Subdoc | `{subtotal, deliveryFee, discount, total, currency:"RWF"}` |
| `payment` | Subdoc | `{method: cash_on_delivery\|pay_at_restaurant\|mobile_money\|card, status: unpaid\|requires_action\|processing\|paid\|failed\|refunded\|partially_refunded\|cancelled, amountPaid, amountRefunded, provider, providerReference, paidAt, verifiedVia: webhook\|manual\|provider_verify, note}` |
| `promotion` | ObjectId → Promotion | optional |
| `status` | String | `pending` · `confirmed` · `preparing` · `ready` · `out_for_delivery` · `completed` · `cancelled` |
| `statusHistory` | Subdoc[] | `{status, at, by, note}` |
| `cancellation` | Subdoc | `{reason, by, at}` |
| `lookupTokenHash` | String | guest tracking (order no. + email also works) |
| `placedBy` | String | `guest` · `customer` · `admin` |

`items[]` snapshot shape (immutable after placement):
`{menuItem, name, unitPrice, quantity(1–20), addons:[{name, price}], instructions, lineTotal}`.

Indexes: `{orderNumber: 1}` unique, `{status: 1, createdAt: -1}`, `{user: 1, createdAt: -1}`,
`{"customer.phone": 1}`, `{createdAt: -1}`.
Invariants:
- Server recomputes `lineTotal = unitPrice × quantity + Σ addons × quantity`; header totals
  recomputed; client values discarded.
- Only `completed` + `payment.status === "paid"` counts as revenue. `cancelled` excluded.
- Transitions validated by matrix (§4).
- Orders are never hard-deleted.
- `fulfillment.zoneFee` is a **snapshot** of the zone fee at placement; later zone edits do not
  rewrite history. `deliveryFee` must equal the snapshot for delivery orders.
- `payment.amountPaid` and `amountRefunded` are derived from verified transactions, never typed in
  ad hoc; manual settlement requires a note, actor and audit entry.

### 3.5.1 `paymenttransactions`

One row per payment attempt (Mobile Money prompt, card session, cash settlement, refund).

| Field | Type | Rules |
| --- | --- | --- |
| `order` | ObjectId → Order | required, indexed |
| `method` | String | `mobile_money` · `card` · `cash_on_delivery` · `pay_at_restaurant` |
| `provider` | String | Provider key (configuration value). Illustrative examples only: `mtn_momo`, `airtel_money`, `flutterwave`, `stripe`. **No provider is selected or assumed** |
| `providerTransactionId` | String | unique sparse index; set when provider responds |
| `providerReference` | String | merchant-side reference sent to provider |
| `amount` | Number | integer RWF, must equal order total for a full payment |
| `currency` | String | `RWF` |
| `status` | String | `initiated` · `requires_action` · `processing` · `succeeded` · `failed` · `expired` · `refunded` |
| `failureCode` / `failureMessage` | String | provider-safe copy only |
| `idempotencyKey` | String | unique per order; retries return the same transaction |
| `requestDigest` / `responseDigest` | String | hashed payloads for audit; no card data |
| `verifiedAt` | Date | server verification timestamp |
| `initiatedBy` | String | `customer` · `staff` · `system` |
| `refunds` | Subdoc[] | `{amount, reason, providerRefundId, status, requestedBy, approvedBy, at}` |
| `expiresAt` | Date | for expiring card/MoMo sessions |

Indexes: `{order: 1, createdAt: -1}`, `{provider: 1, providerTransactionId: 1}` unique sparse,
`{idempotencyKey: 1}` unique, `{status: 1, createdAt: -1}`.

Invariants:
- Status only becomes `succeeded` via a signature-verified webhook or a server-side provider
  verification call, never from a browser callback.
- A `succeeded` transaction is immutable except for appending refunds.
- Sum of successful transactions minus refunds must equal `order.payment.amountPaid`.
- No raw card number, CVV or full provider payload containing card data is ever stored.

### 3.5.2 `paymentwebhookevents`

| Field | Type | Rules |
| --- | --- | --- |
| `provider` | String | required |
| `eventId` | String | unique compound with provider — replay protection |
| `eventType` | String | provider event name |
| `signatureVerified` | Boolean | must be true before processing |
| `payloadHash` | String | SHA-256 of raw body |
| `status` | String | `received` · `processed` · `ignored` · `failed` |
| `attempts` | Number | |
| `relatedTransaction` | ObjectId → PaymentTransaction | optional |
| `error` | String | sanitised |
| `receivedAt`, `processedAt` | Date | |

Indexes: `{provider: 1, eventId: 1}` unique, `{status: 1, receivedAt: 1}`.
Invariant: the raw webhook route uses the raw request body (before JSON parsing), verifies the
signature, records the event, then processes idempotently.

### 3.6 `reservations`

| Field | Type | Rules |
| --- | --- | --- |
| `reference` | String | unique, `RS-YYMMDD-XXX` |
| `user` | ObjectId → User | optional |
| `name`, `email`, `phone` | String | required, validated |
| `date` | String | `YYYY-MM-DD`, today … +90 days |
| `time` | String | `HH:mm`; a requested time window, not a published opening-hours slot |
| `startAt` | Date | derived from Kigali local date/time, indexed |
| `partySize` | Number | 1–20 |
| `occasion` | String | optional |
| `specialRequests` | String | ≤ 600 |
| `status` | String | `pending` · `confirmed` · `declined` · `cancelled` · `completed` · `no_show` |
| `statusHistory` | Subdoc[] | `{status, note, changedAt, changedBy}` |
| `source` | String | `website` · `phone` · `walk_in` · `admin` |

Indexes: `{reference: 1}` unique, `{startAt: 1, status: 1}`, `{user: 1, startAt: -1}`,
`{status: 1, createdAt: -1}`.
Invariants: website creation always starts at `pending`; no auto-confirm; capacity is advisory
until reservation settings are approved.

### 3.6.1 `contactmessages`

| Field | Type | Rules |
| --- | --- | --- |
| `name` | String | 2–80 |
| `email` | String | lowercase, validated |
| `phone` | String | optional, ≤ 30 |
| `message` | String | 10–2000 |
| `status` | String | `new` · `read` · `resolved` (default `new`) |
| `source` | String | `website` |

Email notification is not connected; the row is the durable record.

### 3.7 `promotions` (planned)

`title`, `subtitle`, `description` (≤ 300), `image` (Media), `code` (optional, unique sparse),
`discountType` (`none|percent|fixed`), `value` (0–100 or RWF), `minSubtotal`,
`startsAt`/`endsAt` (end > start), `isActive`, `placement` (`hero|banner|menu|checkout`),
`ctaLabel`, `ctaLink`, `terms`, `displayOrder`.
Indexes: `{isActive: 1, startsAt: 1, endsAt: 1}`, `{code: 1}` unique sparse.
Invariant: only `discountType === "none"` promotions are purely presentational at launch; code
redemption is disabled until business rules are confirmed.

### 3.8 `reviews`

`user` (optional), `authorName`, `rating` (1–5 int), `title`, `body` (≤ 800), `isApproved`
(default false), `isFeatured`, `source` (`site|google|imported`), `sourceUrl`, `visitedAt`,
`adminReply` `{body, at, by}`.
Indexes: `{isApproved: 1, isFeatured: -1, createdAt: -1}`.
Invariant: nothing is published without approval; imported reviews require a source URL.

### 3.9 `galleryimages`

`image` (Media), `caption`, `alt` (required non-empty), `category`
(`interior|food|coffee|team|events`), `isPublished`, `displayOrder`, `tags[]`.
Indexes: `{isPublished: 1, category: 1, displayOrder: 1}`.

### 3.10 `restaurantsettings` (singleton, `key: "global"`)

```
brand       { name, legalName, slogan, logo: Media, favicon: Media }
verification{ contactApprovedAt, hoursApprovedAt, deliveryApprovedAt, approvedBy, note,
              unverifiedNotice: true }
contact     { phone, phoneAlt, whatsapp, email, addressLine1, addressLine2,
              city, district, country, mapsUrl, mapEmbedUrl, mapPlaceId }
hours       [{ day: 0..6, isClosed, open: "HH:mm", close: "HH:mm" }]
social      { instagram, facebook, tiktok, x, tripadvisor }
fulfillment { pickupEnabled, deliveryEnabled, orderingPaused, deliveryZones:[{name, fee, minOrder,
              etaMinutes, areas[], isActive, isVerified}], defaultDeliveryFee,
              freeDeliveryThreshold, minOrder, prepTimeMinutes, pickupEtaMinutes }
reservations{ enabled, slotIntervalMinutes, maxPartySize, minLeadTimeHours, maxDaysAhead,
              maxCoversPerSlot (nullable), autoConfirm: false, policyText }
payments    { acceptedMethods: ["cash_on_delivery","pay_at_restaurant","mobile_money","card"],
              enabledMethods: ["cash_on_delivery","pay_at_restaurant"],
              onlineEnabled, providerStatus: [{ provider, method, isConfigured, webhookHealthy,
              lastEventAt, mode: sandbox|live }], currency: "RWF", pricesIncludeTax: true,
              refundPolicyText, manualSettlementRoles: ["manager","admin"] }
content     { heroSlides[], featuredDishIds[], aboutStory, aboutImage, promoStrip }
seo         { defaultTitle, titleTemplate, description, ogImage }
integrations{ cloudinaryConfigured, brevoConfigured, whatsappVerified, paymentProvidersConfigured,
              lastEmailTestAt }
```

Single-document invariants: `autoConfirm` cannot be true; `deliveryEnabled` false unless at least
one **verified and active** zone exists; `orderingPaused` overrides both fulfillment flags;
`acceptedMethods` is the full supported set while `enabledMethods` is the operational subset and
must be a subset of it; online methods cannot be enabled unless the corresponding
`providerStatus.isConfigured` and `webhookHealthy` are true. Provider **secrets are never stored
here** — only booleans and masked identifiers, sourced from environment variables.
Accepted methods are confirmed scope. Enabled methods are an operational switch, so card and
Mobile Money can be built and tested in sandbox while remaining invisible to customers until the
business activates them.

**Publication gate for unconfirmed business facts:** a public settings response only includes
contact fields when `verification.contactApprovedAt` is set, hours only when
`verification.hoursApprovedAt` is set, and delivery zones only when both
`verification.deliveryApprovedAt` is set and the zone `isVerified` is true. Unapproved values are
stored, editable and visible to admins, but never rendered on the public site. The UI shows a
neutral "details being confirmed" state instead. Production launch checklist requires all three
approvals.

### 3.11 `emaillogs`

`to`, `template` (`welcome|reset|order_placed|order_confirmed|order_status|payment_receipt|
|payment_failed|reservation_*|contact_reply|test`), `payload` (sanitised), `status`
(`queued|sending|sent|failed`), `attempts` (max 5), `providerMessageId`, `lastError`,
`related: {model, id}`, `sentAt`.
Indexes: `{status: 1, createdAt: 1}`, `{related.model: 1, related.id: 1}`, `{createdAt: -1}`.
Outbox: written inside the same operation as the business write; a worker drains `queued`.

### 3.12 `auditlogs`

`actor`, `actorRole`, `action` (e.g. `menu_item.update`), `targetModel`, `targetId`,
`beforeDigest`, `afterDigest`, `ip`, `userAgent`, `at`.
Indexes: `{targetModel: 1, targetId: 1, at: -1}`, `{actor: 1, at: -1}`.
No passwords, tokens or full customer PII in digests.

---

## 4. Order status transition matrix

| From \ To | confirmed | preparing | ready | out_for_delivery | completed | cancelled |
| --- | --- | --- | --- | --- | --- | --- |
| pending | ✅ | — | — | — | — | ✅ |
| confirmed | — | ✅ | — | — | — | ✅ |
| preparing | — | — | ✅ | — | — | ✅ |
| ready | — | — | — | ✅ (delivery) | ✅ (pickup) | ✅ |
| out_for_delivery | — | — | — | — | ✅ | — |
| completed | — | — | — | — | — | — |
| cancelled | — | — | — | — | — | — |

Any non-listed transition returns `409 INVALID_TRANSITION`. Reverting requires admin and an
audit note.

Reservation matrix: `pending → confirmed|declined|cancelled`; `confirmed → completed|cancelled|no_show`;
terminal: `completed|declined|cancelled|no_show`. Stage 2 only creates `pending` requests; no admin
transition endpoint exists yet.

Payment matrix (order-level `payment.status`):

| From \ To | requires_action | processing | paid | failed | refunded | cancelled |
| --- | --- | --- | --- | --- | --- | --- |
| unpaid | ✅ (online) | — | ✅ (manual, cash) | — | — | ✅ |
| requires_action | — | ✅ | ✅ | ✅ | — | ✅ |
| processing | — | — | ✅ | ✅ | — | — |
| paid | — | — | — | — | ✅ (refund) | — |
| failed | ✅ (retry) | — | — | — | — | ✅ |
| refunded | — | — | — | — | — | — |
| cancelled | — | — | — | — | — | — |

`paid` requires `verifiedVia: webhook | provider_verify | manual`; `manual` is manager+ only,
requires a note, and is audit-logged. `amountPaid` cannot exceed the order total.

---

## 5. Menu verification and seed data strategy

**Decision:** the two source PDFs are now the active menu source. `seedMenu.js` reads
`server/src/scripts/data/menu.pdf.manifest.js` (status
`pdf-sourced-awaiting-business-review`). **Every seeded entry is created with
`needsReview: true`, `verified: false`, `dataSource: "pdf"`.** Descriptions, ingredients,
allergens and claims are not invented. No item is deleted or invented to force a count.

The manifest records per entry: exact printed name, printed price, category, source file/page,
source line, add-on parent (if any), review status/tags, and the approved option fields. Modes:

| Mode | Behaviour |
| --- | --- |
| `--upsert` (default) | Idempotent create-only by slug; never deletes; preserves admin edits |
| `--allow-unverified` | Required while entries remain unverified; prints a prominent warning. Persistent seed-audit records are deferred to the admin phase. |
| `--reset` | Development only (`NODE_ENV !== production`); recreates PDF-sourced data |
| production without `--allow-unverified` | Refuses to run |

Unverified entries are **published but flagged** in the admin dashboard ("PDF-sourced — pending
business review"). Public cards render name, price, category and image only; empty description
fields render nothing rather than placeholder copy. Admin edits clear `needsReview` individually.
Existing rows are not backfilled by a normal seed: a Stage 1 database needs a development reset or
a migration to receive the PDF fields and drink categories.

Count reconciliation:

- **121 priced lines** = 114 standalone product lines + 7 add-on lines.
- **111 product records**; **109 distinct product names**. `Fabfood Sandwich` appears in both
  Pizza and Sandwiches; `Vanilla Latte Macchiato` appears hot and iced.
- **118 modeled records** = 111 products + 7 add-ons.
- Food: **57 lines** = 50 product lines + 7 add-on lines; **48 food product records**; **55 modeled
  food records** (48 products + 7 add-ons), which matches the client's `provisionalEntryCount: 55`.
- Drinks: **64 product lines**, **63 product records**.
- **19 categories** (11 food/dessert + 8 drink).
- The 7 add-on source lines attach to parents as separately priced `addonGroups`; they are not
  standalone menu cards.

| Category slug | Kind | Product records | Add-on source lines | Distinct names |
| --- | --- | ---: | ---: | ---: |
| `breakfast` | food | 2 | 0 | 2 |
| `appetizers-starters` | food | 2 | 0 | 2 |
| `soup-of-the-day` | food | 3 | 0 | 3 |
| `salads` | food | 4 | 1 | 4 |
| `sandwiches-burgers` | food | 6 | 0 | 6 |
| `land-and-sea` | food | 7 | 6 | 7 |
| `pizza` | food | 3 | 0 | 3 |
| `grill-corner` | food | 10 | 0 | 10 |
| `special-food-corner` | food | 8 | 0 | 8 |
| `desserts` | dessert | 3 | 0 | 3 |
| `hot-coffee` | drink | 12 | 0 | 12 |
| `iced-coffee` | drink | 9 | 0 | 9 |
| `tea` | drink | 8 | 0 | 8 |
| `soft-drinks` | drink | 4 | 0 | 4 |
| `fresh-juice` | drink | 4 | 0 | 4 |
| `mojito` | drink | 5 | 0 | 5 |
| `the-rasips` | drink | 6 | 0 | 6 |
| `smoothies` | drink | 8 | 0 | 8 |
| `milkshake` | drink | 7 | 0 | 7 |
| **Total** | | **111** | **7** | **109** |

Nyamacoma is one product with three priced size/cut options (Whole Leg 18,000; Whole Arm 15,000;
Ribs 15,000), not three collapsed rows. Inyange is one product with Small 700 and Big 1,000.
Breakfast `includedItems` preserve the printed set components. Required serving choices
(Beef/Chicken, Fries/Banana/BBQ Potatoes, sides) are zero-delta `servingOptions`; paid extras remain
`addonGroups`. See `docs/MENU_PDF_RECONCILIATION.md` for all 24 business-review flags.

Idempotent: create-only by slug, never deletes existing data, `--reset` is blocked in production.
Admin user creation is a separate `createAdmin.js` script reading env-provided credentials and
forcing a password change on first login.

---

## 6. Data integrity rules

1. No order is accepted if any line's item is archived or unavailable at validation time.
2. Order totals are computed only inside `orderService.calculateTotals()` — one implementation.
3. Delivery orders require an active, verified zone; `deliveryFee` must equal the zone snapshot.
4. Reservations cannot be created for closed days or outside opening hours once approved; before
   approval, reservation date rules use documented defaults and the UI states hours are pending.
5. Deleting a category with items is rejected; archiving cascades availability at read time.
6. Media references store `publicId` so Cloudinary assets can be cleaned up safely.
7. Every export includes at most 10,000 rows and is audit-logged.
8. PII: customer data visible to staff+; email/phone masked in list views unless manager+.
9. A payment can only reach `succeeded`/`paid` through verified server-side evidence; browser
   return URLs are treated as untrusted hints and trigger a status re-fetch.
10. Refund total can never exceed captured amount; refunds require manager+ and an audit entry.
11. Webhook events are stored before processing; duplicate `(provider, eventId)` is a no-op.
12. Unverified contact details, hours, delivery rules and social links are never included in any
    public API response or server-rendered page.
