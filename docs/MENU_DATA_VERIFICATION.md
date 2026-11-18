# FAB FOODS — Menu Data Verification and Reconciliation

**Date:** 2026-11-17.

## Scope and outcome

All 111 active products, 19 categories, 24 original review issues and 7 add-on records were reconciled against the two original PDFs. The PDFs are the primary source of truth. No historical `menu.manifest.js` data was used.

| Measure | Count |
| --- | ---: |
| Products reviewed | 111 |
| Categories reviewed | 19 |
| Original review issues reviewed | 24 |
| Add-on records reviewed | 7 |
| Name/price/page matches found | 111/111 |
| Manifest corrections made | 0 |
| Issues resolved with direct source evidence | 7 |
| Issues partially resolved | 7 |
| Issues requiring FAB FOODS clarification | 10 |
| Issues unresolved | 0 |

## Source documents

| ID | File used | Pages | SHA256 |
| --- | --- | ---: | --- |
| `food-menu` | `docs/source-menus/FAB_FOODS_FOOD_MENU.pdf` | 15 | `D341A473B9A91A9827A2B7CD604632EF6B53AB716FC8471508DD1B5E2F679D47` |
| `drink-menu` | `docs/source-menus/FAB_FOODS_DRINK_MENU.pdf` | 5 | `9AC93A617E6A463DCACF4E77D4B5C29D209E59F32F471912F300B712442B1E60` |

Duplicate byte-identical copies also exist in `docs/source-menus/`: `Fab Foods Menu ( Foods).pdf` matches the food PDF hash and `FAB FOODS DRINK MENU.pdf` matches the drinks PDF hash. They were not treated as independent sources.

## Method

- Extracted embedded PDF text with PyMuPDF; no OCR and no guessed values were used.
- Compared every manifest product name, price, page and category with the printed PDF text.
- Cross-checked all size options, serving choices, add-ons and count reconciliation.
- Preserved printed spelling, casing and category placement unless the PDF directly supports a correction.
- Classified all 24 original review issues against PDF evidence only.

## Count reconciliation

| Measure | Food | Drinks | Combined |
| --- | ---: | ---: | ---: |
| Printed priced lines | 57 | 64 | 121 |
| Standalone product priced lines | 50 | 64 | 114 |
| Add-on priced lines | 7 | 0 | 7 |
| Product records | 48 | 63 | 111 |
| Add-on records | — | — | 7 |
| Modeled records | 55 | 63 | 118 |
| Distinct product names | 47 | 62 | 109 |

The 55 figure remains the food-only modeled-record count: 48 food products plus 7 add-ons. It is not the full menu count.

## Verification result by category

| Category | Kind | Source PDF | Page | Products | Result |
| --- | --- | --- | ---: | ---: | --- |
| BREAKFAST | food | `food-menu` | 2 | 2 | All printed names, prices and pages match; no category correction made. |
| Appetizer and Starter | food | `food-menu` | 5 | 2 | All printed names, prices and pages match; no category correction made. |
| Soup of the Day | food | `food-menu` | 5 | 3 | All printed names, prices and pages match; no category correction made. |
| Salad | food | `food-menu` | 5 | 4 | All printed names, prices and pages match; no category correction made. |
| SANDWICHES AND BURGER | food | `food-menu` | 6 | 6 | All printed names, prices and pages match; no category correction made. |
| LAND AND SEA | food | `food-menu` | 8 | 7 | All printed names, prices and pages match; no category correction made. |
| Pizza Menu | food | `food-menu` | 10 | 3 | All printed names, prices and pages match; no category correction made. |
| GRILL CORNER | food | `food-menu` | 11 | 10 | All printed names, prices and pages match; no category correction made. |
| SPECIAL FOOD CORNER | food | `food-menu` | 13 | 8 | All printed names, prices and pages match; no category correction made. |
| Dessert | dessert | `food-menu` | 15 | 3 | All printed names, prices and pages match; no category correction made. |
| Hot Coffee | drink | `drink-menu` | 2 | 12 | All printed names, prices and pages match; no category correction made. |
| Iced Coffee | drink | `drink-menu` | 2 | 9 | All printed names, prices and pages match; no category correction made. |
| Tea | drink | `drink-menu` | 2 | 8 | All printed names, prices and pages match; no category correction made. |
| SOFT DRINKS | drink | `drink-menu` | 3 | 4 | All printed names, prices and pages match; no category correction made. |
| FRESH JUICE | drink | `drink-menu` | 3 | 4 | All printed names, prices and pages match; no category correction made. |
| MOJITO | drink | `drink-menu` | 3 | 5 | All printed names, prices and pages match; no category correction made. |
| THE RASIPS | drink | `drink-menu` | 3 | 6 | All printed names, prices and pages match; no category correction made. |
| SMOOTHIES | drink | `drink-menu` | 4 | 8 | All printed names, prices and pages match; no category correction made. |
| MILKSHAKE | drink | `drink-menu` | 4 | 7 | All printed names, prices and pages match; no category correction made. |

## Complete product verification table

Printed names and prices below are preserved verbatim from the PDFs. `Verification result` is the reconciliation outcome, not business approval.

| Product | Category | Source PDF | Page | Verified name | Verified price | Verification result | Remaining issue |
| --- | --- | --- | ---: | --- | --- | --- | --- |
| CONTINENTAL BREAKFAST | BREAKFAST | `food-menu` | 3 | CONTINENTAL BREAKFAST | RWF 8,000 (`8000`) | Printed name, price, page and category match the PDF; no manifest change. | #2 breakfast choice lists |
| HEALTH BREAKFAST | BREAKFAST | `food-menu` | 3 | HEALTH BREAKFAST | RWF 8,000 (`8000`) | Printed name, price, page and category match the PDF; no manifest change. | #2 breakfast choice lists |
| CRISPY FIRSH FINGER | Appetizer and Starter | `food-menu` | 5 | CRISPY FIRSH FINGER | RWF 9,000 (`9k`) | Printed name, price, page and category match the PDF; no manifest change. | #3 FIRSH spelling |
| marinated chicken wings | Appetizer and Starter | `food-menu` | 5 | marinated chicken wings | RWF 8,000 (`8k`) | Printed name, price, page and category match the PDF; no manifest change. | — |
| Chicken Coconut soup | Soup of the Day | `food-menu` | 5 | Chicken Coconut soup | RWF 6,000 (`6k`) | Printed name, price, page and category match the PDF; no manifest change. | — |
| Creamy mushroom soup | Soup of the Day | `food-menu` | 5 | Creamy mushroom soup | RWF 8,000 (`8k`) | Printed name, price, page and category match the PDF; no manifest change. | — |
| mixed vegetable soup | Soup of the Day | `food-menu` | 5 | mixed vegetable soup | RWF 4,000 (`4k`) | Printed name, price, page and category match the PDF; no manifest change. | — |
| Avocado salad | Salad | `food-menu` | 5 | Avocado salad | RWF 3,000 (`3k`) | Printed name, price, page and category match the PDF; no manifest change. | #4 salad add-on scope |
| fabfoods katchumbali salad | Salad | `food-menu` | 5 | fabfoods katchumbali salad | RWF 4,000 (`4k`) | Printed name, price, page and category match the PDF; no manifest change. | #4 salad add-on scope |
| German potato salad | Salad | `food-menu` | 5 | German potato salad | RWF 4,000 (`4k`) | Printed name, price, page and category match the PDF; no manifest change. | #4 salad add-on scope |
| CHICKEN CEASAR SALAD | Salad | `food-menu` | 5 | CHICKEN CEASAR SALAD | RWF 7,000 (`7K`) | Printed name, price, page and category match the PDF; no manifest change. | #4 salad add-on scope, #5 CEASAR spelling |
| Italian wrap | SANDWICHES AND BURGER | `food-menu` | 7 | Italian wrap | RWF 7,500 (`7.5k`) | Printed name, price, page and category match the PDF; no manifest change. | — |
| CHICKEN WRAP | SANDWICHES AND BURGER | `food-menu` | 7 | CHICKEN WRAP | RWF 7,000 (`7k`) | Printed name, price, page and category match the PDF; no manifest change. | — |
| bEEF WRAP | SANDWICHES AND BURGER | `food-menu` | 7 | bEEF WRAP | RWF 8,000 (`8k`) | Printed name, price, page and category match the PDF; no manifest change. | — |
| FABFOoD SANDWICH | SANDWICHES AND BURGER | `food-menu` | 7 | FABFOoD SANDWICH | RWF 8,000 (`8k`) | Printed name, price, page and category match the PDF; no manifest change. Printed zero-price choices verified. Duplicate-looking printed entry preserved. | #6 Fabfood Sandwich duplicate |
| CHICKEN SHAWARMA | SANDWICHES AND BURGER | `food-menu` | 7 | CHICKEN SHAWARMA | RWF 8,000 (`8k`) | Printed name, price, page and category match the PDF; no manifest change. | — |
| BEEF OR CHICKEN BURGER | SANDWICHES AND BURGER | `food-menu` | 7 | BEEF OR CHICKEN BURGER | RWF 7,500 (`7.5k`) | Printed name, price, page and category match the PDF; no manifest change. Printed zero-price choices verified. | — |
| CHICKEN BREAST | LAND AND SEA | `food-menu` | 9 | CHICKEN BREAST | RWF 8,000 (`8K`) | Printed name, price, page and category match the PDF; no manifest change. | — |
| sTIRFRIED VEGETABLES | LAND AND SEA | `food-menu` | 9 | sTIRFRIED VEGETABLES | RWF 5,000 (`5K`) | Printed name, price, page and category match the PDF; no manifest change. | — |
| MARINATED HALF GRILLED CHICKEN | LAND AND SEA | `food-menu` | 9 | MARINATED HALF GRILLED CHICKEN | RWF 12,000 (`12K`) | Printed name, price, page and category match the PDF; no manifest change. | — |
| MARINATED BEEF RIBS | LAND AND SEA | `food-menu` | 9 | MARINATED BEEF RIBS | RWF 15,000 (`15K`) | Printed name, price, page and category match the PDF; no manifest change. | — |
| iNDIAN VEGEtABLE CURRY | LAND AND SEA | `food-menu` | 9 | iNDIAN VEGEtABLE CURRY | RWF 7,000 (`7K`) | Printed name, price, page and category match the PDF; no manifest change. | #8 rice/chapati “OF” |
| BANANA AND PEAS STEW | LAND AND SEA | `food-menu` | 9 | BANANA AND PEAS STEW | RWF 4,000 (`4K`) | Printed name, price, page and category match the PDF; no manifest change. | — |
| NILED PERCH FISH FILLET | LAND AND SEA | `food-menu` | 9 | NILED PERCH FISH FILLET | RWF 15,000 (`15K`) | Printed name, price, page and category match the PDF; no manifest change. | — |
| BBG STEAK PIZZA | Pizza Menu | `food-menu` | 10 | BBG STEAK PIZZA | RWF 10,000 (`10k`) | Printed name, price, page and category match the PDF; no manifest change. | #7 BBG spelling |
| FABFOoD SANDWICH | Pizza Menu | `food-menu` | 10 | FABFOoD SANDWICH | RWF 10,000 (`10k`) | Printed name, price, page and category match the PDF; no manifest change. Duplicate-looking printed entry preserved. | #6 Fabfood Sandwich duplicate |
| VEG Pizza | Pizza Menu | `food-menu` | 10 | VEG Pizza | RWF 7,000 (`7k`) | Printed name, price, page and category match the PDF; no manifest change. | — |
| WHOLE GRILLED CHICKEN | GRILL CORNER | `food-menu` | 12 | WHOLE GRILLED CHICKEN | RWF 18,000 (`18k`) | Printed name, price, page and category match the PDF; no manifest change. Printed zero-price choices verified. | — |
| WHOLE GRILLED RABBIT | GRILL CORNER | `food-menu` | 12 | WHOLE GRILLED RABBIT | RWF 18,000 (`18k`) | Printed name, price, page and category match the PDF; no manifest change. Printed zero-price choices verified. | — |
| NYAMACOMA GOAT | GRILL CORNER | `food-menu` | 12 | NYAMACOMA GOAT | RWF 15,000 (`15K`) | Printed name, price, page and category match the PDF; no manifest change. Printed size/cut prices verified. Base price is the lowest printed cut price, not a separate printed heading price. | — |
| WHOLE GRILLED TILAPIA | GRILL CORNER | `food-menu` | 12 | WHOLE GRILLED TILAPIA | RWF 20,000 (`20K`) | Printed name, price, page and category match the PDF; no manifest change. | — |
| FISH BROCHETTE 2 SKEWERS | GRILL CORNER | `food-menu` | 12 | FISH BROCHETTE 2 SKEWERS | RWF 8,000 (`8K`) | Printed name, price, page and category match the PDF; no manifest change. | — |
| CHICKEN BROCHETTE 2SKEWERS | GRILL CORNER | `food-menu` | 12 | CHICKEN BROCHETTE 2SKEWERS | RWF 8,000 (`8K`) | Printed name, price, page and category match the PDF; no manifest change. | — |
| BEEF BROCHETTES 2 SKEWERS | GRILL CORNER | `food-menu` | 12 | BEEF BROCHETTES 2 SKEWERS | RWF 8,000 (`8K`) | Printed name, price, page and category match the PDF; no manifest change. | — |
| GOAT BROCHETTES 2 SKEWERS | GRILL CORNER | `food-menu` | 12 | GOAT BROCHETTES 2 SKEWERS | RWF 8,000 (`8K`) | Printed name, price, page and category match the PDF; no manifest change. | — |
| FRENCH FRIES | GRILL CORNER | `food-menu` | 12 | FRENCH FRIES | RWF 4,000 (`4K`) | Printed name, price, page and category match the PDF; no manifest change. | — |
| FRENCH FRIES AND SALAD | GRILL CORNER | `food-menu` | 12 | FRENCH FRIES AND SALAD | RWF 5,000 (`5K`) | Printed name, price, page and category match the PDF; no manifest change. | — |
| Boiled chicken with potatoes or banana | SPECIAL FOOD CORNER | `food-menu` | 14 | Boiled chicken with potatoes or banana | RWF 6,000 (`6k`) | Printed name, price, page and category match the PDF; no manifest change. Printed zero-price choices verified. | #11 description spellings |
| BOILED BEEF WITH POTATOES OR BANANA | SPECIAL FOOD CORNER | `food-menu` | 14 | BOILED BEEF WITH POTATOES OR BANANA | RWF 6,000 (`6K`) | Printed name, price, page and category match the PDF; no manifest change. Printed zero-price choices verified. | — |
| BOILED FISH WITH POTATOES OR BANANA | SPECIAL FOOD CORNER | `food-menu` | 14 | BOILED FISH WITH POTATOES OR BANANA | RWF 6,000 (`6k`) | Printed name, price, page and category match the PDF; no manifest change. Printed zero-price choices verified. | — |
| FABFOOD POTATOES | SPECIAL FOOD CORNER | `food-menu` | 14 | FABFOOD POTATOES | RWF 4,000 (`4K`) | Printed name, price, page and category match the PDF; no manifest change. | #11 description spellings |
| BBQ POTATOES | SPECIAL FOOD CORNER | `food-menu` | 14 | BBQ POTATOES | RWF 2,000 (`2K`) | Printed name, price, page and category match the PDF; no manifest change. | — |
| GRILLED GREEN BANANA | SPECIAL FOOD CORNER | `food-menu` | 14 | GRILLED GREEN BANANA | RWF 1,000 (`1K`) | Printed name, price, page and category match the PDF; no manifest change. Printed zero-price choices verified. | #12 grilled/fried banana |
| steamed rice | SPECIAL FOOD CORNER | `food-menu` | 14 | steamed rice | RWF 2,000 (`2k`) | Printed name, price, page and category match the PDF; no manifest change. | — |
| goat/beef fry | SPECIAL FOOD CORNER | `food-menu` | 14 | goat/beef fry | RWF 8,000 (`8k`) | Printed name, price, page and category match the PDF; no manifest change. Printed zero-price choices verified. | — |
| seasonal fruit cut | Dessert | `food-menu` | 15 | seasonal fruit cut | RWF 5,000 (`5k`) | Printed name, price, page and category match the PDF; no manifest change. | — |
| Masedoine | Dessert | `food-menu` | 15 | Masedoine | RWF 5,000 (`5k`) | Printed name, price, page and category match the PDF; no manifest change. | #14 Masedoine spelling |
| Cake of the day | Dessert | `food-menu` | 15 | Cake of the day | RWF 5,000 (`5k`) | Printed name, price, page and category match the PDF; no manifest change. | — |
| Espresso | Hot Coffee | `drink-menu` | 2 | Espresso | RWF 2,500 (`2500`) | Printed name, price, page and category match the PDF; no manifest change. | — |
| Cappucino | Hot Coffee | `drink-menu` | 2 | Cappucino | RWF 3,000 (`3000`) | Printed name, price, page and category match the PDF; no manifest change. | #15 Cappucino spelling |
| Cafe Latte | Hot Coffee | `drink-menu` | 2 | Cafe Latte | RWF 3,000 (`3000`) | Printed name, price, page and category match the PDF; no manifest change. | — |
| Americano | Hot Coffee | `drink-menu` | 2 | Americano | RWF 3,000 (`3000`) | Printed name, price, page and category match the PDF; no manifest change. | — |
| Cafe Mocha | Hot Coffee | `drink-menu` | 2 | Cafe Mocha | RWF 3,500 (`3500`) | Printed name, price, page and category match the PDF; no manifest change. | — |
| Caramel Latte | Hot Coffee | `drink-menu` | 2 | Caramel Latte | RWF 3,500 (`3500`) | Printed name, price, page and category match the PDF; no manifest change. | — |
| Vanilla Latte | Hot Coffee | `drink-menu` | 2 | Vanilla Latte | RWF 3,500 (`3500`) | Printed name, price, page and category match the PDF; no manifest change. | — |
| Vanilla Latte Macchiato | Hot Coffee | `drink-menu` | 2 | Vanilla Latte Macchiato | RWF 3,500 (`3500`) | Printed name, price, page and category match the PDF; no manifest change. Duplicate-looking printed entry preserved. | #17 Vanilla Latte Macchiato naming |
| Flatter white | Hot Coffee | `drink-menu` | 2 | Flatter white | RWF 3,000 (`3000`) | Printed name, price, page and category match the PDF; no manifest change. | #16 Flatter white spelling |
| Hot Chocolate | Hot Coffee | `drink-menu` | 2 | Hot Chocolate | RWF 3,000 (`3000`) | Printed name, price, page and category match the PDF; no manifest change. | — |
| African Coffee | Hot Coffee | `drink-menu` | 2 | African Coffee | RWF 3,500 (`3500`) | Printed name, price, page and category match the PDF; no manifest change. | — |
| Hazelnut Flavored Coffee | Hot Coffee | `drink-menu` | 2 | Hazelnut Flavored Coffee | RWF 3,500 (`3500`) | Printed name, price, page and category match the PDF; no manifest change. | — |
| Affogato | Iced Coffee | `drink-menu` | 2 | Affogato | RWF 3,500 (`3500`) | Printed name, price, page and category match the PDF; no manifest change. | — |
| Iced Cappucino | Iced Coffee | `drink-menu` | 2 | Iced Cappucino | RWF 3,500 (`3500`) | Printed name, price, page and category match the PDF; no manifest change. | #15 Cappucino spelling |
| Iced Latte | Iced Coffee | `drink-menu` | 2 | Iced Latte | RWF 3,500 (`3500`) | Printed name, price, page and category match the PDF; no manifest change. | — |
| Iced Mocha | Iced Coffee | `drink-menu` | 2 | Iced Mocha | RWF 4,000 (`4000`) | Printed name, price, page and category match the PDF; no manifest change. | — |
| Vanilla Latte Macchiato | Iced Coffee | `drink-menu` | 2 | Vanilla Latte Macchiato | RWF 4,000 (`4000`) | Printed name, price, page and category match the PDF; no manifest change. Duplicate-looking printed entry preserved. | #17 Vanilla Latte Macchiato naming |
| Iced Vanilla Latte | Iced Coffee | `drink-menu` | 2 | Iced Vanilla Latte | RWF 4,000 (`4000`) | Printed name, price, page and category match the PDF; no manifest change. | — |
| Cafe Peach | Iced Coffee | `drink-menu` | 2 | Cafe Peach | RWF 4,000 (`4000`) | Printed name, price, page and category match the PDF; no manifest change. | #18 Cafe Peach naming |
| Iced Caramel Latte | Iced Coffee | `drink-menu` | 2 | Iced Caramel Latte | RWF 4,000 (`4000`) | Printed name, price, page and category match the PDF; no manifest change. | — |
| Iced Caramel Macchiato | Iced Coffee | `drink-menu` | 2 | Iced Caramel Macchiato | RWF 4,000 (`4000`) | Printed name, price, page and category match the PDF; no manifest change. | — |
| Black Tea | Tea | `drink-menu` | 2 | Black Tea | RWF 2,000 (`2000`) | Printed name, price, page and category match the PDF; no manifest change. | — |
| Green Tea | Tea | `drink-menu` | 2 | Green Tea | RWF 2,000 (`2000`) | Printed name, price, page and category match the PDF; no manifest change. | — |
| African Tea | Tea | `drink-menu` | 2 | African Tea | RWF 2,500 (`2500`) | Printed name, price, page and category match the PDF; no manifest change. | — |
| Lemon Tea | Tea | `drink-menu` | 2 | Lemon Tea | RWF 2,500 (`2500`) | Printed name, price, page and category match the PDF; no manifest change. | — |
| Ginger Tea | Tea | `drink-menu` | 2 | Ginger Tea | RWF 2,500 (`2500`) | Printed name, price, page and category match the PDF; no manifest change. | — |
| Spicy Tea | Tea | `drink-menu` | 2 | Spicy Tea | RWF 2,500 (`2500`) | Printed name, price, page and category match the PDF; no manifest change. | — |
| Iced Tea | Tea | `drink-menu` | 2 | Iced Tea | RWF 3,000 (`3000`) | Printed name, price, page and category match the PDF; no manifest change. | — |
| Peach & Elderflower | Tea | `drink-menu` | 2 | Peach & Elderflower | RWF 4,000 (`4000`) | Printed name, price, page and category match the PDF; no manifest change. | #19 Peach & Elderflower naming |
| Soda | SOFT DRINKS | `drink-menu` | 3 | Soda | RWF 1,000 (`1000`) | Printed name, price, page and category match the PDF; no manifest change. | — |
| Plastic bottle Soda | SOFT DRINKS | `drink-menu` | 3 | Plastic bottle Soda | RWF 1,500 (`1500`) | Printed name, price, page and category match the PDF; no manifest change. | — |
| Inyange Juice | SOFT DRINKS | `drink-menu` | 3 | Inyange Juice | RWF 700 (`700 (Small) , 1000 (Big)`) | Printed name, price, page and category match the PDF; no manifest change. Printed size/cut prices verified. | — |
| Water | SOFT DRINKS | `drink-menu` | 3 | Water | RWF 1,000 (`1000`) | Printed name, price, page and category match the PDF; no manifest change. | — |
| Pineaple | FRESH JUICE | `drink-menu` | 3 | Pineaple | RWF 3,500 (`3500`) | Printed name, price, page and category match the PDF; no manifest change. | #20 Pineaple spelling |
| Passion | FRESH JUICE | `drink-menu` | 3 | Passion | RWF 3,500 (`3500`) | Printed name, price, page and category match the PDF; no manifest change. | — |
| Mango | FRESH JUICE | `drink-menu` | 3 | Mango | RWF 4,000 (`4000`) | Printed name, price, page and category match the PDF; no manifest change. | — |
| Cocktail Juice | FRESH JUICE | `drink-menu` | 3 | Cocktail Juice | RWF 4,000 (`4000`) | Printed name, price, page and category match the PDF; no manifest change. | — |
| Cloudy Lemonade | MOJITO | `drink-menu` | 3 | Cloudy Lemonade | RWF 4,500 (`4500`) | Printed name, price, page and category match the PDF; no manifest change. | #22 Mojito category |
| Grenadine Mojito | MOJITO | `drink-menu` | 3 | Grenadine Mojito | RWF 5,000 (`5000`) | Printed name, price, page and category match the PDF; no manifest change. | — |
| Blueberry Mojito | MOJITO | `drink-menu` | 3 | Blueberry Mojito | RWF 5,000 (`5000`) | Printed name, price, page and category match the PDF; no manifest change. | — |
| Strawberry Mojito | MOJITO | `drink-menu` | 3 | Strawberry Mojito | RWF 5,000 (`5000`) | Printed name, price, page and category match the PDF; no manifest change. | — |
| Elderflower Lemonade | MOJITO | `drink-menu` | 3 | Elderflower Lemonade | RWF 5,000 (`5000`) | Printed name, price, page and category match the PDF; no manifest change. | #22 Mojito category |
| Deep Sleep | THE RASIPS | `drink-menu` | 3 | Deep Sleep | RWF 2,500 (`2500`) | Printed name, price, page and category match the PDF; no manifest change. | — |
| Healthy gut | THE RASIPS | `drink-menu` | 3 | Healthy gut | RWF 2,500 (`2500`) | Printed name, price, page and category match the PDF; no manifest change. | — |
| Headache Relief | THE RASIPS | `drink-menu` | 3 | Headache Relief | RWF 2,500 (`2500`) | Printed name, price, page and category match the PDF; no manifest change. | — |
| Sinus Care | THE RASIPS | `drink-menu` | 3 | Sinus Care | RWF 2,500 (`2500`) | Printed name, price, page and category match the PDF; no manifest change. | — |
| Clear Skin | THE RASIPS | `drink-menu` | 3 | Clear Skin | RWF 3,000 (`3000`) | Printed name, price, page and category match the PDF; no manifest change. | — |
| Boost Immunity | THE RASIPS | `drink-menu` | 3 | Boost Immunity | RWF 3,000 (`3000`) | Printed name, price, page and category match the PDF; no manifest change. | — |
| Mango and Pineapple | SMOOTHIES | `drink-menu` | 4 | Mango and Pineapple | RWF 5,000 (`5000`) | Printed name, price, page and category match the PDF; no manifest change. | — |
| Chocolate Peanut Butter | SMOOTHIES | `drink-menu` | 4 | Chocolate Peanut Butter | RWF 5,000 (`5000`) | Printed name, price, page and category match the PDF; no manifest change. | — |
| Strawberry and Banana | SMOOTHIES | `drink-menu` | 4 | Strawberry and Banana | RWF 5,000 (`5000`) | Printed name, price, page and category match the PDF; no manifest change. | — |
| Banana Smoothie | SMOOTHIES | `drink-menu` | 4 | Banana Smoothie | RWF 5,000 (`5000`) | Printed name, price, page and category match the PDF; no manifest change. | — |
| Mango Smoothie | SMOOTHIES | `drink-menu` | 4 | Mango Smoothie | RWF 5,000 (`5000`) | Printed name, price, page and category match the PDF; no manifest change. | — |
| Watermelon | SMOOTHIES | `drink-menu` | 4 | Watermelon | RWF 5,000 (`5000`) | Printed name, price, page and category match the PDF; no manifest change. | — |
| Tree Tomato | SMOOTHIES | `drink-menu` | 4 | Tree Tomato | RWF 5,000 (`5000`) | Printed name, price, page and category match the PDF; no manifest change. | — |
| Green Detox | SMOOTHIES | `drink-menu` | 4 | Green Detox | RWF 5,000 (`5000`) | Printed name, price, page and category match the PDF; no manifest change. | — |
| vanilla milkshake | MILKSHAKE | `drink-menu` | 4 | vanilla milkshake | RWF 4,000 (`4000`) | Printed name, price, page and category match the PDF; no manifest change. | — |
| Strawberry milkshake | MILKSHAKE | `drink-menu` | 4 | Strawberry milkshake | RWF 4,000 (`4000`) | Printed name, price, page and category match the PDF; no manifest change. | — |
| Chocolate milkshake | MILKSHAKE | `drink-menu` | 4 | Chocolate milkshake | RWF 4,000 (`4000`) | Printed name, price, page and category match the PDF; no manifest change. | — |
| Nutella milkshake | MILKSHAKE | `drink-menu` | 4 | Nutella milkshake | RWF 4,000 (`4000`) | Printed name, price, page and category match the PDF; no manifest change. | — |
| Mango milkshake | MILKSHAKE | `drink-menu` | 4 | Mango milkshake | RWF 4,000 (`4000`) | Printed name, price, page and category match the PDF; no manifest change. | — |
| Banana milkshake | MILKSHAKE | `drink-menu` | 4 | Banana milkshake | RWF 4,000 (`4000`) | Printed name, price, page and category match the PDF; no manifest change. | — |
| Nutty Banana Shake | MILKSHAKE | `drink-menu` | 4 | Nutty Banana Shake | RWF 4,000 (`4000`) | Printed name, price, page and category match the PDF; no manifest change. | — |

## Size and serving-option findings

| Product | Source PDF | Page | PDF evidence | Modeled result |
| --- | --- | ---: | --- | --- |
| NYAMACOMA GOAT | `food-menu` | 12 | `WHOLE LEG 18K / WHOLE ARM 15K / RIBS 15K` | One product with three printed size/cut prices; base 15,000. |
| WHOLE GRILLED CHICKEN | `food-menu` | 12 | `SERVED WITH FRIES, OR BANANA OR BBQ POTATOES` | Required zero-price Fries/Banana/BBQ Potatoes choice. |
| WHOLE GRILLED RABBIT | `food-menu` | 12 | `SERVED WITH FRIES OR BANANA OR BBQ POTATOES` | Required zero-price Fries/Banana/BBQ Potatoes choice. |
| FABFOoD SANDWICH | `food-menu` | 7 | `Beef or chicken served with fries…` | Required zero-price Beef/Chicken choice. |
| BEEF OR CHICKEN BURGER | `food-menu` | 7 | `BEEF OR CHICKEN BURGER` | Required zero-price Beef/Chicken choice. |
| Boiled chicken/beef/fish with potatoes or banana | `food-menu` | 14 | `potatoes or banana` in each heading and description | Required zero-price Potatoes/Banana choice for each product. |
| GRILLED GREEN BANANA | `food-menu` | 14 | `GRILLED OR FRIED BANANA` | Zero-price Grilled/Fried preparation choice; owner clarification retained. |
| goat/beef fry | `food-menu` | 14 | `goat/beef fry… served with potatoes or banana` | Required zero-price Goat/Beef and Potatoes/Banana choices. |
| Inyange Juice | `drink-menu` | 3 | `700 (Small) , 1000 (Big)` | One product with Small 700 and Big 1,000 size options. |

## Add-on findings

| Add-on | Source PDF | Page | Printed price | Parent(s) | Result |
| --- | --- | ---: | --- | --- | --- |
| With Grilled chicken breast (+3k) | `food-menu` | 5 | `+3k` (RWF 3,000) | avocado-salad | Matches PDF line; parent reference resolves. |
| aDD GRILLED CHICKEN BREAST | `food-menu` | 9 | `3K` (RWF 3,000) | stir-fried-vegetables | Matches PDF line; parent reference resolves. |
| aDD BEEF STRIPS | `food-menu` | 9 | `2.5K` (RWF 2,500) | stir-fried-vegetables | Matches PDF line; parent reference resolves. |
| aDD CHICKEN CUBES | `food-menu` | 9 | `2.5K` (RWF 2,500) | indian-vegetable-curry | Matches PDF line; parent reference resolves. |
| aDD GRILLED BEEF STRIPS | `food-menu` | 9 | `2.5K` (RWF 2,500) | indian-vegetable-curry | Matches PDF line; parent reference resolves. |
| aDD CHICKEN STRIPS | `food-menu` | 9 | `2.5K` (RWF 2,500) | banana-and-peas-stew | Matches PDF line; parent reference resolves. |
| aDD GRILLED BEEF STRIPS | `food-menu` | 9 | `2.5K` (RWF 2,500) | banana-and-peas-stew | Matches PDF line; parent reference resolves. |

## Duplicate and missing-product findings

- `FABFOoD SANDWICH` appears on food PDF p.7 at 8k and p.10 at 10k with different printed descriptions. Both records are supported by the PDF; owner clarification remains open.
- `Vanilla Latte Macchiato` appears in Hot Coffee at 3500 and Iced Coffee at 4000 on drinks PDF p.2. Both records are supported by the PDF; the iced naming question remains open.
- Repeated `aDD …` add-on lines on food PDF p.9 belong to different parent dishes and are not duplicate products.
- No active product is absent from its cited PDF page, and no PDF product line was omitted from the manifest.
- No product was found to be unorderable: all 111 products have a positive price and resolvable category.

## Corrections made

No manifest corrections were made. Every apparent discrepancy is either printed verbatim in the PDF, a documented variant grouping, or an ambiguity requiring owner confirmation. No guessed spelling, ingredient, price, serving option or description was introduced.

| Original value | Corrected value | Source PDF/page | Reason |
| --- | --- | --- | --- |
| — | — | — | No direct-PDF-supported correction identified. |

## Review issue classification

| # | Issue | Affected | Source PDF | Page | PDF evidence | Discrepancy | Classification | PDF-supported correction | Owner question |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `breakfast-price-layout` | CONTINENTAL BREAKFAST / HEALTH BREAKFAST | `food-menu` | 3 | CONTINENTAL BREAKFAST … 8000; HEALTH BREAKFAST … 8000 | Two 8000 prices are printed on a two-column page; layout assigns one to each set. | Resolved with direct source evidence | None needed; both sets are printed at RWF 8,000. | — |
| 2 | `breakfast-choice-lists` | Continental / Health Breakfast | `food-menu` | 3 | Butter, jam, honey (one choice); egg dish of your choice; Sausage (Beef or chicken); JUICE OF THE DAY; tEA OR COFFEE | The PDF names choice groups but does not enumerate every available option. | Partially resolved | None; preserve printed wording and keep option lists empty. | What are the full options behind “one choice”, “of your choice”, “Beef or chicken”, “JUICE OF THE DAY” and “tEA OR COFFEE”? |
| 3 | `crispy-firsh` | CRISPY FIRSH FINGER | `food-menu` | 5 | CRISPY FIRSH FINGER 9k | “FIRSH” appears to be a misspelling of “FISH”. | Requires FAB FOODS clarification | None; retain the printed name. | Should “FIRSH” read “FISH”? |
| 4 | `salad-addon-parent` | Avocado salad / Salad category | `food-menu` | 5 | Avocado salad 3k / With Grilled chicken breast (+3k) | The add-on is printed under Avocado salad, but its intended parent scope is unclear. | Partially resolved | None; keep attached only to Avocado salad. | Should the +3k grilled-chicken add-on apply to all salads or only Avocado salad? |
| 5 | `chicken-ceasar` | CHICKEN CEASAR SALAD | `food-menu` | 5 | CHICKEN CEASAR SALAD 7K | “CEASAR” appears to be a misspelling of “CAESAR”. | Requires FAB FOODS clarification | None; retain the printed name. | Should “CEASAR” read “CAESAR”? |
| 6 | `fabfood-sandwich-duplicate` | FABFOoD SANDWICH (sandwich and pizza pages) | `food-menu` | 7 and 10 | p.7 FABFOoD SANDWICH 8k / Beef or chicken served with fries…; p.10 FABFOoD SANDWICH 10k / Napoletane sauce, beef sausage, pineapple and gouda cheese | The same printed name appears in two categories with different prices and ingredients; the pizza-page name may be a source error. | Requires FAB FOODS clarification | None; keep two records with printed names. | Is the RWF 10,000 FABFOoD SANDWICH on the Pizza Menu a distinct item or a mislabeled pizza? If distinct, what should it be called? |
| 7 | `bbg-steak-pizza` | BBG STEAK PIZZA | `food-menu` | 10 | BBG STEAK PIZZA 10k / Marinated steak, bbq sauce, and Gouda cheese | The heading “BBG” conflicts with the printed description “bbq sauce”. | Requires FAB FOODS clarification | None; retain the printed name. | Should “BBG” read “BBQ”? |
| 8 | `indian-curry-of` | iNDIAN VEGEtABLE CURRY | `food-menu` | 9 | SERVED WITH STEAMED RICE OF KENYAN CHAPATI | “OF” appears to be a typo for “OR”, but no explicit choice is printed. | Requires FAB FOODS clarification | None; preserve printed wording. | Should “OF” read “OR”, and may the guest choose steamed rice or Kenyan chapati? |
| 9 | `nyamacoma-variants` | NYAMACOMA GOAT | `food-menu` | 12 | NYAMACOMA GOAT / WHOLE LEG 18K / WHOLE ARM 15K / RIBS 15K | One heading has three cut/size prices, not three separate product headings. | Resolved with direct source evidence | One product with three printed size options: WHOLE LEG 18,000; WHOLE ARM 15,000; RIBS 15,000. Base price is the lowest printed cut price, 15,000. | — |
| 10 | `whole-grilled-serving` | WHOLE GRILLED CHICKEN / WHOLE GRILLED RABBIT | `food-menu` | 12 | SERVED WITH FRIES, OR BANANA OR BBQ POTATOES / SERVED WITH FRIES OR BANANA OR BBQ POTATOES | Three printed sides have no price difference. | Resolved with direct source evidence | Keep required zero-price serving choices: Fries, Banana, BBQ Potatoes. | — |
| 11 | `chciken-persley` | Boiled chicken / FABFOOD POTATOES | `food-menu` | 14 | chciken, potatoes or banana…; POTATOES, ONIONS, GARLIC PERSLEY AND GRATED CHEESE | “chciken” and “PERSLEY” appear to be misspellings. | Requires FAB FOODS clarification | None; preserve printed descriptions. | Should “chciken” read “chicken” and “PERSLEY” read “PARSLEY”? |
| 12 | `grilled-green-banana` | GRILLED GREEN BANANA | `food-menu` | 14 | 1 PIECE OF GRILLED OR FRIED BANANA SERVED WITH MAYO SIDE SALAD | The name says grilled; the printed description offers grilled or fried. | Partially resolved | Keep printed name and a zero-price Grilled/Fried preparation choice. | Does the fried preparation also refer to green banana? |
| 13 | `goat-beef-fry` | goat/beef fry | `food-menu` | 14 | goat/beef fry 8k / served with potatoes or banana | The slash and description denote protein and side choices with no printed price difference. | Resolved with direct source evidence | Keep required zero-price Goat/Beef and Potatoes/Banana choices. | — |
| 14 | `masedoine` | Masedoine | `food-menu` | 15 | Masedoine 5k | The dessert name has an unusual spelling; dessert placement is supported by the page heading. | Requires FAB FOODS clarification | None; retain the printed name. | What is the intended spelling of “Masedoine”? |
| 15 | `cappucino` | Cappucino / Iced Cappucino | `drink-menu` | 2 | Cappucino 3000; Iced Cappucino 3500 | “Cappucino” appears to be a misspelling of “Cappuccino”. | Requires FAB FOODS clarification | None; retain printed names. | Should “Cappucino” and “Iced Cappucino” read “Cappuccino” and “Iced Cappuccino”? |
| 16 | `flatter-white` | Flatter white | `drink-menu` | 2 | Flatter white 3000 | The printed name likely means “Flat White”. | Requires FAB FOODS clarification | None; retain printed name. | Should “Flatter white” read “Flat White”? |
| 17 | `vanilla-latte-macchiato-duplicate` | Vanilla Latte Macchiato (hot and iced) | `drink-menu` | 2 | Vanilla Latte Macchiato 3500 (Hot Coffee); Vanilla Latte Macchiato 4000 (Iced Coffee) | The same name is printed in two columns at two prices; the iced entry is not labelled iced. | Partially resolved | None; keep two records at their printed prices and categories. | Should the RWF 4,000 entry be named “Iced Vanilla Latte Macchiato”? |
| 18 | `cafe-peach` | Cafe Peach | `drink-menu` | 2 | Iced Coffee column: Cafe Peach 4000 | The name does not say iced although it is printed in the Iced Coffee column. | Partially resolved | None; keep in Iced Coffee with the printed name. | Confirm the intended name and category for “Cafe Peach”. |
| 19 | `peach-elderflower` | Peach & Elderflower | `drink-menu` | 2 | Tea column: Peach & Elderflower 4000 | The printed name does not say tea although it is in the Tea column. | Partially resolved | None; keep in Tea with the printed name. | Confirm that “Peach & Elderflower” is a tea product. |
| 20 | `pineaple` | Pineaple | `drink-menu` | 3 | Pineaple 3500 | “Pineaple” appears to be a misspelling of “Pineapple”. | Requires FAB FOODS clarification | None; retain printed name. | Should “Pineaple” read “Pineapple”? |
| 21 | `inyange-sizes` | Inyange Juice | `drink-menu` | 3 | Inyange Juice 700 (Small) , 1000 (Big) | Two printed sizes are attached to one product heading. | Resolved with direct source evidence | One product with Small 700 and Big 1,000 size options; base price is 700. | — |
| 22 | `mojito-heading` | Cloudy Lemonade / Elderflower Lemonade | `drink-menu` | 3 | M O J I T O / Cloudy Lemonade 4500 … Elderflower Lemonade 5000 | Both lemonades are printed under MOJITO but not named mojitos. | Partially resolved | None; keep under Mojito with printed names. | Confirm whether Cloudy Lemonade and Elderflower Lemonade belong under Mojito or a lemonade category. |
| 23 | `the-rasips` | THE RASIPS category | `drink-menu` | 3 | T H E R A S I P S / Deep Sleep 2500 … Boost Immunity 3000 | The heading is unusual and the PDF gives no descriptions, ingredients or health claims. | Resolved with direct source evidence | None; preserve heading, names, prices, and empty descriptive fields. | — |
| 24 | `drink-descriptions` | All drink products | `drink-menu` | 2–4 | Only product names/prices are printed, except Inyange Juice 700 (Small) , 1000 (Big) | No drink descriptions, ingredients, allergens or sizes except Inyange are printed. | Resolved with direct source evidence | None; leave descriptive fields empty. | — |

## Missing information and owner clarification

The PDFs do not answer the questions in `docs/MENU_OWNER_QUESTIONS.md`. All such products remain `needsReview: true` and `verified: false`. No item was marked verified or publishable by this reconciliation.

## Validation

| Check | Result |
| --- | --- |
| Products accounted for | 111/111 |
| Categories accounted for | 19/19 |
| Add-ons accounted for | 7/7 |
| Name/price/page matches | 111/111 |
| Duplicate product slugs | 0 |
| Duplicate category slugs | 0 |
| Duplicate add-on IDs | 0 |
| Broken category, add-on parent or size/serving option references | 0 |
| Orderable products | 111/111 |
| Accidental deletions | 0 |
| Accidental price changes | 0 |
| Unresolved/partial/clarification issues documented | 24/24 |
| Manifest schema validation | passed (19 categories, 111 products, 7 add-ons, 24 issues) |
| Server/client tests | passed (102 + 54 tests) |
| ESLint | passed |
| Prettier check for new docs | passed |
| Image mappings and review statuses | unchanged |
| MongoDB/Atlas | untouched |
| Menu seed | not executed |

## Safety statement

This was a verification task only. No database connection was made, no seed was run, no `--allow-unverified` or `--reset` flag was used, no product was published, and no menu review safeguard was removed.
