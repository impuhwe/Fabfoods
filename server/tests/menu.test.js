import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import MenuCategory from '../src/models/MenuCategory.js';
import MenuItem from '../src/models/MenuItem.js';
import menuPdfManifest from '../src/scripts/data/menu.pdf.manifest.js';
import { buildMenuSeedData } from '../src/services/menuSeed.service.js';
import {
  getMenuOptions,
  MenuPricingError,
  resolveMenuItemPrice,
} from '../src/services/menuPricing.service.js';
import { validateMenuManifest } from '../src/validators/menu.validator.js';
import { seedMenu } from '../scripts/seedMenu.js';
import { clearDatabase, startTestDatabase, stopTestDatabase } from './helpers/db.js';

beforeAll(async () => {
  await startTestDatabase();
  await MenuCategory.init();
  await MenuItem.init();
});

afterAll(async () => {
  await stopTestDatabase();
});

afterEach(async () => {
  await clearDatabase();
});

describe('PDF menu manifest', () => {
  it('reconciles 121 priced lines into 118 modeled records', () => {
    const data = buildMenuSeedData(menuPdfManifest);

    expect(data.summary).toMatchObject({
      sourceDocuments: 2,
      categories: 19,
      products: 111,
      productRecords: 111,
      distinctProductNames: 109,
      sourceAddonLines: 7,
      pricedAddonOptions: 7,
      itemsWithAddonGroups: 4,
      itemsWithSizeOptions: 2,
      itemsWithServingOptions: 9,
      itemsWithIncludedItems: 2,
      sizeOptions: 5,
      servingOptions: 22,
      includedItems: 14,
      pricedLines: 121,
      modeledRecords: 118,
      reviewFlags: 24,
    });

    expect(menuPdfManifest.counts.combined).toMatchObject({
      pricedLines: 121,
      productPricedLines: 114,
      addonLines: 7,
      productRecords: 111,
      addonRecords: 7,
      modeledRecords: 118,
      distinctProductNames: 109,
    });
  });

  it('preserves PDF names, prices, sources and review flags', () => {
    const data = buildMenuSeedData(menuPdfManifest);
    const pizzaSandwich = data.items.find((item) => item.slug === 'fabfood-sandwich-pizza');
    const sandwich = data.items.find((item) => item.slug === 'fabfood-sandwich');
    const masedoine = data.items.find((item) => item.slug === 'masedoine');
    const cappucino = data.items.find((item) => item.slug === 'cappucino');
    const stirFry = data.items.find((item) => item.slug === 'stir-fried-vegetables');
    const inyange = data.items.find((item) => item.slug === 'inyange-juice');

    expect(pizzaSandwich).toMatchObject({
      name: 'FABFOoD SANDWICH',
      price: 10000,
      sourcePage: 10,
    });
    expect(sandwich).toMatchObject({
      name: 'FABFOoD SANDWICH',
      price: 8000,
      sourcePage: 7,
    });
    expect(masedoine).toMatchObject({ name: 'Masedoine', price: 5000, sourcePage: 15 });
    expect(cappucino).toMatchObject({ name: 'Cappucino', price: 3000, sourcePage: 2 });
    expect(stirFry.description).toBe('JULlIENE OF VEGETABLES SERVED WITH STEAMED RICE.');
    expect(inyange.description).toBe('');

    for (const item of data.items) {
      expect(item.needsReview).toBe(true);
      expect(item.verified).toBe(false);
      expect(item.dataSource).toBe('pdf');
      expect(item.sourceRef).toMatch(/^FAB_FOODS_.*_MENU\.pdf$/);
      expect(item.sourcePage).toBeGreaterThan(0);
      expect(item.ingredients).toEqual([]);
      expect(item.allergens).toEqual([]);
    }

    expect(menuPdfManifest.reviewList).toHaveLength(24);
  });

  it('keeps duplicate printed names as separate records with unique slugs', () => {
    const data = buildMenuSeedData(menuPdfManifest);
    const foodDuplicates = data.items.filter((item) => item.name === 'FABFOoD SANDWICH');
    const drinkDuplicates = data.items.filter((item) => item.name === 'Vanilla Latte Macchiato');

    expect(foodDuplicates).toHaveLength(2);
    expect(new Set(foodDuplicates.map((item) => item.slug)).size).toBe(2);
    expect(drinkDuplicates).toHaveLength(2);
    expect(new Set(drinkDuplicates.map((item) => item.slug)).size).toBe(2);
  });

  it('stores breakfast included items exactly without creating charges', () => {
    const data = buildMenuSeedData(menuPdfManifest);
    const continental = data.items.find((item) => item.slug === 'continental-breakfast');

    expect(continental.price).toBe(8000);
    expect(continental.includedItems).toEqual([
      'ASSORTED BREAD (OATS, SESAME, AND SALTED BREAD)',
      'Butter, jam, honey (one choice)',
      'english cake',
      'Cheese and cold cuts (one choice)',
      'egg dish of your choice',
      'grilled tomatoes',
      'Sausage (Beef or chicken)',
    ]);
    expect(continental.sizeOptions).toEqual([]);
    expect(continental.servingOptions).toEqual([]);
    expect(continental.addonGroups).toEqual([]);
    expect(resolveMenuItemPrice(continental).unitPrice).toBe(8000);
  });

  it('keeps Inyange sizes and all three Nyamacoma cut prices distinct', () => {
    const data = buildMenuSeedData(menuPdfManifest);
    const inyange = data.items.find((item) => item.slug === 'inyange-juice');
    const nyamacoma = data.items.find((item) => item.slug === 'nyamacoma-goat');

    expect(inyange.price).toBe(700);
    expect(inyange.sizeOptions.map((option) => [option.label, option.price])).toEqual([
      ['Small', 700],
      ['Big', 1000],
    ]);
    expect(inyange.sizeOptions.filter((option) => option.isDefault)).toHaveLength(1);

    expect(nyamacoma.price).toBe(15000);
    expect(nyamacoma.sizeOptions.map((option) => [option.label, option.price])).toEqual([
      ['WHOLE LEG', 18000],
      ['WHOLE ARM', 15000],
      ['RIBS', 15000],
    ]);
    expect(nyamacoma.sizeOptions.filter((option) => option.isDefault)).toHaveLength(1);
    expect(nyamacoma.sizeOptions.find((option) => option.isDefault).label).toBe('WHOLE ARM');
  });

  it('keeps serving choices separate from paid add-ons', () => {
    const data = buildMenuSeedData(menuPdfManifest);
    const chicken = data.items.find((item) => item.slug === 'whole-grilled-chicken');
    const stirFry = data.items.find((item) => item.slug === 'stir-fried-vegetables');

    expect(chicken.servingOptions[0]).toMatchObject({
      name: 'Served with',
      selectionType: 'single',
      isRequired: true,
      maxSelections: 1,
    });
    expect(
      chicken.servingOptions[0].options.map((option) => [option.name, option.priceDelta]),
    ).toEqual([
      ['Fries', 0],
      ['Banana', 0],
      ['BBQ Potatoes', 0],
    ]);
    expect(chicken.addonGroups).toEqual([]);

    expect(stirFry.servingOptions).toEqual([]);
    expect(stirFry.addonGroups[0].options.map((option) => [option.name, option.price])).toEqual([
      ['aDD GRILLED CHICKEN BREAST', 3000],
      ['aDD BEEF STRIPS', 2500],
    ]);
  });

  it('attaches the salad add-on only to avocado salad pending confirmation', () => {
    const data = buildMenuSeedData(menuPdfManifest);
    const avocado = data.items.find((item) => item.slug === 'avocado-salad');
    const caesar = data.items.find((item) => item.slug === 'chicken-caesar-salad');

    expect(avocado.addonGroups[0].options.map((option) => [option.name, option.price])).toEqual([
      ['With Grilled chicken breast (+3k)', 3000],
    ]);
    expect(caesar.addonGroups).toEqual([]);
  });

  it('rejects an invalid manifest count', () => {
    const invalid = JSON.parse(JSON.stringify(menuPdfManifest));
    invalid.products = invalid.products.slice(0, 110);

    expect(() => validateMenuManifest(invalid)).toThrow(/Invalid menu manifest/);
  });

  it('rejects an add-on with an unknown parent', () => {
    const invalid = JSON.parse(JSON.stringify(menuPdfManifest));
    invalid.addons[0].parentSlugs = ['missing-parent'];

    expect(() => validateMenuManifest(invalid)).toThrow(/Unknown add-on parent/);
  });

  it('rejects duplicate size labels and a price that is not the lowest size price', () => {
    const duplicate = JSON.parse(JSON.stringify(menuPdfManifest));
    duplicate.products.find((product) => product.slug === 'inyange-juice').sizeOptions[1].label =
      'Small';
    expect(() => validateMenuManifest(duplicate)).toThrow(/Size option labels must be unique/);

    const mismatch = JSON.parse(JSON.stringify(menuPdfManifest));
    mismatch.products.find((product) => product.slug === 'inyange-juice').price = 999;
    expect(() => validateMenuManifest(mismatch)).toThrow(/lowest size option/);
  });

  it('rejects an unjustified serving price adjustment and duplicate add-on ids', () => {
    const serving = JSON.parse(JSON.stringify(menuPdfManifest));
    serving.products.find(
      (product) => product.slug === 'whole-grilled-chicken',
    ).servingOptions[0].options[0].priceDelta = 500;
    expect(() => validateMenuManifest(serving)).toThrow(/justification note/);

    const addon = JSON.parse(JSON.stringify(menuPdfManifest));
    addon.addons[1].id = addon.addons[0].id;
    expect(() => validateMenuManifest(addon)).toThrow(/Duplicate add-on id/);
  });
});

describe('menu seeding', () => {
  it('requires an explicit unverified-data acknowledgement', async () => {
    await expect(seedMenu()).rejects.toThrow(/Refusing to seed unverified menu data/);
  });

  it('seeds every category and product and is idempotent', async () => {
    const first = await seedMenu({ allowUnverified: true });

    expect(first).toMatchObject({
      categories: 19,
      productRecords: 111,
      pricedLines: 121,
      sourceAddonLines: 7,
      modeledRecords: 118,
      categoriesCreated: 19,
      itemsCreated: 111,
    });
    expect(await MenuCategory.countDocuments()).toBe(19);
    expect(await MenuItem.countDocuments()).toBe(111);

    const second = await seedMenu({ allowUnverified: true });

    expect(second.itemsCreated).toBe(0);
    expect(second.itemsExisting).toBe(111);
    expect(second.categoriesCreated).toBe(0);
    expect(second.categoriesExisting).toBe(19);
    expect(await MenuCategory.countDocuments()).toBe(19);
    expect(await MenuItem.countDocuments()).toBe(111);
  });

  it('preserves admin edits to names, size options and serving options when reseeding', async () => {
    await seedMenu({ allowUnverified: true });

    const inyange = await MenuItem.findOne({ slug: 'inyange-juice' });
    inyange.name = 'Admin Inyange';
    inyange.needsReview = false;
    inyange.verified = true;
    inyange.sizeOptions[1].price = 1200;
    inyange.sizeOptions[1].priceText = '1200 (Big)';
    await inyange.save();

    const chicken = await MenuItem.findOne({ slug: 'whole-grilled-chicken' });
    chicken.servingOptions[0].options[0].name = 'Admin Fries';
    await chicken.save();

    await seedMenu({ allowUnverified: true });

    const afterInyange = await MenuItem.findOne({ slug: 'inyange-juice' });
    expect(afterInyange.name).toBe('Admin Inyange');
    expect(afterInyange.needsReview).toBe(false);
    expect(afterInyange.verified).toBe(true);
    expect(afterInyange.sizeOptions[1].price).toBe(1200);

    const afterChicken = await MenuItem.findOne({ slug: 'whole-grilled-chicken' });
    expect(afterChicken.servingOptions[0].options[0].name).toBe('Admin Fries');
  });

  it('creates PDF category relationships and provisional flags', async () => {
    await seedMenu({ allowUnverified: true });

    const categories = await MenuCategory.find().sort({ displayOrder: 1 });
    expect(categories).toHaveLength(19);
    expect(categories.map((category) => category.slug)).toEqual([
      'breakfast',
      'appetizers-starters',
      'soup-of-the-day',
      'salads',
      'sandwiches-burgers',
      'land-and-sea',
      'pizza',
      'grill-corner',
      'special-food-corner',
      'desserts',
      'hot-coffee',
      'iced-coffee',
      'tea',
      'soft-drinks',
      'fresh-juice',
      'mojito',
      'the-rasips',
      'smoothies',
      'milkshake',
    ]);

    const breakfast = categories.find((category) => category.slug === 'breakfast');
    const hotCoffee = categories.find((category) => category.slug === 'hot-coffee');
    expect(await MenuItem.countDocuments({ category: breakfast._id })).toBe(2);
    expect(await MenuItem.countDocuments({ category: hotCoffee._id })).toBe(12);

    const items = await MenuItem.find();
    for (const item of items) {
      expect(item.needsReview).toBe(true);
      expect(item.verified).toBe(false);
      expect(item.dataSource).toBe('pdf');
      expect(item.sourcePage).toBeGreaterThan(0);
      expect(item.ingredients).toEqual([]);
      expect(item.allergens).toEqual([]);
    }
  });

  it('enforces integer prices, unique slugs and option integrity in the model', async () => {
    const category = await MenuCategory.create({
      name: 'Test Category',
      slug: 'test-category',
    });

    await expect(
      MenuItem.create({
        name: 'Bad Price',
        slug: 'bad-price',
        category: category._id,
        price: 100.5,
      }),
    ).rejects.toThrow(/integer amount in RWF/);

    await MenuItem.create({
      name: 'First Item',
      slug: 'duplicate-slug',
      category: category._id,
      price: 1000,
    });

    await expect(
      MenuItem.create({
        name: 'Second Item',
        slug: 'duplicate-slug',
        category: category._id,
        price: 2000,
      }),
    ).rejects.toThrow();

    await expect(
      MenuItem.create({
        name: 'Bad Size Price',
        slug: 'bad-size-price',
        category: category._id,
        price: 700,
        sizeOptions: [{ label: 'Small', price: 700.5, isDefault: true }],
      }),
    ).rejects.toThrow(/integer amount in RWF/);

    await expect(
      MenuItem.create({
        name: 'Size Price Mismatch',
        slug: 'size-price-mismatch',
        category: category._id,
        price: 1000,
        sizeOptions: [{ label: 'Small', price: 700, isDefault: true }],
      }),
    ).rejects.toThrow(/lowest size option/);

    await expect(
      MenuItem.create({
        name: 'Duplicate Size Labels',
        slug: 'duplicate-size-labels',
        category: category._id,
        price: 700,
        sizeOptions: [
          { label: 'Small', price: 700, isDefault: true },
          { label: 'small', price: 1000 },
        ],
      }),
    ).rejects.toThrow(/unique/);

    await expect(
      MenuItem.create({
        name: 'Unjustified Serving Delta',
        slug: 'unjustified-serving-delta',
        category: category._id,
        price: 1000,
        servingOptions: [
          {
            name: 'Served with',
            selectionType: 'single',
            isRequired: true,
            maxSelections: 1,
            options: [{ name: 'Fries', priceDelta: 500, isDefault: true }],
          },
        ],
      }),
    ).rejects.toThrow(/priceDeltaNote/);

    await expect(
      MenuItem.create({
        name: 'Duplicate Serving Names',
        slug: 'duplicate-serving-names',
        category: category._id,
        price: 1000,
        servingOptions: [
          {
            name: 'Served with',
            selectionType: 'single',
            isRequired: true,
            maxSelections: 1,
            options: [{ name: 'Fries', isDefault: true }, { name: 'fries' }],
          },
        ],
      }),
    ).rejects.toThrow(/unique/);

    await expect(
      MenuItem.create({
        name: 'Missing Serving Default',
        slug: 'missing-serving-default',
        category: category._id,
        price: 1000,
        servingOptions: [
          {
            name: 'Served with',
            selectionType: 'single',
            isRequired: true,
            maxSelections: 1,
            options: [{ name: 'Fries' }, { name: 'Banana' }],
          },
        ],
      }),
    ).rejects.toThrow(/exactly one default/);

    const plainItem = await MenuItem.create({
      name: 'Plain Item',
      slug: 'plain-item',
      category: category._id,
      price: 1000,
    });
    expect(plainItem.sizeOptions).toEqual([]);
    expect(plainItem.servingOptions).toEqual([]);
    expect(plainItem.addonGroups).toEqual([]);
  });
});

describe('server-side menu option pricing', () => {
  const data = buildMenuSeedData(menuPdfManifest);
  const inyange = data.items.find((item) => item.slug === 'inyange-juice');
  const nyamacoma = data.items.find((item) => item.slug === 'nyamacoma-goat');
  const chicken = data.items.find((item) => item.slug === 'whole-grilled-chicken');
  const stirFry = data.items.find((item) => item.slug === 'stir-fried-vegetables');
  const fries = data.items.find((item) => item.slug === 'french-fries');

  it('uses the selected size price and ignores a client-supplied price', () => {
    const small = resolveMenuItemPrice(inyange, { sizeLabel: 'Small', price: 1 });
    const big = resolveMenuItemPrice(inyange, { sizeLabel: 'Big', price: 1 });

    expect(small).toMatchObject({ unitPrice: 700, basePrice: 700, sizeLabel: 'Small' });
    expect(big).toMatchObject({ unitPrice: 1000, basePrice: 1000, sizeLabel: 'Big' });
  });

  it('requires a valid size for items with size options', () => {
    expect(() => resolveMenuItemPrice(inyange)).toThrow(/size selection is required/);
    expect(() => resolveMenuItemPrice(inyange, { sizeLabel: 'Medium' })).toThrow(
      /Unknown or unavailable size/,
    );
  });

  it('prices Nyamacoma cuts distinctly', () => {
    expect(resolveMenuItemPrice(nyamacoma, { sizeLabel: 'WHOLE LEG' }).unitPrice).toBe(18000);
    expect(resolveMenuItemPrice(nyamacoma, { sizeLabel: 'WHOLE ARM' }).unitPrice).toBe(15000);
    expect(resolveMenuItemPrice(nyamacoma, { sizeLabel: 'RIBS' }).unitPrice).toBe(15000);
  });

  it('applies zero-price serving choices without changing the price', () => {
    const defaultChoice = resolveMenuItemPrice(chicken);
    const banana = resolveMenuItemPrice(chicken, {
      servingSelections: [{ groupName: 'Served with', optionName: 'Banana' }],
    });

    expect(defaultChoice.unitPrice).toBe(18000);
    expect(defaultChoice.selections.serving[0].optionName).toBe('Fries');
    expect(banana.unitPrice).toBe(18000);
    expect(banana.servingPriceDelta).toBe(0);
    expect(banana.selections.serving[0].optionName).toBe('Banana');
  });

  it('adds paid add-ons and rejects unknown selections', () => {
    const result = resolveMenuItemPrice(stirFry, {
      addonSelections: [{ groupName: 'Add-ons', optionName: 'aDD GRILLED CHICKEN BREAST' }],
    });

    expect(result.unitPrice).toBe(8000);
    expect(result.addonPrice).toBe(3000);
    expect(result.selections.addons).toHaveLength(1);
    expect(() =>
      resolveMenuItemPrice(stirFry, {
        addonSelections: [{ groupName: 'Add-ons', optionName: 'Missing add-on' }],
      }),
    ).toThrow(MenuPricingError);
  });

  it('prices products without options correctly', () => {
    expect(resolveMenuItemPrice(fries).unitPrice).toBe(4000);
  });

  it('returns options in a consistent structure', () => {
    const options = getMenuOptions(inyange);

    expect(Object.keys(options)).toEqual([
      'includedItems',
      'sizeOptions',
      'servingOptions',
      'addonGroups',
    ]);
    expect(options.sizeOptions.map((option) => option.label)).toEqual(['Small', 'Big']);
    expect(options.servingOptions).toEqual([]);
    expect(options.addonGroups).toEqual([]);
  });
});
