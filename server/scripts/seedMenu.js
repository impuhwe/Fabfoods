import { pathToFileURL } from 'node:url';
import { connectToDatabase, disconnectFromDatabase } from '../src/config/db.js';
import MenuCategory from '../src/models/MenuCategory.js';
import MenuItem from '../src/models/MenuItem.js';
import menuPdfManifest from '../src/scripts/data/menu.pdf.manifest.js';
import { syncBlockingFlags, upsertReviewIssues } from '../src/services/menuReview.service.js';
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

  if (reset) {
    throw new Error('--reset is no longer supported; seed only adds missing records');
  }

  const { categories, items, reviewIssues, summary } = buildMenuSeedData(manifest);

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

  await upsertReviewIssues(reviewIssues);
  const itemsWithUnresolvedIssues = await syncBlockingFlags();

  return {
    ...summary,
    categoriesCreated,
    categoriesExisting,
    itemsCreated,
    itemsExisting,
    itemsWithUnresolvedIssues,
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
    'PDF-transcribed menu data: every seeded entry has needsReview=true, verified=false, isAvailable=false, and unresolved review issues. Staff review is required before publishing.',
  );
  console.log(
    [
      `Menu seed complete: ${summary.productRecords} product records from ${summary.pricedLines} priced lines.`,
      `${summary.distinctProductNames} distinct product names; ${summary.sourceAddonLines} add-on lines; ${summary.modeledRecords} modeled records.`,
      `Categories created: ${summary.categoriesCreated}; existing: ${summary.categoriesExisting}.`,
      `Items created: ${summary.itemsCreated}; existing: ${summary.itemsExisting}.`,
      `Review issues: ${summary.reviewIssues}; items with unresolved blocking issues: ${summary.itemsWithUnresolvedIssues}.`,
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
