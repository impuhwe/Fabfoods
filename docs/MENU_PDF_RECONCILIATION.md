# FAB FOODS — PDF Menu Reconciliation

**Status:** schema implemented; business review still required. **Date:** 2026-11-14.

This report reconciles the two source PDFs against the Stage 1 provisional menu. The active seed
manifest is `server/src/scripts/data/menu.pdf.manifest.js`; the Stage 1 brief manifest is retained
for historical comparison only. Every item remains `needsReview: true` and `verified: false`.

## 1. Source documents

| ID           | File                                                 | Pages | SHA256                                                           |
| ------------ | ---------------------------------------------------- | ----- | ---------------------------------------------------------------- |
| `food-menu`  | `docs/source-menus/FAB_FOODS_FOOD_MENU.pdf`          | 15    | `D341A473B9A91A9827A2B7CD604632EF6B53AB716FC8471508DD1B5E2F679D47` |
| `drink-menu` | `docs/source-menus/FAB_FOODS_DRINK_MENU.pdf`         | 5     | `9AC93A617E6A463DCACF4E77D4B5C29D209E59F32F471912F300B712442B1E60` |

The PDFs were found in `C:\Users\HP\Downloads` because `docs/source-menus` did not exist. They were
copied to the paths above; the originals were left in place.

## 2. Method and confidence

- Text was extracted with `pypdf`; page layout and text coordinates were inspected with `PyMuPDF`.
- No OCR was used. The PDFs contain enough embedded text to enumerate items and prices.
- Page images were rendered, but visual inspection was not available in this environment. Layout was
  inferred from text bounding boxes and column positions.
- Every manifest entry is `needsReview: true`, `verified: false`, `dataSource: "pdf"`.
- Printed names, casing, descriptions and prices are preserved. Corrections are flagged in the
  review list, not silently applied.
- No description, ingredient, allergen, serving detail or health claim was invented.
- Manifest validation: 19 categories, 111 products, 7 add-ons, 121 priced lines; no duplicate slugs;
  every category and add-on parent reference resolves.

## 3. Count reconciliation

| Measure                              | Food | Drinks | Combined |
| ------------------------------------ | ---: | -----: | -------: |
| Printed priced lines                 |   57 |     64 |      121 |
| Standalone product priced lines      |   50 |     64 |      114 |
| Add-on priced lines                  |    7 |      0 |        7 |
| Product records (variants grouped)   |   48 |     63 |      111 |
| Add-on records                       |    7 |      0 |        7 |
| Modeled records (products + add-ons) |   55 |     63 |      118 |
| Distinct printed product names       |   47 |     62 |      109 |

Definitions:

- **Priced line:** every printed item price. `NYAMACOMA GOAT` has three cut/size prices; `Inyange
  Juice` has two sizes.
- **Product record:** one menu item after grouping size/cut variants.
- **Modeled record:** product records plus add-on records.
- **Distinct printed names:** exact-string count; duplicates reduce the total.

### 3.1 The 55 figure

- Food PDF has **57 printed priced lines**: 50 standalone product lines + 7 add-on lines.
- `NYAMACOMA GOAT` is printed once with three cut/size lines: Whole Leg 18K, Whole Arm 15K, Ribs 15K.
- If it is modeled as **one product with three size/cut options**, food product records = **48**.
- **48 products + 7 add-ons = 55 modeled food records.** This matches the client's 55 figure.
- If Nyamacoma is split into three products, food becomes 50 products + 7 add-ons = 57 records, and
  the 55 figure remains unexplained.
- The PDF layout supports one product with three cut prices. This grouping is implemented and
  remains flagged for business confirmation.
- Drinks add 64 priced lines but 63 product records because `Inyange Juice` has two sizes and no
  add-ons.
- Combined: 121 priced lines become 118 modeled records. The difference is the three variant
  groupings: Nyamacoma 3 prices to 1 product, and Inyange 2 prices to 1 product.
- **55 is a food-only modeled-record count, not the total menu count.**

## 4. Food breakdown

| Category                  | Page | Product records | Priced product lines | Add-on lines |
| ------------------------- | ---: | --------------: | -------------------: | -----------: |
| BREAKFAST                 |    3 |               2 |                    2 |            0 |
| Appetizer and Starter     |    5 |               2 |                    2 |            0 |
| Soup of the Day           |    5 |               3 |                    3 |            0 |
| Salad                     |    5 |               4 |                    4 |            1 |
| SANDWICHES AND BURGER     |    7 |               6 |                    6 |            0 |
| LAND AND SEA              |    9 |               7 |                    7 |            6 |
| Pizza Menu                |   10 |               3 |                    3 |            0 |
| GRILL CORNER              |   12 |              10 |                   12 |            0 |
| SPECIAL FOOD CORNER       |   14 |               8 |                    8 |            0 |
| Dessert                   |   15 |               3 |                    3 |            0 |
| **Total**                 |      |          **48** |               **50** |        **7** |

- Grill Corner has 10 products but 12 priced lines because of Nyamacoma's three cut prices.
- The salad add-on is printed under Avocado salad: `With Grilled chicken breast (+3k)`. It may apply
  to all salads; it is attached only to Avocado salad pending confirmation.
- Land and Sea has six add-on lines across three products: Stir-fried Vegetables (2), Indian
  Vegetable Curry (2), Banana and Peas Stew (2).
- Breakfast included items are preserved exactly; missing choice lists were not invented.

## 5. Drink breakdown

| Category     | Page | Product records | Priced lines |
| ------------ | ---: | --------------: | -----------: |
| Hot Coffee   |    2 |              12 |           12 |
| Iced Coffee  |    2 |               9 |            9 |
| Tea          |    2 |               8 |            8 |
| Soft Drinks  |    3 |               4 |            5 |
| Fresh Juice  |    3 |               4 |            4 |
| Mojito       |    3 |               5 |            5 |
| The Rasips   |    3 |               6 |            6 |
| Smoothies    |    4 |               8 |            8 |
| Milkshake    |    4 |               7 |            7 |
| **Total**    |      |          **63** |       **64** |

- Soft Drinks has 5 priced lines because `Inyange Juice` is one product with Small 700 and Big 1,000.
- No drink add-ons are printed.
- No drink descriptions, ingredients, allergens, sizes or health claims are printed except the
  Inyange sizes. Those fields remain empty; no claims were invented.

## 6. Implemented schema changes

| Change                                    | Purpose                                                                                       |
| ----------------------------------------- | --------------------------------------------------------------------------------------------- |
| `MenuItem.includedItems: [String]`        | Preserve breakfast set components exactly without inventing option lists.                     |
| `MenuItem.sizeOptions: [SizeOption]`      | Model Nyamacoma cuts and Inyange sizes as one product with printed variant prices.            |
| `MenuItem.servingOptions: [ServingGroup]` | Model required zero-price choices such as Beef/Chicken, Fries/Banana/BBQ Potatoes, sides.     |
| Keep `MenuItem.price` required            | Store the lowest printed price when variants exist (Nyamacoma 15,000; Inyange 700).           |
| Keep `addonGroups` for paid add-ons only  | Avoid conflating required serving choices with optional paid extras.                          |
| No `MenuCategory` schema change           | `kind: "drink"` already exists; data changes from 11 to 19 categories.                        |
| No source-field change                    | `sourceRef` stores the PDF file, `sourcePage` stores the page; `dataSource: "pdf"` already exists. |
| Reuse review fields                       | `needsReview`, `verified`, `reviewNote`; manifest `reviewStatus`/`reviewTags` are staging-only. |

`SizeOption` shape:
`{ label, price, priceText, isDefault, isAvailable, displayOrder }`.

`ServingOption` shape:
`{ name, priceDelta, priceDeltaNote, isDefault, isAvailable, displayOrder }`.

`ServingGroup` shape:
`{ name, selectionType, isRequired, maxSelections, displayOrder, options: [ServingOption] }`.

`AddonOption` remains separately priced:
`{ name, price, isDefault, isAvailable, displayOrder }`.

`MenuItem.price` remains required. When `sizeOptions` are present it must equal the lowest size
price and is only a starting/list price. Order pricing must use
`server/src/services/menuPricing.service.js`, which reads the selected size, serving deltas and
paid add-ons from server-owned data and ignores any client-supplied price.

### 6.1 Stored examples

```js
// Breakfast: includedItems do not create charges
{
  name: 'CONTINENTAL BREAKFAST',
  price: 8000,
  includedItems: [
    'ASSORTED BREAD (OATS, SESAME, AND SALTED BREAD)',
    'Butter, jam, honey (one choice)',
    'english cake',
    'Cheese and cold cuts (one choice)',
    'egg dish of your choice',
    'grilled tomatoes',
    'Sausage (Beef or chicken)'
  ],
  sizeOptions: [],
  servingOptions: [],
  addonGroups: []
}
```

```js
// Inyange Juice: selected size determines the server-side price
{
  name: 'Inyange Juice',
  price: 700,
  sizeOptions: [
    { label: 'Small', price: 700,  priceText: '700 (Small)', isDefault: true,  isAvailable: true, displayOrder: 1 },
    { label: 'Big',   price: 1000, priceText: '1000 (Big)',  isDefault: false, isAvailable: true, displayOrder: 2 }
  ]
}
```

```js
// Whole Grilled Chicken: required serving choice with no price delta
{
  name: 'WHOLE GRILLED CHICKEN',
  price: 18000,
  servingOptions: [
    {
      name: 'Served with',
      selectionType: 'single',
      isRequired: true,
      maxSelections: 1,
      options: [
        { name: 'Fries',        priceDelta: 0, priceDeltaNote: '', isDefault: true,  isAvailable: true },
        { name: 'Banana',       priceDelta: 0, priceDeltaNote: '', isDefault: false, isAvailable: true },
        { name: 'BBQ Potatoes', priceDelta: 0, priceDeltaNote: '', isDefault: false, isAvailable: true }
      ]
    }
  ]
}
```

```js
// Nyamacoma Goat: three distinct priced selections, not one collapsed price
{
  name: 'NYAMACOMA GOAT',
  price: 15000,
  sizeOptions: [
    { label: 'WHOLE LEG', price: 18000, priceText: '18K', isDefault: false, isAvailable: true },
    { label: 'WHOLE ARM', price: 15000, priceText: '15K', isDefault: true,  isAvailable: true },
    { label: 'RIBS',      price: 15000, priceText: '15K', isDefault: false, isAvailable: true }
  ]
}
```

```js
// Paid add-ons stay separate from serving choices
{
  name: 'sTIRFRIED VEGETABLES',
  price: 5000,
  addonGroups: [
    {
      name: 'Add-ons',
      selectionType: 'multiple',
      isRequired: false,
      maxSelections: 2,
      options: [
        { name: 'aDD GRILLED CHICKEN BREAST', price: 3000, isDefault: false, isAvailable: true },
        { name: 'aDD BEEF STRIPS',            price: 2500, isDefault: false, isAvailable: true }
      ]
    }
  ]
}
```

Alternative considered: make `MenuItem.price` optional when size options exist. Not selected,
because list/detail pages need a starting price and the approved direction kept `price` required.

### 6.2 Implementation status

| Area | Result |
| --- | --- |
| Model | `MenuItem` now stores `includedItems`, `sizeOptions`, `servingOptions`; subdocuments use `_id: false`; pre-validation enforces unique labels, one default size, required single-choice defaults, justified positive serving deltas, and `price` equal to the lowest size price |
| Validator | `menu.validator.js` validates the PDF manifest shape, hardcoded 2/19/111/7/24 counts, duplicate IDs/names, parent references, size/serving rules and count reconciliation |
| Seed | `menuSeed.service.js` maps products and attaches the 7 add-on source lines to their parents; the CLI imports `menu.pdf.manifest.js`; create-only by slug preserves admin edits |
| Pricing | `menuPricing.service.js` resolves selected size, default required serving choice, serving deltas and paid add-ons from server-owned data; client `price` is ignored |
| Tests | 44 server tests + 9 client tests pass; manifest, seed idempotency, admin-edit preservation, model integrity and pricing are covered |
| Verification | `npm run lint`, `npm run format:check`, `npm run build` and `npm audit` pass; audit reports 0 vulnerabilities |

## 7. Seed and migration impact

- Active seed: 19 categories, 111 products, 7 add-ons, 118 modeled records, 121 priced lines.
- Stage 1 seed: 11 categories, 50 products, no drinks. It is superseded.
- `server/scripts/seedMenu.js` now imports the PDF manifest.
- Normal seeding remains create-only by slug: it preserves existing admin edits and does not
  overwrite existing rows. A database already seeded from the Stage 1 manifest needs a development
  reset or a migration to receive the PDF fields and drink categories.
- `--reset` remains development-only and is rejected in production.
- Validator, seed service, tests and docs now cover drinks, size options, serving options,
  included items and exact descriptions.

## 8. Review list

All 24 entries are open. The machine-readable list is `reviewList` in
`server/src/scripts/data/menu.pdf.manifest.js`.

| #  | Page | Item                                       | Issue                                                                 | Handling                                                              |
| -- | ---: | ------------------------------------------ | --------------------------------------------------------------------- | --------------------------------------------------------------------- |
| 1  |    3 | Continental / Health Breakfast             | Two 8000 prices on a two-column page.                                 | Confirm set-to-price mapping.                                         |
| 2  |    3 | Breakfast included choices                 | Some choices are not enumerated in the PDF.                           | Preserve wording; do not invent option lists.                         |
| 3  |    5 | CRISPY FIRSH FINGER                        | "FIRSH" likely "FISH".                                                | Preserve printed name; flag correction.                               |
| 4  |    5 | With Grilled chicken breast (+3k)          | Printed under Avocado salad; may apply to all salads.                 | Attach only to Avocado; confirm parent scope.                         |
| 5  |    5 | CHICKEN CEASAR SALAD                       | "CEASAR" likely "CAESAR".                                             | Preserve printed name; flag correction.                               |
| 6  |    7 | FABFOoD SANDWICH                           | Same name on Pizza page at 10,000 with pizza toppings.                | Keep two records; flag pizza entry as likely source error.            |
| 7  |   10 | BBG STEAK PIZZA                            | "BBG" likely "BBQ".                                                   | Preserve printed name; flag correction.                               |
| 8  |    9 | iNDIAN VEGEtABLE CURRY                     | "STEAMED RICE OF KENYAN CHAPATI"; likely "OR".                        | Preserve exact wording; confirm whether a choice exists.              |
| 9  |   12 | NYAMACOMA GOAT                             | One heading, three cut/size prices.                                   | Propose one product with three size options; confirm.                 |
| 10 |   12 | Whole Grilled Chicken / Rabbit             | Fries, banana or BBQ potatoes with no printed price difference.       | Model required zero-price serving choice.                             |
| 11 |   14 | Boiled chicken / FABFOOD POTATOES          | "chciken" and "PERSLEY" are printed.                                  | Preserve descriptions; flag corrections.                              |
| 12 |   14 | GRILLED GREEN BANANA                       | Name says grilled; description says grilled or fried.                 | Model required preparation choice; flag.                              |
| 13 |   14 | goat/beef fry                              | Slash denotes protein choice; description adds side choice.           | Model both choices at zero price delta.                               |
| 14 |   15 | Masedoine                                  | Unusual spelling; likely a dessert name.                              | Preserve printed name; confirm spelling.                              |
| 15 |    2 | Cappucino / Iced Cappucino                 | "Cappucino" likely "Cappuccino".                                      | Preserve printed names; flag corrections.                             |
| 16 |    2 | Flatter white                              | Likely "Flat White".                                                  | Preserve printed name; flag correction.                               |
| 17 |    2 | Vanilla Latte Macchiato                    | Same name in Hot Coffee 3500 and Iced Coffee 4000.                    | Keep hot/iced records; confirm iced naming.                           |
| 18 |    2 | Cafe Peach                                 | Printed in Iced Coffee but name does not say iced.                    | Keep in Iced Coffee; flag naming ambiguity.                           |
| 19 |    2 | Peach & Elderflower                        | Printed in Tea but name does not say tea.                             | Keep in Tea; flag naming ambiguity.                                   |
| 20 |    3 | Pineaple                                   | "Pineaple" likely "Pineapple".                                        | Preserve printed name; flag correction.                               |
| 21 |    3 | Inyange Juice                              | Two printed sizes: Small 700, Big 1,000.                              | Propose one product with two size options; confirm.                   |
| 22 |    3 | Cloudy / Elderflower Lemonade              | Printed under MOJITO but not named mojito.                            | Keep in Mojito; flag category ambiguity.                              |
| 23 |    3 | THE RASIPS                                 | Heading is ambiguous; no descriptions or health claims are printed.   | Preserve names/prices; add no wellness copy.                          |
| 24 | 2–4 | All drinks                                 | No descriptions, ingredients, allergens or sizes except Inyange.      | Leave fields empty; do not invent.                                    |

## 9. What changed from the Stage 1 provisional manifest

| Area            | Stage 1 provisional                 | PDF-sourced active                                 |
| --------------- | ----------------------------------- | -------------------------------------------------- |
| Categories      | 11                                  | 19 (11 food/dessert, 8 drink)                      |
| Products        | 50                                  | 111                                                |
| Add-ons         | 7                                   | 7                                                  |
| Priced lines    | 57 food                             | 121 (57 food + 64 drink)                           |
| Modeled records | 57 food                             | 118 (111 products + 7 add-ons)                     |
| Drinks          | Empty scaffold                      | 63 products across 8 categories                    |
| Source          | `dataSource: "brief"`               | `dataSource: "pdf"`                                |
| Source pages    | Mostly absent                       | Exact page per entry                               |
| Descriptions    | Mostly pending                      | Exact printed text, or empty                       |
| Variants        | Nyamacoma split into three products | Implemented: one product, three size/cut options   |
| Serving choices | Not modeled                         | Implemented: required zero-price choices           |
| Breakfast sets  | Description text only               | Exact `includedItems`; missing choices not invented |
| Salad add-on    | Attached to all four salads         | Attached only to Avocado salad pending confirmation |

## 10. Business review gate

Schema implementation is complete. The remaining gate is business review of the 24 flagged items,
not further schema approval.

1. Confirm breakfast price mapping and incomplete choice lists.
2. Confirm the salad add-on parent scope.
3. Confirm Nyamacoma modelling and Inyange size labels.
4. Confirm spelling/casing corrections before public copy changes.
5. Confirm category placement for `Cafe Peach`, `Peach & Elderflower` and the Mojito heading items.
6. Confirm `THE RASIPS` naming and that no wellness claims may be added.

Until that review is signed off, every item remains `needsReview: true`, `verified: false` and
`dataSource: "pdf"`. No Stage 2 public API or frontend work has started.
