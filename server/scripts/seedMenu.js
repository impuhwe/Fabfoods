import { pathToFileURL } from 'node:url';
import env from '../src/config/env.js';
import { connectToDatabase, disconnectFromDatabase } from '../src/config/db.js';
import MenuCategory from '../src/models/MenuCategory.js';
import MenuItem from '../src/models/MenuItem.js';
import menuPdfManifest from '../src/scripts/data/menu.pdf.manifest.js';
import { buildMenuSeedData } from '../src/services/menuSeed.service.js';

export async function seedMenu({
  allowUnverified = false,
  reset = false,
  manifest = menuPdfManifest,
} = {}) {
  if (!allowUnverified) {
    throw new Error(
      'Refusing to seed unverified menu data. Pass --allow-unverified to acknowledge that every entry is provisional.',
    );
  }

  if (reset && env.isProduction) {
    throw new Error('--reset is not allowed in production');
  }

  const { categories, items, summary } = buildMenuSeedData(manifest);

  if (reset) {
    const existingCategories = await MenuCategory.find({
      slug: { $in: categories.map((category) => category.slug) },
    }).select('_id');

    await MenuItem.deleteMany({
      $or: [
        { slug: { $in: items.map((item) => item.slug) } },
        { category: { $in: existingCategories.map((category) => category._id) } },
      ],
    });
    await MenuCategory.deleteMany({
      _id: { $in: existingCategories.map((category) => category._id) },
    });
  }

  const categoryIds = new Map();
  let categoriesCreated = 0;
  let categoriesExisting = 0;

  for (const category of categories) {
    let stored = await MenuCategory.findOne({ slug: category.slug });

    if (stored) {
      categoriesExisting += 1;
    } else {
      stored = await MenuCategory.create(category);
      categoriesCreated += 1;
    }

    categoryIds.set(category.slug, stored._id);
  }

  let itemsCreated = 0;
  let itemsExisting = 0;

  for (const item of items) {
    const existing = await MenuItem.findOne({ slug: item.slug });
    if (existing) {
      itemsExisting += 1;
      continue;
    }

    const categoryId = categoryIds.get(item.categorySlug);
    if (!categoryId) {
      throw new Error(`Unknown category ${item.categorySlug} for item ${item.slug}`);
    }

    const itemData = { ...item };
    delete itemData.categorySlug;
    await MenuItem.create({ ...itemData, category: categoryId });
    itemsCreated += 1;
  }

  return {
    ...summary,
    categoriesCreated,
    categoriesExisting,
    itemsCreated,
    itemsExisting,
  };
}

function parseArgs(argv) {
  return {
    allowUnverified: argv.includes('--allow-unverified'),
    reset: argv.includes('--reset'),
  };
}

function fail(message) {
  console.error(`Menu seed failed: ${message}`);
  process.exitCode = 1;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (!options.allowUnverified) {
    fail('pass --allow-unverified to acknowledge that every menu entry is provisional');
    return;
  }

  await connectToDatabase();
  const summary = await seedMenu(options);

  console.warn(
    'PDF-transcribed menu data: every seeded entry has needsReview=true and verified=false. Business review is still required.',
  );
  console.log(
    [
      `Menu seed complete: ${summary.productRecords} product records from ${summary.pricedLines} priced lines.`,
      `${summary.distinctProductNames} distinct product names; ${summary.sourceAddonLines} add-on lines; ${summary.modeledRecords} modeled records.`,
      `Categories created: ${summary.categoriesCreated}; existing: ${summary.categoriesExisting}.`,
      `Items created: ${summary.itemsCreated}; existing: ${summary.itemsExisting}.`,
    ].join('\n'),
  );
}

const invokedDirectly = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (invokedDirectly) {
  main()
    .catch((error) => {
      fail(error instanceof Error ? error.message : 'unexpected error');
    })
    .finally(async () => {
      await disconnectFromDatabase().catch(() => {});
    });
}
