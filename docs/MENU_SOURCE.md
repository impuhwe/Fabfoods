# FAB FOODS — Menu Source Register

> **Update 2026-11-14:** The PDF-sourced schema and seed are implemented. This brief register and
> `server/src/scripts/data/menu.manifest.js` are **historical only**. The active source is
> `server/src/scripts/data/menu.pdf.manifest.js`, with reconciliation in
> `docs/MENU_PDF_RECONCILIATION.md`. Every entry still needs business review; do not seed the brief
> manifest.

Verbatim register of the menu data supplied in the project brief. **This brief-based register was
provisional development data; it is retained for historical comparison only.** No description,
ingredient, allergen, serving detail or additional product is invented here.

Status per item: `confirmed` (name + price supplied) · `needs_review` (ambiguous or unverified) ·
`copy_pending` (description must come from the PDF). The Stage 1 database seeded these entries with
`needsReview: true`, `verified: false`, `dataSource: "brief"`. That data is now superseded by the
PDF-sourced manifest.

All prices RWF. The brief enumerates **57 priced lines**: 50 standalone products + 7 add-ons.
The client's **55 menu entries** figure is retained as `provisionalEntryCount: 55`; it is not
resolved by deleting lines or inventing products.

**Brand working name:** FAB FOODS. Wordmark casing is not finalised. Item names —
including "Fabfood Sandwich" under Pizza and "Masedoine" — are preserved exactly as supplied and
flagged for business confirmation rather than corrected.

---

## 1. Breakfast (`breakfast`)

| Item | Price | Status | Included items (from brief) |
| --- | --- | --- | --- |
| Continental Breakfast | 8,000 | copy_pending | Assorted bread (oats, sesame, salted); butter/jam/honey (one choice); English cake; cheese and cold cuts (one choice); egg dish of choice; grilled tomatoes; beef or chicken sausage |
| Health Breakfast | 8,000 | copy_pending | Fruit salad; nature yoghurt; muesli/cereals; brown bread; egg of choice; juice of the day; tea or coffee |

## 2. Appetizers and Starters (`appetizers-starters`)

| Item | Price | Status |
| --- | --- | --- |
| Crispy Fish Finger | 9,000 | copy_pending |
| Marinated Chicken Wings | 8,000 | copy_pending |

## 3. Soup of the Day (`soup-of-the-day`)

Category note: all soups served with bread rolls.

| Item | Price | Status |
| --- | --- | --- |
| Chicken Coconut Soup | 6,000 | copy_pending |
| Creamy Mushroom Soup | 8,000 | copy_pending |
| Mixed Vegetable Soup | 4,000 | copy_pending |

## 4. Salads (`salads`)

| Item | Price | Status |
| --- | --- | --- |
| Avocado Salad | 3,000 | copy_pending |
| Grilled Chicken Breast (add-on) | 3,000 | copy_pending — model as add-on, not a standalone dish |
| Fabfoods Katchumbali Salad | 4,000 | copy_pending |
| German Potato Salad | 4,000 | copy_pending |
| Chicken Caesar Salad | 7,000 | copy_pending |

## 5. Sandwiches and Burgers (`sandwiches-burgers`)

| Item | Price | Status |
| --- | --- | --- |
| Italian Wrap | 7,500 | copy_pending |
| Chicken Wrap | 7,000 | copy_pending |
| Beef Wrap | 8,000 | copy_pending |
| Fabfood Sandwich | 8,000 | copy_pending |
| Chicken Shawarma | 8,000 | copy_pending |
| Beef or Chicken Burger | 7,500 | copy_pending — single product with protein choice add-on group (no price difference stated) |

## 6. Land and Sea (`land-and-sea`)

| Item | Price | Status |
| --- | --- | --- |
| Chicken Breast | 8,000 | copy_pending |
| Stir-fried Vegetables | 5,000 | copy_pending |
| Add grilled chicken breast (add-on) | 3,000 | add-on to Stir-fried Vegetables per brief order |
| Add beef strips (add-on) | 2,500 | add-on |
| Marinated Half Grilled Chicken | 12,000 | copy_pending |
| Marinated Beef Ribs | 15,000 | copy_pending |
| Indian Vegetable Curry | 7,000 | copy_pending |
| Add chicken cubes (add-on) | 2,500 | add-on |
| Add grilled beef strips (add-on) | 2,500 | add-on |
| Banana and Peas Stew | 4,000 | copy_pending |
| Add chicken strips (add-on) | 2,500 | add-on |
| Add grilled beef strips (add-on) | 2,500 | add-on |
| Nile Perch Fish Fillet | 15,000 | copy_pending |

## 7. Pizza (`pizza`)

| Item | Price | Status |
| --- | --- | --- |
| BBQ Steak Pizza | 10,000 | copy_pending |
| Fabfood Sandwich | 10,000 | **needs_review** — printed under Pizza; likely a source error. Stored verbatim with `needsReview: true`, `reviewNote` |
| Veg Pizza | 7,000 | copy_pending |

## 8. Grill Corner (`grill-corner`)

| Item | Price | Status |
| --- | --- | --- |
| Whole Grilled Chicken | 18,000 | copy_pending |
| Whole Grilled Rabbit | 18,000 | copy_pending |
| Nyamacoma Goat — Whole Leg | 18,000 | copy_pending |
| Nyamacoma Goat — Whole Arm | 15,000 | copy_pending |
| Nyamacoma Goat — Ribs | 15,000 | copy_pending |
| Whole Grilled Tilapia | 20,000 | copy_pending |
| Fish Brochette (2 skewers) | 8,000 | copy_pending |
| Chicken Brochette (2 skewers) | 8,000 | copy_pending |
| Beef Brochettes (2 skewers) | 8,000 | copy_pending |
| Goat Brochettes (2 skewers) | 8,000 | copy_pending |
| French Fries | 4,000 | confirmed |
| French Fries and Salad | 5,000 | confirmed |

## 9. Special Food Corner (`special-food-corner`)

| Item | Price | Status |
| --- | --- | --- |
| Boiled Chicken with Potatoes or Banana | 6,000 | copy_pending — "or" modelled as a required single-choice option, no price delta |
| Boiled Beef with Potatoes or Banana | 6,000 | copy_pending |
| Boiled Fish with Potatoes or Banana | 6,000 | copy_pending |
| Fabfood Potatoes | 4,000 | copy_pending |
| BBQ Potatoes | 2,000 | confirmed |
| Grilled Green Banana | 1,000 | confirmed |
| Steamed Rice | 2,000 | confirmed |
| Goat/Beef Fry | 8,000 | copy_pending — protein choice option, no price delta |

## 10. Desserts (`desserts`)

| Item | Price | Status |
| --- | --- | --- |
| Seasonal Fruit Cut | 5,000 | copy_pending |
| Masedoine | 5,000 | **needs_review** — spelling preserved as supplied; confirm intended "Macédoine" before any public copy change |
| Cake of the Day | 5,000 | copy_pending |

## 11. Coffee and Beverages (historical Stage 1 scaffold)

The Stage 1 brief supplied no drinks. This section is superseded by the PDF-sourced drink menu:
8 categories and 63 product records across hot coffee, iced coffee, tea, soft drinks, fresh juice,
mojito, THE RASIPS, smoothies and milkshakes. See `docs/MENU_PDF_RECONCILIATION.md`.

---

## Historical Stage 1 seed rules

These rules applied to the superseded brief manifest. The active rules are in
`docs/DATABASE_DESIGN.md` §5 and `docs/MENU_PDF_RECONCILIATION.md`.

1. Stage 1 seeded every recorded line with `needsReview: true`, `verified: false`,
   `dataSource: "brief"`.
2. `price` was the integer above; no derivation, no rounding.
3. `description` stayed `""` until PDF text or client copy was provided.
4. `ingredients` / `allergens` stayed `[]`.
5. Add-ons lived in `addonGroups` on their parent dish; they were not separate menu cards.
6. The duplicate "Fabfood Sandwich" under Pizza kept its printed name and carried
   `needsReview: true`.
7. Category display order followed this document.
8. Currency formatting: `RWF 8,000` via one shared formatter (`formatRWF`), tabular numerals.
9. Serving options printed with "or" were modelled as required single-choice options with no price
   delta.
10. Nothing from the live marketing site was seeded.

---

## 11a. Historical Stage 1 seed manifest reconciliation (superseded)

Historical only. Active artifacts now use `menu.pdf.manifest.js`; the paths below are retained to
explain the Stage 1 database.

| Artifact | Path |
| --- | --- |
| Stage 1 manifest | `server/src/scripts/data/menu.manifest.js` |
| Active manifest | `server/src/scripts/data/menu.pdf.manifest.js` |
| Manifest validation | `server/src/validators/menu.validator.js` |
| Seed builder | `server/src/services/menuSeed.service.js` |
| Seed CLI | `server/scripts/seedMenu.js` |
| Seed tests | `server/tests/menu.test.js` |

### Count relationship

| Measure | Count | Explanation |
| --- | ---: | --- |
| Priced source lines | 57 | Every name + price recorded in this register |
| Add-on source lines | 7 | Structured into parent dishes; not standalone menu cards |
| Standalone product records | 50 | 57 priced lines − 7 add-on lines |
| Distinct product names | 49 | "Fabfood Sandwich" appears twice: 8,000 sandwich and 10,000 pizza |
| Provisional client entry count | 55 | Retained as metadata only; not equal to 57 or 50 and not used to delete or invent data |
| Priced add-on option records | 10 | The single salad add-on line is attached to four standalone salads; this is per-parent structure, not product duplication |

The PDF reconciliation explains 55 as the food modeled-record count: 48 food products + 7 add-ons.
It is not a total menu count. No PDF verification is claimed; every entry still needs business
review.

### Add-on parent mapping

| Source add-on line | Price | Parent(s) | Basis |
| --- | ---: | --- | --- |
| Grilled Chicken Breast (add-on) | 3,000 | All four standalone salads | Listed under Salads without a parent; provisional |
| Add grilled chicken breast | 3,000 | Stir-fried Vegetables | Brief order |
| Add beef strips | 2,500 | Stir-fried Vegetables | Inferred from brief order; confirm |
| Add chicken cubes | 2,500 | Indian Vegetable Curry | Inferred from brief order; confirm |
| Add grilled beef strips | 2,500 | Indian Vegetable Curry | Inferred from brief order; confirm |
| Add chicken strips | 2,500 | Banana and Peas Stew | Inferred from brief order; confirm |
| Add grilled beef strips | 2,500 | Banana and Peas Stew | Inferred from brief order; confirm |

The two "Add grilled beef strips — 2,500" lines are both preserved because they belong to different
parent dishes. They are not merged.

### Required choices (not priced add-on lines)

| Product | Choice group | Options | Price delta |
| --- | --- | --- | ---: |
| Beef or Chicken Burger | Protein choice | Beef / Chicken | 0 |
| Boiled Chicken with Potatoes or Banana | Served with | Potatoes / Banana | 0 |
| Boiled Beef with Potatoes or Banana | Served with | Potatoes / Banana | 0 |
| Boiled Fish with Potatoes or Banana | Served with | Potatoes / Banana | 0 |
| Goat/Beef Fry | Protein choice | Goat / Beef | 0 |

### Seeded verification state

All 50 product records are seeded with:

- `needsReview: true`
- `verified: false`
- `dataSource: "brief"`
- `description: ""`
- `ingredients: []`
- `allergens: []`
- `sourcePage: null`

The seed CLI requires `--allow-unverified`; production also rejects `--reset`. Re-running the seed
is idempotent and does not overwrite existing admin edits.

## 12. PDF reconciliation and current implementation

The two PDFs are preserved in `docs/source-menus/` and transcribed into
`server/src/scripts/data/menu.pdf.manifest.js`. The manifest is the active seed source.

| Measure | Count |
| --- | ---: |
| Categories | 19 |
| Product records | 111 |
| Distinct product names | 109 |
| Add-on source lines | 7 |
| Modeled records | 118 |
| Priced source lines | 121 |
| Food modeled records | 55 (48 products + 7 add-ons) |
| Drink product records | 63 |
| Business-review flags | 24 |

Implemented schema:

- `includedItems` for exact stated breakfast/set components.
- `sizeOptions` for Inyange sizes and Nyamacoma cuts, with selected size determining price.
- `servingOptions` for required/optional choices; positive deltas require a `priceDeltaNote`.
- `addonGroups` for paid extras only.
- `menuPricing.service.js` for server-side order pricing; client prices are ignored.

The full 24-row review list, source hashes, count reconciliation and stored examples are in
`docs/MENU_PDF_RECONCILIATION.md`. Unresolved fields ship empty and remain editable in the admin
dashboard. They are never filled from a guess. Every entry remains `needsReview: true`,
`verified: false`, `dataSource: "pdf"` until business sign-off.

### Known ambiguities to confirm

| Entry | Issue | Handling |
| --- | --- | --- |
| "Fabfood Sandwich" under Pizza — 10,000 | Same name as a 8,000 sandwich; likely a source error | Kept verbatim, `needsReview`, admin badge |
| "Masedoine" — 5,000 | Likely "Macédoine" | Kept verbatim, `needsReview` |
| Add-on prices in Land and Sea | Six add-on lines, some repeated | Modelled per parent dish, confirmed against PDF |
| "Grilled Chicken Breast add-on — 3,000" under Salads | Is it an add-on or a dish? | Add-on to salads, confirm |
| 57 food lines vs 55 entries | Count mismatch | Resolved as 48 food products + 7 add-ons = 55 modeled food records |

## Items the existing website shows but the brief does not price

Nyamacoma Goat description, Whole Grilled Tilapia description, BBQ Steak Pizza description,
Beef Burger description and a "Mango & Pineapple" smoothie at 5,000 appeared on `fabcafe.rw`.
They are **not** seeded from that source. The PDFs now supply the drink menu and printed item
names/prices; descriptions and claims still require PDF text or written approval. No website
marketing copy, ratings or unlisted products are seeded.
