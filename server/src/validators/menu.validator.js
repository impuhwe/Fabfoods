import { z } from 'zod';

export const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Must be lowercase kebab-case');

export const priceSchema = z.number().int('Price must be an integer amount in RWF').min(0);
const countSchema = z.number().int().min(0);
const sourcePdfSchema = z.enum(['food-menu', 'drink-menu']);
export const reviewStatusSchema = z.enum(['needs-review', 'spelling', 'ambiguous']);

const sourceDocumentSchema = z
  .object({
    id: sourcePdfSchema,
    file: z.string().trim().min(1).max(240),
    pages: z.number().int().min(1),
    sha256: z
      .string()
      .trim()
      .regex(/^[a-f0-9]{64}$/i, 'Must be a SHA256 hex digest'),
  })
  .strict();

const includedItemSchema = z.string().trim().min(1).max(160);

export const sizeOptionSchema = z
  .object({
    label: z.string().trim().min(1).max(60),
    price: priceSchema,
    priceText: z.string().trim().max(40).default(''),
    isDefault: z.boolean().default(false),
    isAvailable: z.boolean().default(true),
    displayOrder: z.number().int().min(0).default(0),
  })
  .strict();

const addonOptionSchema = z
  .object({
    name: z.string().trim().min(1).max(90),
    price: priceSchema,
    isDefault: z.boolean().default(false),
    isAvailable: z.boolean().default(true),
    displayOrder: z.number().int().min(0).default(0),
  })
  .strict();

export const addonGroupSchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    selectionType: z.enum(['single', 'multiple']).default('single'),
    isRequired: z.boolean().default(false),
    maxSelections: z.number().int().min(1).default(1),
    displayOrder: z.number().int().min(0).default(0),
    options: z.array(addonOptionSchema).min(1),
  })
  .strict()
  .superRefine((group, ctx) => {
    if (group.selectionType === 'single' && group.maxSelections !== 1) {
      ctx.addIssue({
        code: 'custom',
        path: ['maxSelections'],
        message: 'Single-choice groups must allow exactly one selection',
      });
    }

    if (group.maxSelections > group.options.length) {
      ctx.addIssue({
        code: 'custom',
        path: ['maxSelections'],
        message: 'maxSelections cannot exceed the number of options',
      });
    }

    const names = group.options.map((option) => option.name.trim().toLowerCase());
    if (new Set(names).size !== names.length) {
      ctx.addIssue({
        code: 'custom',
        path: ['options'],
        message: 'Add-on option names must be unique within a group',
      });
    }
  });

const servingOptionSchema = z
  .object({
    name: z.string().trim().min(1).max(90),
    priceDelta: priceSchema.default(0),
    priceDeltaNote: z.string().trim().max(240).default(''),
    isDefault: z.boolean().default(false),
    isAvailable: z.boolean().default(true),
    displayOrder: z.number().int().min(0).default(0),
  })
  .strict()
  .superRefine((option, ctx) => {
    if (option.priceDelta > 0 && !option.priceDeltaNote) {
      ctx.addIssue({
        code: 'custom',
        path: ['priceDeltaNote'],
        message: 'A positive serving price adjustment requires a justification note',
      });
    }
  });

export const servingGroupSchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    selectionType: z.enum(['single', 'multiple']).default('single'),
    isRequired: z.boolean().default(false),
    maxSelections: z.number().int().min(1).default(1),
    displayOrder: z.number().int().min(0).default(0),
    options: z.array(servingOptionSchema).min(1),
  })
  .strict()
  .superRefine((group, ctx) => {
    if (group.selectionType === 'single' && group.maxSelections !== 1) {
      ctx.addIssue({
        code: 'custom',
        path: ['maxSelections'],
        message: 'Single-choice groups must allow exactly one selection',
      });
    }

    if (group.maxSelections > group.options.length) {
      ctx.addIssue({
        code: 'custom',
        path: ['maxSelections'],
        message: 'maxSelections cannot exceed the number of options',
      });
    }

    const names = group.options.map((option) => option.name.trim().toLowerCase());
    if (new Set(names).size !== names.length) {
      ctx.addIssue({
        code: 'custom',
        path: ['options'],
        message: 'Serving option names must be unique within a group',
      });
    }

    const defaults = group.options.filter((option) => option.isDefault).length;
    if (defaults > 1) {
      ctx.addIssue({
        code: 'custom',
        path: ['options'],
        message: 'Serving option groups may have at most one default',
      });
    }

    if (group.isRequired && group.selectionType === 'single' && defaults !== 1) {
      ctx.addIssue({
        code: 'custom',
        path: ['options'],
        message: 'Required single-choice serving groups need exactly one default',
      });
    }
  });

const menuCategorySchema = z
  .object({
    sourcePdf: sourcePdfSchema,
    sourcePage: z.number().int().min(1),
    name: z.string().trim().min(2).max(60),
    printedName: z.string().trim().min(2).max(60),
    slug: slugSchema,
    description: z.string().trim().max(240).default(''),
    kind: z.enum(['food', 'drink', 'dessert']).default('food'),
    displayOrder: z.number().int().min(0).default(0),
  })
  .strict();

const productSchema = z
  .object({
    type: z.literal('product'),
    sourcePdf: sourcePdfSchema,
    sourcePage: z.number().int().min(1),
    categorySlug: slugSchema,
    displayOrder: z.number().int().min(0).default(0),
    name: z.string().trim().min(2).max(90),
    slug: slugSchema,
    price: priceSchema,
    priceText: z.string().trim().max(40).default(''),
    currency: z.literal('RWF').default('RWF'),
    description: z.string().trim().max(600).default(''),
    includedItems: z.array(includedItemSchema).default([]),
    sizeOptions: z.array(sizeOptionSchema).default([]),
    servingOptions: z.array(servingGroupSchema).default([]),
    addonGroups: z.array(addonGroupSchema).default([]),
    needsReview: z.boolean().default(true),
    verified: z.boolean().default(false),
    dataSource: z.literal('pdf').default('pdf'),
    sourceRef: z.string().trim().min(1).max(200),
    reviewStatus: reviewStatusSchema.default('needs-review'),
    reviewTags: z.array(z.string().trim().min(1).max(40)).default([]),
    reviewNotes: z.array(z.string().trim().min(1).max(500)).default([]),
  })
  .strict()
  .superRefine((product, ctx) => {
    if (product.sizeOptions.length > 0) {
      const labels = product.sizeOptions.map((option) => option.label.trim().toLowerCase());
      if (new Set(labels).size !== labels.length) {
        ctx.addIssue({
          code: 'custom',
          path: ['sizeOptions'],
          message: 'Size option labels must be unique',
        });
      }

      const defaults = product.sizeOptions.filter((option) => option.isDefault).length;
      if (defaults !== 1) {
        ctx.addIssue({
          code: 'custom',
          path: ['sizeOptions'],
          message: 'Size options must have exactly one default when present',
        });
      }

      const lowestPrice = Math.min(...product.sizeOptions.map((option) => option.price));
      if (product.price !== lowestPrice) {
        ctx.addIssue({
          code: 'custom',
          path: ['price'],
          message: 'Price must equal the lowest size option when sizeOptions are present',
        });
      }
    }

    const groupNames = product.servingOptions.map((group) => group.name.trim().toLowerCase());
    if (new Set(groupNames).size !== groupNames.length) {
      ctx.addIssue({
        code: 'custom',
        path: ['servingOptions'],
        message: 'Serving option group names must be unique',
      });
    }
  });

const addonLineSchema = z
  .object({
    type: z.literal('addon'),
    sourcePdf: sourcePdfSchema,
    sourcePage: z.number().int().min(1),
    categorySlug: slugSchema,
    displayOrder: z.number().int().min(0).default(0),
    id: z.string().trim().min(1).max(120),
    name: z.string().trim().min(1).max(90),
    displayName: z.string().trim().min(1).max(90),
    price: priceSchema,
    priceText: z.string().trim().max(40).default(''),
    parentSlugs: z.array(slugSchema).min(1),
    groupName: z.string().trim().min(1).max(80).default('Add-ons'),
    selectionType: z.enum(['single', 'multiple']).default('single'),
    isRequired: z.boolean().default(false),
    maxSelections: z.number().int().min(1).default(1),
    needsReview: z.boolean().default(true),
    verified: z.boolean().default(false),
    dataSource: z.literal('pdf').default('pdf'),
    sourceRef: z.string().trim().min(1).max(200),
    reviewStatus: reviewStatusSchema.default('needs-review'),
    reviewTags: z.array(z.string().trim().min(1).max(40)).default([]),
    reviewNotes: z.array(z.string().trim().min(1).max(500)).default([]),
  })
  .strict()
  .superRefine((line, ctx) => {
    if (new Set(line.parentSlugs).size !== line.parentSlugs.length) {
      ctx.addIssue({
        code: 'custom',
        path: ['parentSlugs'],
        message: 'parentSlugs must not contain duplicates',
      });
    }

    if (line.selectionType === 'single' && line.maxSelections !== 1) {
      ctx.addIssue({
        code: 'custom',
        path: ['maxSelections'],
        message: 'Single-choice add-on groups must allow exactly one selection',
      });
    }
  });

const reviewItemSchema = z
  .object({
    id: z.string().trim().min(1).max(120),
    sourcePdf: sourcePdfSchema,
    sourcePage: z.number().int().min(1),
    item: z.string().trim().min(1).max(120),
    issue: z.string().trim().min(1).max(500),
    handling: z.string().trim().min(1).max(500),
  })
  .strict();

const countBlockSchema = z
  .object({
    pricedLines: countSchema,
    productPricedLines: countSchema,
    addonLines: countSchema,
    productRecords: countSchema,
    modeledRecords: countSchema,
    distinctProductNames: countSchema,
    distinctAddonNames: countSchema,
  })
  .strict();

const combinedCountsSchema = z
  .object({
    pricedLines: countSchema,
    productPricedLines: countSchema,
    addonLines: countSchema,
    productRecords: countSchema,
    addonRecords: countSchema,
    modeledRecords: countSchema,
    distinctProductNames: countSchema,
  })
  .strict();

const countsSchema = z
  .object({
    sourceDocuments: countSchema,
    categories: countSchema,
    food: countBlockSchema,
    drink: countBlockSchema,
    combined: combinedCountsSchema,
  })
  .strict();

const menuPdfManifestSchema = z
  .object({
    version: z.string().trim().min(1).max(80),
    status: z.string().trim().min(1).max(120),
    provisionalEntryCount: z.literal(55),
    sourceDocuments: z.array(sourceDocumentSchema).length(2),
    categories: z.array(menuCategorySchema).length(19),
    products: z.array(productSchema).length(111),
    addons: z.array(addonLineSchema).length(7),
    reviewList: z.array(reviewItemSchema).length(24),
    counts: countsSchema,
  })
  .strict()
  .superRefine((manifest, ctx) => {
    const categorySlugs = new Set();
    const categoryNames = new Set();
    for (const [index, category] of manifest.categories.entries()) {
      if (categorySlugs.has(category.slug)) {
        ctx.addIssue({
          code: 'custom',
          path: ['categories', index, 'slug'],
          message: 'Duplicate category slug',
        });
      }
      if (categoryNames.has(category.name)) {
        ctx.addIssue({
          code: 'custom',
          path: ['categories', index, 'name'],
          message: 'Duplicate category name',
        });
      }
      categorySlugs.add(category.slug);
      categoryNames.add(category.name);
    }

    const sourceDocumentIds = new Set();
    for (const [index, sourceDocument] of manifest.sourceDocuments.entries()) {
      if (sourceDocumentIds.has(sourceDocument.id)) {
        ctx.addIssue({
          code: 'custom',
          path: ['sourceDocuments', index, 'id'],
          message: 'Duplicate source document id',
        });
      }
      sourceDocumentIds.add(sourceDocument.id);
    }

    const productSlugs = new Set();
    const productsBySlug = new Map();
    for (const [index, product] of manifest.products.entries()) {
      if (productSlugs.has(product.slug)) {
        ctx.addIssue({
          code: 'custom',
          path: ['products', index, 'slug'],
          message: 'Duplicate product slug',
        });
      }
      if (!categorySlugs.has(product.categorySlug)) {
        ctx.addIssue({
          code: 'custom',
          path: ['products', index, 'categorySlug'],
          message: 'Product references an unknown category',
        });
      }
      productSlugs.add(product.slug);
      productsBySlug.set(product.slug, product);
    }

    const addonIds = new Set();
    const addonNamesByParent = new Map();
    for (const [index, addon] of manifest.addons.entries()) {
      if (addonIds.has(addon.id)) {
        ctx.addIssue({
          code: 'custom',
          path: ['addons', index, 'id'],
          message: 'Duplicate add-on id',
        });
      }
      addonIds.add(addon.id);

      if (!categorySlugs.has(addon.categorySlug)) {
        ctx.addIssue({
          code: 'custom',
          path: ['addons', index, 'categorySlug'],
          message: 'Add-on references an unknown category',
        });
      }

      for (const parentSlug of addon.parentSlugs) {
        const parent = productsBySlug.get(parentSlug);
        if (!parent) {
          ctx.addIssue({
            code: 'custom',
            path: ['addons', index, 'parentSlugs'],
            message: `Unknown add-on parent: ${parentSlug}`,
          });
          continue;
        }

        if (parent.categorySlug !== addon.categorySlug) {
          ctx.addIssue({
            code: 'custom',
            path: ['addons', index, 'categorySlug'],
            message: 'Add-on category must match its parent product category',
          });
        }

        const key = `${parentSlug}:${addon.groupName}`;
        const names = addonNamesByParent.get(key) ?? new Set();
        if (names.has(addon.name)) {
          ctx.addIssue({
            code: 'custom',
            path: ['addons', index, 'name'],
            message: `Duplicate add-on name in ${parentSlug}/${addon.groupName}`,
          });
        }
        names.add(addon.name);
        addonNamesByParent.set(key, names);
      }
    }

    const reviewIds = new Set();
    for (const [index, reviewItem] of manifest.reviewList.entries()) {
      if (reviewIds.has(reviewItem.id)) {
        ctx.addIssue({
          code: 'custom',
          path: ['reviewList', index, 'id'],
          message: 'Duplicate review item id',
        });
      }
      reviewIds.add(reviewItem.id);
    }

    const foodProducts = manifest.products.filter((product) => product.sourcePdf === 'food-menu');
    const drinkProducts = manifest.products.filter((product) => product.sourcePdf === 'drink-menu');
    const foodAddons = manifest.addons.filter((addon) => addon.sourcePdf === 'food-menu');
    const drinkAddons = manifest.addons.filter((addon) => addon.sourcePdf === 'drink-menu');

    const summarizeProducts = (products) => {
      const productPricedLines = products.reduce(
        (total, product) => total + 1 + Math.max(0, product.sizeOptions.length - 1),
        0,
      );
      return {
        productPricedLines,
        productRecords: products.length,
        distinctProductNames: new Set(products.map((product) => product.name)).size,
      };
    };

    const foodProductSummary = summarizeProducts(foodProducts);
    const drinkProductSummary = summarizeProducts(drinkProducts);
    const combinedProductSummary = summarizeProducts(manifest.products);
    const foodAddonLines = foodAddons.length;
    const drinkAddonLines = drinkAddons.length;

    const expectedCounts = {
      sourceDocuments: manifest.sourceDocuments.length,
      categories: manifest.categories.length,
      food: {
        pricedLines: foodProductSummary.productPricedLines + foodAddonLines,
        productPricedLines: foodProductSummary.productPricedLines,
        addonLines: foodAddonLines,
        productRecords: foodProductSummary.productRecords,
        modeledRecords: foodProductSummary.productRecords + foodAddonLines,
        distinctProductNames: foodProductSummary.distinctProductNames,
        distinctAddonNames: new Set(foodAddons.map((addon) => addon.name)).size,
      },
      drink: {
        pricedLines: drinkProductSummary.productPricedLines + drinkAddonLines,
        productPricedLines: drinkProductSummary.productPricedLines,
        addonLines: drinkAddonLines,
        productRecords: drinkProductSummary.productRecords,
        modeledRecords: drinkProductSummary.productRecords + drinkAddonLines,
        distinctProductNames: drinkProductSummary.distinctProductNames,
        distinctAddonNames: new Set(drinkAddons.map((addon) => addon.name)).size,
      },
      combined: {
        pricedLines:
          foodProductSummary.productPricedLines +
          foodAddonLines +
          drinkProductSummary.productPricedLines +
          drinkAddonLines,
        productPricedLines: combinedProductSummary.productPricedLines,
        addonLines: manifest.addons.length,
        productRecords: combinedProductSummary.productRecords,
        addonRecords: manifest.addons.length,
        modeledRecords: combinedProductSummary.productRecords + manifest.addons.length,
        distinctProductNames: combinedProductSummary.distinctProductNames,
      },
    };

    for (const [path, expected, actual] of [
      [['sourceDocuments'], expectedCounts.sourceDocuments, manifest.counts.sourceDocuments],
      [['categories'], expectedCounts.categories, manifest.counts.categories],
      [['food', 'pricedLines'], expectedCounts.food.pricedLines, manifest.counts.food.pricedLines],
      [
        ['food', 'productPricedLines'],
        expectedCounts.food.productPricedLines,
        manifest.counts.food.productPricedLines,
      ],
      [['food', 'addonLines'], expectedCounts.food.addonLines, manifest.counts.food.addonLines],
      [
        ['food', 'productRecords'],
        expectedCounts.food.productRecords,
        manifest.counts.food.productRecords,
      ],
      [
        ['food', 'modeledRecords'],
        expectedCounts.food.modeledRecords,
        manifest.counts.food.modeledRecords,
      ],
      [
        ['food', 'distinctProductNames'],
        expectedCounts.food.distinctProductNames,
        manifest.counts.food.distinctProductNames,
      ],
      [
        ['food', 'distinctAddonNames'],
        expectedCounts.food.distinctAddonNames,
        manifest.counts.food.distinctAddonNames,
      ],
      [
        ['drink', 'pricedLines'],
        expectedCounts.drink.pricedLines,
        manifest.counts.drink.pricedLines,
      ],
      [
        ['drink', 'productPricedLines'],
        expectedCounts.drink.productPricedLines,
        manifest.counts.drink.productPricedLines,
      ],
      [['drink', 'addonLines'], expectedCounts.drink.addonLines, manifest.counts.drink.addonLines],
      [
        ['drink', 'productRecords'],
        expectedCounts.drink.productRecords,
        manifest.counts.drink.productRecords,
      ],
      [
        ['drink', 'modeledRecords'],
        expectedCounts.drink.modeledRecords,
        manifest.counts.drink.modeledRecords,
      ],
      [
        ['drink', 'distinctProductNames'],
        expectedCounts.drink.distinctProductNames,
        manifest.counts.drink.distinctProductNames,
      ],
      [
        ['drink', 'distinctAddonNames'],
        expectedCounts.drink.distinctAddonNames,
        manifest.counts.drink.distinctAddonNames,
      ],
      [
        ['combined', 'pricedLines'],
        expectedCounts.combined.pricedLines,
        manifest.counts.combined.pricedLines,
      ],
      [
        ['combined', 'productPricedLines'],
        expectedCounts.combined.productPricedLines,
        manifest.counts.combined.productPricedLines,
      ],
      [
        ['combined', 'addonLines'],
        expectedCounts.combined.addonLines,
        manifest.counts.combined.addonLines,
      ],
      [
        ['combined', 'productRecords'],
        expectedCounts.combined.productRecords,
        manifest.counts.combined.productRecords,
      ],
      [
        ['combined', 'addonRecords'],
        expectedCounts.combined.addonRecords,
        manifest.counts.combined.addonRecords,
      ],
      [
        ['combined', 'modeledRecords'],
        expectedCounts.combined.modeledRecords,
        manifest.counts.combined.modeledRecords,
      ],
      [
        ['combined', 'distinctProductNames'],
        expectedCounts.combined.distinctProductNames,
        manifest.counts.combined.distinctProductNames,
      ],
    ]) {
      if (expected !== actual) {
        ctx.addIssue({
          code: 'custom',
          path,
          message: `Count mismatch: expected ${expected}, found ${actual}`,
        });
      }
    }
  });

export function validateMenuManifest(manifest) {
  const parsed = menuPdfManifestSchema.safeParse(manifest);
  if (parsed.success) return parsed.data;

  const problems = parsed.error.issues
    .map((issue) => `${issue.path.join('.') || 'manifest'}: ${issue.message}`)
    .join('; ');

  throw new Error(`Invalid menu manifest: ${problems}`);
}
