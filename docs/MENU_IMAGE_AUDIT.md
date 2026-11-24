# FAB FOODS — final menu image audit

**Date:** 2026-11-17.

## Audit limitation

This session's model cannot view image input. Contact sheets were generated and all automated source, licensing, file-integrity, duplicate and source-to-file checks were completed, but a true visual inspection of lighting, cropping, composition, watermarks, branding and misleading appearance was not possible. No sourced image is therefore marked `approved`; all 101 are explicitly `needsReview` pending human review of the contact sheets.

## Summary

| Measure | Count |
| --- | ---: |
| Products in active PDF manifest | 111 |
| Existing sourced images processed for audit | 101 |
| Images visually inspected | 0 |
| Images approved | 0 |
| Images replaced | 0 |
| Images rejected | 0 |
| Images with final `needsReview` status | 101 |
| Products remaining explicitly `missing` | 10 |
| Source pages verified | 101/101 |
| Downloaded files matching cited source URLs byte-for-byte | 101/101 |
| Unique image SHA-256 hashes | 101/101 |
| Near-identical image pairs by perceptual hash | 0 |

## Contact sheets

Generated sheets: `docs/menu-image-audit/sheet-01.jpg` through `sheet-16.jpg` (16 category-grouped sheets). Per-sheet product links are in the companion `.md` files; the full product index is [INDEX.md](./menu-image-audit/INDEX.md).

## Source and licensing verification

All 101 Pexels source pages were independently fetched. Each was accessible, showed Pexels' Free/License terms, listed the recorded creator, and had a title/description/photo ID consistent with the recorded original image URL and product subject. The [Pexels License](https://www.pexels.com/license/) permits commercial use and does not require attribution. Each local WebP was re-derived from its cited source URL using the same CDN parameters and matched the downloaded file byte-for-byte (SHA-256).

## Duplicate-image findings

No duplicate or near-identical images were found: all 101 files have unique SHA-256 hashes, unique source URLs, unique image URLs, and unique local paths. A 16x16 difference-hash comparison found a minimum distance of 87/256 bits between any pair, well above a near-duplicate threshold.

## Product accuracy findings

Metadata-level accuracy was consistent for all 101 sourced records: Pexels page titles/descriptions and photo IDs matched the recorded menu subject and original image URL. No inappropriate reuse was identified because no source URL, image URL, filename, or file hash is shared. Actual visual accuracy still requires human review of the contact sheets.

## Remaining concerns

- Visual quality, cropping, lighting, composition, watermarks, visible third-party branding, and possible customer confusion could not be confirmed without image viewing.
- Ten products remain deliberately unfilled; no unrelated substitute was used.
- No replacements were made because no visual defect was independently verified.

## Final product statuses

| # | Product | Slug | Category | Final audit status | Basis / contact sheet |
| ---: | --- | --- | --- | --- | --- |
| 1 | CONTINENTAL BREAKFAST | `continental-breakfast` | BREAKFAST | needsReview | Source/license/byte verified; visual pending — [sheet-01](./menu-image-audit/sheet-01.md#continental-breakfast) |
| 2 | HEALTH BREAKFAST | `health-breakfast` | BREAKFAST | needsReview | Source/license/byte verified; visual pending — [sheet-01](./menu-image-audit/sheet-01.md#health-breakfast) |
| 3 | CRISPY FIRSH FINGER | `crispy-firsh-finger` | Appetizer and Starter | needsReview | Source/license/byte verified; visual pending — [sheet-01](./menu-image-audit/sheet-01.md#crispy-firsh-finger) |
| 4 | marinated chicken wings | `marinated-chicken-wings` | Appetizer and Starter | needsReview | Source/license/byte verified; visual pending — [sheet-01](./menu-image-audit/sheet-01.md#marinated-chicken-wings) |
| 5 | Chicken Coconut soup | `chicken-coconut-soup` | Soup of the Day | needsReview | Source/license/byte verified; visual pending — [sheet-01](./menu-image-audit/sheet-01.md#chicken-coconut-soup) |
| 6 | Creamy mushroom soup | `creamy-mushroom-soup` | Soup of the Day | needsReview | Source/license/byte verified; visual pending — [sheet-01](./menu-image-audit/sheet-01.md#creamy-mushroom-soup) |
| 7 | mixed vegetable soup | `mixed-vegetable-soup` | Soup of the Day | needsReview | Source/license/byte verified; visual pending — [sheet-01](./menu-image-audit/sheet-01.md#mixed-vegetable-soup) |
| 8 | Avocado salad | `avocado-salad` | Salad | needsReview | Source/license/byte verified; visual pending — [sheet-02](./menu-image-audit/sheet-02.md#avocado-salad) |
| 9 | fabfoods katchumbali salad | `fabfoods-katchumbali-salad` | Salad | needsReview | Source/license/byte verified; visual pending — [sheet-02](./menu-image-audit/sheet-02.md#fabfoods-katchumbali-salad) |
| 10 | German potato salad | `german-potato-salad` | Salad | needsReview | Source/license/byte verified; visual pending — [sheet-02](./menu-image-audit/sheet-02.md#german-potato-salad) |
| 11 | CHICKEN CEASAR SALAD | `chicken-caesar-salad` | Salad | needsReview | Source/license/byte verified; visual pending — [sheet-02](./menu-image-audit/sheet-02.md#chicken-caesar-salad) |
| 12 | Italian wrap | `italian-wrap` | SANDWICHES AND BURGER | needsReview | Source/license/byte verified; visual pending — [sheet-03](./menu-image-audit/sheet-03.md#italian-wrap) |
| 13 | CHICKEN WRAP | `chicken-wrap` | SANDWICHES AND BURGER | needsReview | Source/license/byte verified; visual pending — [sheet-03](./menu-image-audit/sheet-03.md#chicken-wrap) |
| 14 | bEEF WRAP | `beef-wrap` | SANDWICHES AND BURGER | needsReview | Source/license/byte verified; visual pending — [sheet-03](./menu-image-audit/sheet-03.md#beef-wrap) |
| 15 | FABFOoD SANDWICH | `fabfood-sandwich` | SANDWICHES AND BURGER | needsReview | Source/license/byte verified; visual pending — [sheet-03](./menu-image-audit/sheet-03.md#fabfood-sandwich) |
| 16 | CHICKEN SHAWARMA | `chicken-shawarma` | SANDWICHES AND BURGER | needsReview | Source/license/byte verified; visual pending — [sheet-03](./menu-image-audit/sheet-03.md#chicken-shawarma) |
| 17 | BEEF OR CHICKEN BURGER | `beef-or-chicken-burger` | SANDWICHES AND BURGER | needsReview | Source/license/byte verified; visual pending — [sheet-03](./menu-image-audit/sheet-03.md#beef-or-chicken-burger) |
| 18 | CHICKEN BREAST | `chicken-breast` | LAND AND SEA | needsReview | Source/license/byte verified; visual pending — [sheet-04](./menu-image-audit/sheet-04.md#chicken-breast) |
| 19 | sTIRFRIED VEGETABLES | `stir-fried-vegetables` | LAND AND SEA | needsReview | Source/license/byte verified; visual pending — [sheet-04](./menu-image-audit/sheet-04.md#stir-fried-vegetables) |
| 20 | MARINATED HALF GRILLED CHICKEN | `marinated-half-grilled-chicken` | LAND AND SEA | needsReview | Source/license/byte verified; visual pending — [sheet-04](./menu-image-audit/sheet-04.md#marinated-half-grilled-chicken) |
| 21 | MARINATED BEEF RIBS | `marinated-beef-ribs` | LAND AND SEA | needsReview | Source/license/byte verified; visual pending — [sheet-04](./menu-image-audit/sheet-04.md#marinated-beef-ribs) |
| 22 | iNDIAN VEGEtABLE CURRY | `indian-vegetable-curry` | LAND AND SEA | needsReview | Source/license/byte verified; visual pending — [sheet-04](./menu-image-audit/sheet-04.md#indian-vegetable-curry) |
| 23 | BANANA AND PEAS STEW | `banana-and-peas-stew` | LAND AND SEA | missing | No suitable verified image; deliberately unfilled |
| 24 | NILED PERCH FISH FILLET | `nile-perch-fish-fillet` | LAND AND SEA | needsReview | Source/license/byte verified; visual pending — [sheet-04](./menu-image-audit/sheet-04.md#nile-perch-fish-fillet) |
| 25 | BBG STEAK PIZZA | `bbg-steak-pizza` | Pizza Menu | needsReview | Source/license/byte verified; visual pending — [sheet-05](./menu-image-audit/sheet-05.md#bbg-steak-pizza) |
| 26 | FABFOoD SANDWICH | `fabfood-sandwich-pizza` | Pizza Menu | needsReview | Source/license/byte verified; visual pending — [sheet-05](./menu-image-audit/sheet-05.md#fabfood-sandwich-pizza) |
| 27 | VEG Pizza | `veg-pizza` | Pizza Menu | needsReview | Source/license/byte verified; visual pending — [sheet-05](./menu-image-audit/sheet-05.md#veg-pizza) |
| 28 | WHOLE GRILLED CHICKEN | `whole-grilled-chicken` | GRILL CORNER | needsReview | Source/license/byte verified; visual pending — [sheet-06](./menu-image-audit/sheet-06.md#whole-grilled-chicken) |
| 29 | WHOLE GRILLED RABBIT | `whole-grilled-rabbit` | GRILL CORNER | missing | No suitable verified image; deliberately unfilled |
| 30 | NYAMACOMA GOAT | `nyamacoma-goat` | GRILL CORNER | missing | No suitable verified image; deliberately unfilled |
| 31 | WHOLE GRILLED TILAPIA | `whole-grilled-tilapia` | GRILL CORNER | needsReview | Source/license/byte verified; visual pending — [sheet-06](./menu-image-audit/sheet-06.md#whole-grilled-tilapia) |
| 32 | FISH BROCHETTE 2 SKEWERS | `fish-brochette-2-skewers` | GRILL CORNER | needsReview | Source/license/byte verified; visual pending — [sheet-06](./menu-image-audit/sheet-06.md#fish-brochette-2-skewers) |
| 33 | CHICKEN BROCHETTE 2SKEWERS | `chicken-brochette-2-skewers` | GRILL CORNER | needsReview | Source/license/byte verified; visual pending — [sheet-06](./menu-image-audit/sheet-06.md#chicken-brochette-2-skewers) |
| 34 | BEEF BROCHETTES 2 SKEWERS | `beef-brochettes-2-skewers` | GRILL CORNER | needsReview | Source/license/byte verified; visual pending — [sheet-06](./menu-image-audit/sheet-06.md#beef-brochettes-2-skewers) |
| 35 | GOAT BROCHETTES 2 SKEWERS | `goat-brochettes-2-skewers` | GRILL CORNER | missing | No suitable verified image; deliberately unfilled |
| 36 | FRENCH FRIES | `french-fries` | GRILL CORNER | needsReview | Source/license/byte verified; visual pending — [sheet-06](./menu-image-audit/sheet-06.md#french-fries) |
| 37 | FRENCH FRIES AND SALAD | `french-fries-and-salad` | GRILL CORNER | needsReview | Source/license/byte verified; visual pending — [sheet-06](./menu-image-audit/sheet-06.md#french-fries-and-salad) |
| 38 | Boiled chicken with potatoes or banana | `boiled-chicken-with-potatoes-or-banana` | SPECIAL FOOD CORNER | needsReview | Source/license/byte verified; visual pending — [sheet-07](./menu-image-audit/sheet-07.md#boiled-chicken-with-potatoes-or-banana) |
| 39 | BOILED BEEF WITH POTATOES OR BANANA | `boiled-beef-with-potatoes-or-banana` | SPECIAL FOOD CORNER | needsReview | Source/license/byte verified; visual pending — [sheet-07](./menu-image-audit/sheet-07.md#boiled-beef-with-potatoes-or-banana) |
| 40 | BOILED FISH WITH POTATOES OR BANANA | `boiled-fish-with-potatoes-or-banana` | SPECIAL FOOD CORNER | needsReview | Source/license/byte verified; visual pending — [sheet-07](./menu-image-audit/sheet-07.md#boiled-fish-with-potatoes-or-banana) |
| 41 | FABFOOD POTATOES | `fabfood-potatoes` | SPECIAL FOOD CORNER | needsReview | Source/license/byte verified; visual pending — [sheet-07](./menu-image-audit/sheet-07.md#fabfood-potatoes) |
| 42 | BBQ POTATOES | `bbq-potatoes` | SPECIAL FOOD CORNER | needsReview | Source/license/byte verified; visual pending — [sheet-07](./menu-image-audit/sheet-07.md#bbq-potatoes) |
| 43 | GRILLED GREEN BANANA | `grilled-green-banana` | SPECIAL FOOD CORNER | needsReview | Source/license/byte verified; visual pending — [sheet-07](./menu-image-audit/sheet-07.md#grilled-green-banana) |
| 44 | steamed rice | `steamed-rice` | SPECIAL FOOD CORNER | needsReview | Source/license/byte verified; visual pending — [sheet-07](./menu-image-audit/sheet-07.md#steamed-rice) |
| 45 | goat/beef fry | `goat-beef-fry` | SPECIAL FOOD CORNER | missing | No suitable verified image; deliberately unfilled |
| 46 | seasonal fruit cut | `seasonal-fruit-cut` | Dessert | needsReview | Source/license/byte verified; visual pending — [sheet-08](./menu-image-audit/sheet-08.md#seasonal-fruit-cut) |
| 47 | Masedoine | `masedoine` | Dessert | needsReview | Source/license/byte verified; visual pending — [sheet-08](./menu-image-audit/sheet-08.md#masedoine) |
| 48 | Cake of the day | `cake-of-the-day` | Dessert | needsReview | Source/license/byte verified; visual pending — [sheet-08](./menu-image-audit/sheet-08.md#cake-of-the-day) |
| 49 | Espresso | `espresso` | Hot Coffee | needsReview | Source/license/byte verified; visual pending — [sheet-09](./menu-image-audit/sheet-09.md#espresso) |
| 50 | Cappucino | `cappucino` | Hot Coffee | needsReview | Source/license/byte verified; visual pending — [sheet-09](./menu-image-audit/sheet-09.md#cappucino) |
| 51 | Cafe Latte | `cafe-latte` | Hot Coffee | needsReview | Source/license/byte verified; visual pending — [sheet-09](./menu-image-audit/sheet-09.md#cafe-latte) |
| 52 | Americano | `americano` | Hot Coffee | needsReview | Source/license/byte verified; visual pending — [sheet-09](./menu-image-audit/sheet-09.md#americano) |
| 53 | Cafe Mocha | `cafe-mocha` | Hot Coffee | needsReview | Source/license/byte verified; visual pending — [sheet-09](./menu-image-audit/sheet-09.md#cafe-mocha) |
| 54 | Caramel Latte | `caramel-latte` | Hot Coffee | needsReview | Source/license/byte verified; visual pending — [sheet-09](./menu-image-audit/sheet-09.md#caramel-latte) |
| 55 | Vanilla Latte | `vanilla-latte` | Hot Coffee | needsReview | Source/license/byte verified; visual pending — [sheet-09](./menu-image-audit/sheet-09.md#vanilla-latte) |
| 56 | Vanilla Latte Macchiato | `vanilla-latte-macchiato-hot` | Hot Coffee | needsReview | Source/license/byte verified; visual pending — [sheet-09](./menu-image-audit/sheet-09.md#vanilla-latte-macchiato-hot) |
| 57 | Flatter white | `flatter-white` | Hot Coffee | needsReview | Source/license/byte verified; visual pending — [sheet-09](./menu-image-audit/sheet-09.md#flatter-white) |
| 58 | Hot Chocolate | `hot-chocolate` | Hot Coffee | needsReview | Source/license/byte verified; visual pending — [sheet-09](./menu-image-audit/sheet-09.md#hot-chocolate) |
| 59 | African Coffee | `african-coffee` | Hot Coffee | missing | No suitable verified image; deliberately unfilled |
| 60 | Hazelnut Flavored Coffee | `hazelnut-flavored-coffee` | Hot Coffee | needsReview | Source/license/byte verified; visual pending — [sheet-09](./menu-image-audit/sheet-09.md#hazelnut-flavored-coffee) |
| 61 | Affogato | `affogato` | Iced Coffee | needsReview | Source/license/byte verified; visual pending — [sheet-10](./menu-image-audit/sheet-10.md#affogato) |
| 62 | Iced Cappucino | `iced-cappucino` | Iced Coffee | needsReview | Source/license/byte verified; visual pending — [sheet-10](./menu-image-audit/sheet-10.md#iced-cappucino) |
| 63 | Iced Latte | `iced-latte` | Iced Coffee | needsReview | Source/license/byte verified; visual pending — [sheet-10](./menu-image-audit/sheet-10.md#iced-latte) |
| 64 | Iced Mocha | `iced-mocha` | Iced Coffee | needsReview | Source/license/byte verified; visual pending — [sheet-10](./menu-image-audit/sheet-10.md#iced-mocha) |
| 65 | Vanilla Latte Macchiato | `vanilla-latte-macchiato-iced` | Iced Coffee | needsReview | Source/license/byte verified; visual pending — [sheet-10](./menu-image-audit/sheet-10.md#vanilla-latte-macchiato-iced) |
| 66 | Iced Vanilla Latte | `iced-vanilla-latte` | Iced Coffee | needsReview | Source/license/byte verified; visual pending — [sheet-10](./menu-image-audit/sheet-10.md#iced-vanilla-latte) |
| 67 | Cafe Peach | `cafe-peach` | Iced Coffee | missing | No suitable verified image; deliberately unfilled |
| 68 | Iced Caramel Latte | `iced-caramel-latte` | Iced Coffee | needsReview | Source/license/byte verified; visual pending — [sheet-10](./menu-image-audit/sheet-10.md#iced-caramel-latte) |
| 69 | Iced Caramel Macchiato | `iced-caramel-macchiato` | Iced Coffee | needsReview | Source/license/byte verified; visual pending — [sheet-10](./menu-image-audit/sheet-10.md#iced-caramel-macchiato) |
| 70 | Black Tea | `black-tea` | Tea | needsReview | Source/license/byte verified; visual pending — [sheet-11](./menu-image-audit/sheet-11.md#black-tea) |
| 71 | Green Tea | `green-tea` | Tea | needsReview | Source/license/byte verified; visual pending — [sheet-11](./menu-image-audit/sheet-11.md#green-tea) |
| 72 | African Tea | `african-tea` | Tea | needsReview | Source/license/byte verified; visual pending — [sheet-11](./menu-image-audit/sheet-11.md#african-tea) |
| 73 | Lemon Tea | `lemon-tea` | Tea | needsReview | Source/license/byte verified; visual pending — [sheet-11](./menu-image-audit/sheet-11.md#lemon-tea) |
| 74 | Ginger Tea | `ginger-tea` | Tea | needsReview | Source/license/byte verified; visual pending — [sheet-11](./menu-image-audit/sheet-11.md#ginger-tea) |
| 75 | Spicy Tea | `spicy-tea` | Tea | needsReview | Source/license/byte verified; visual pending — [sheet-11](./menu-image-audit/sheet-11.md#spicy-tea) |
| 76 | Iced Tea | `iced-tea` | Tea | needsReview | Source/license/byte verified; visual pending — [sheet-11](./menu-image-audit/sheet-11.md#iced-tea) |
| 77 | Peach & Elderflower | `peach-and-elderflower` | Tea | needsReview | Source/license/byte verified; visual pending — [sheet-11](./menu-image-audit/sheet-11.md#peach-and-elderflower) |
| 78 | Soda | `soda` | SOFT DRINKS | needsReview | Source/license/byte verified; visual pending — [sheet-12](./menu-image-audit/sheet-12.md#soda) |
| 79 | Plastic bottle Soda | `plastic-bottle-soda` | SOFT DRINKS | needsReview | Source/license/byte verified; visual pending — [sheet-12](./menu-image-audit/sheet-12.md#plastic-bottle-soda) |
| 80 | Inyange Juice | `inyange-juice` | SOFT DRINKS | missing | No suitable verified image; deliberately unfilled |
| 81 | Water | `water` | SOFT DRINKS | needsReview | Source/license/byte verified; visual pending — [sheet-12](./menu-image-audit/sheet-12.md#water) |
| 82 | Pineaple | `pineaple` | FRESH JUICE | needsReview | Source/license/byte verified; visual pending — [sheet-12](./menu-image-audit/sheet-12.md#pineaple) |
| 83 | Passion | `passion` | FRESH JUICE | needsReview | Source/license/byte verified; visual pending — [sheet-12](./menu-image-audit/sheet-12.md#passion) |
| 84 | Mango | `mango` | FRESH JUICE | needsReview | Source/license/byte verified; visual pending — [sheet-12](./menu-image-audit/sheet-12.md#mango) |
| 85 | Cocktail Juice | `cocktail-juice` | FRESH JUICE | needsReview | Source/license/byte verified; visual pending — [sheet-12](./menu-image-audit/sheet-12.md#cocktail-juice) |
| 86 | Cloudy Lemonade | `cloudy-lemonade` | MOJITO | needsReview | Source/license/byte verified; visual pending — [sheet-13](./menu-image-audit/sheet-13.md#cloudy-lemonade) |
| 87 | Grenadine Mojito | `grenadine-mojito` | MOJITO | needsReview | Source/license/byte verified; visual pending — [sheet-13](./menu-image-audit/sheet-13.md#grenadine-mojito) |
| 88 | Blueberry Mojito | `blueberry-mojito` | MOJITO | needsReview | Source/license/byte verified; visual pending — [sheet-13](./menu-image-audit/sheet-13.md#blueberry-mojito) |
| 89 | Strawberry Mojito | `strawberry-mojito` | MOJITO | needsReview | Source/license/byte verified; visual pending — [sheet-13](./menu-image-audit/sheet-13.md#strawberry-mojito) |
| 90 | Elderflower Lemonade | `elderflower-lemonade` | MOJITO | needsReview | Source/license/byte verified; visual pending — [sheet-13](./menu-image-audit/sheet-13.md#elderflower-lemonade) |
| 91 | Deep Sleep | `deep-sleep` | THE RASIPS | needsReview | Source/license/byte verified; visual pending — [sheet-14](./menu-image-audit/sheet-14.md#deep-sleep) |
| 92 | Healthy gut | `healthy-gut` | THE RASIPS | needsReview | Source/license/byte verified; visual pending — [sheet-14](./menu-image-audit/sheet-14.md#healthy-gut) |
| 93 | Headache Relief | `headache-relief` | THE RASIPS | needsReview | Source/license/byte verified; visual pending — [sheet-14](./menu-image-audit/sheet-14.md#headache-relief) |
| 94 | Sinus Care | `sinus-care` | THE RASIPS | needsReview | Source/license/byte verified; visual pending — [sheet-14](./menu-image-audit/sheet-14.md#sinus-care) |
| 95 | Clear Skin | `clear-skin` | THE RASIPS | needsReview | Source/license/byte verified; visual pending — [sheet-14](./menu-image-audit/sheet-14.md#clear-skin) |
| 96 | Boost Immunity | `boost-immunity` | THE RASIPS | needsReview | Source/license/byte verified; visual pending — [sheet-14](./menu-image-audit/sheet-14.md#boost-immunity) |
| 97 | Mango and Pineapple | `mango-and-pineapple` | SMOOTHIES | needsReview | Source/license/byte verified; visual pending — [sheet-15](./menu-image-audit/sheet-15.md#mango-and-pineapple) |
| 98 | Chocolate Peanut Butter | `chocolate-peanut-butter` | SMOOTHIES | needsReview | Source/license/byte verified; visual pending — [sheet-15](./menu-image-audit/sheet-15.md#chocolate-peanut-butter) |
| 99 | Strawberry and Banana | `strawberry-and-banana` | SMOOTHIES | needsReview | Source/license/byte verified; visual pending — [sheet-15](./menu-image-audit/sheet-15.md#strawberry-and-banana) |
| 100 | Banana Smoothie | `banana-smoothie` | SMOOTHIES | needsReview | Source/license/byte verified; visual pending — [sheet-15](./menu-image-audit/sheet-15.md#banana-smoothie) |
| 101 | Mango Smoothie | `mango-smoothie` | SMOOTHIES | needsReview | Source/license/byte verified; visual pending — [sheet-15](./menu-image-audit/sheet-15.md#mango-smoothie) |
| 102 | Watermelon | `watermelon` | SMOOTHIES | needsReview | Source/license/byte verified; visual pending — [sheet-15](./menu-image-audit/sheet-15.md#watermelon) |
| 103 | Tree Tomato | `tree-tomato` | SMOOTHIES | missing | No suitable verified image; deliberately unfilled |
| 104 | Green Detox | `green-detox` | SMOOTHIES | needsReview | Source/license/byte verified; visual pending — [sheet-15](./menu-image-audit/sheet-15.md#green-detox) |
| 105 | vanilla milkshake | `vanilla-milkshake` | MILKSHAKE | needsReview | Source/license/byte verified; visual pending — [sheet-16](./menu-image-audit/sheet-16.md#vanilla-milkshake) |
| 106 | Strawberry milkshake | `strawberry-milkshake` | MILKSHAKE | needsReview | Source/license/byte verified; visual pending — [sheet-16](./menu-image-audit/sheet-16.md#strawberry-milkshake) |
| 107 | Chocolate milkshake | `chocolate-milkshake` | MILKSHAKE | needsReview | Source/license/byte verified; visual pending — [sheet-16](./menu-image-audit/sheet-16.md#chocolate-milkshake) |
| 108 | Nutella milkshake | `nutella-milkshake` | MILKSHAKE | needsReview | Source/license/byte verified; visual pending — [sheet-16](./menu-image-audit/sheet-16.md#nutella-milkshake) |
| 109 | Mango milkshake | `mango-milkshake` | MILKSHAKE | needsReview | Source/license/byte verified; visual pending — [sheet-16](./menu-image-audit/sheet-16.md#mango-milkshake) |
| 110 | Banana milkshake | `banana-milkshake` | MILKSHAKE | needsReview | Source/license/byte verified; visual pending — [sheet-16](./menu-image-audit/sheet-16.md#banana-milkshake) |
| 111 | Nutty Banana Shake | `nutty-banana-shake` | MILKSHAKE | missing | No suitable verified image; deliberately unfilled |

## Missing products

- `banana-and-peas-stew`
- `whole-grilled-rabbit`
- `nyamacoma-goat`
- `goat-brochettes-2-skewers`
- `goat-beef-fry`
- `african-coffee`
- `cafe-peach`
- `inyange-juice`
- `tree-tomato`
- `nutty-banana-shake`
