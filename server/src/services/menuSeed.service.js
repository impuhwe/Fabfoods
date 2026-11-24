import { MENU_REVIEW_ISSUE_LINKS } from '../scripts/data/menuReviewLinks.js';
import { menuImageForSlug } from '../scripts/data/menu-images.manifest.js';
import { validateMenuManifest } from '../validators/menu.validator.js';

function appendReviewNote(existing, note) {
  if (!note) return existing;
  if (!existing) return note;
  if (existing.includes(note)) return existing;
  return `${existing} ${note}`;
}

function reviewNoteFrom(line) {
  return (line.reviewNotes ?? []).join(' ');
}

function cloneSizeOption(option) {
  return {
    label: option.label,
    price: option.price,
    priceText: option.priceText,
    isDefault: option.isDefault,
    isAvailable: option.isAvailable,
    displayOrder: option.displayOrder,
  };
}

function cloneServingOption(option) {
  return {
    name: option.name,
    priceDelta: option.priceDelta,
    priceDeltaNote: option.priceDeltaNote,
    isDefault: option.isDefault,
    isAvailable: option.isAvailable,
    displayOrder: option.displayOrder,
  };
}

function cloneServingGroup(group) {
  return {
    name: group.name,
    selectionType: group.selectionType,
    isRequired: group.isRequired,
    maxSelections: group.maxSelections,
    displayOrder: group.displayOrder,
    options: group.options.map(cloneServingOption),
  };
}

function cloneAddonGroup(group) {
  return {
    name: group.name,
    selectionType: group.selectionType,
    isRequired: group.isRequired,
    maxSelections: group.maxSelections,
    displayOrder: group.displayOrder,
    options: group.options.map((option) => ({
      name: option.name,
      price: option.price,
      isDefault: option.isDefault,
      isAvailable: option.isAvailable,
      displayOrder: option.displayOrder,
    })),
  };
}

export function buildMenuSeedData(manifest) {
  const data = validateMenuManifest(manifest);
  const categories = data.categories.map((category) => ({
    name: category.name,
    slug: category.slug,
    description: category.description,
    kind: category.kind,
    displayOrder: category.displayOrder,
    isVisible: true,
  }));
  const itemsBySlug = new Map();

  const items = data.products.map((line) => {
    const researchedImage = menuImageForSlug(line.slug);
    const item = {
      name: line.name,
      slug: line.slug,
      categorySlug: line.categorySlug,
      price: line.price,
      description: line.description,
      includedItems: [...line.includedItems],
      sizeOptions: line.sizeOptions.map(cloneSizeOption),
      servingOptions: line.servingOptions.map(cloneServingGroup),
      addonGroups: line.addonGroups.map(cloneAddonGroup),
      image:
        researchedImage?.status === 'sourced'
          ? {
              url: researchedImage.localPath,
              publicId: '',
              alt: `Illustrative image for ${line.name}`,
            }
          : {},
      gallery: [],
      ingredients: [],
      allergens: [],
      isAvailable: false,
      isFeatured: false,
      isPopular: false,
      isArchived: false,
      needsReview: line.needsReview,
      verified: line.verified,
      reviewStatus: line.reviewStatus,
      reviewNote: reviewNoteFrom(line),
      reviewTags: [...line.reviewTags],
      dataSource: line.dataSource,
      sourceRef: line.sourceRef,
      sourcePage: line.sourcePage,
      tags: [],
      prepTimeMinutes: null,
      displayOrder: line.displayOrder,
    };

    itemsBySlug.set(item.slug, item);
    return item;
  });

  for (const addon of data.addons) {
    for (const parentSlug of addon.parentSlugs) {
      const parent = itemsBySlug.get(parentSlug);
      if (!parent) {
        throw new Error(`Add-on ${addon.name} references unknown parent ${parentSlug}`);
      }

      let group = parent.addonGroups.find((candidate) => candidate.name === addon.groupName);

      if (!group) {
        group = {
          name: addon.groupName,
          selectionType: addon.selectionType,
          isRequired: addon.isRequired,
          maxSelections: addon.maxSelections,
          displayOrder: addon.displayOrder,
          options: [],
        };
        parent.addonGroups.push(group);
      } else {
        if (group.selectionType !== addon.selectionType) {
          throw new Error(
            `Add-on group ${parent.slug}/${group.name} mixes single and multiple selection`,
          );
        }
        if (group.isRequired !== addon.isRequired) {
          throw new Error(`Add-on group ${parent.slug}/${group.name} mixes required flags`);
        }
        group.maxSelections = Math.max(group.maxSelections, addon.maxSelections);
      }

      group.options.push({
        name: addon.name,
        price: addon.price,
        isDefault: false,
        isAvailable: true,
        displayOrder: addon.displayOrder,
      });

      parent.reviewNote = appendReviewNote(parent.reviewNote, reviewNoteFrom(addon));
    }
  }

  for (const item of items) {
    item.addonGroups.sort((a, b) => a.displayOrder - b.displayOrder);
    for (const group of item.addonGroups) {
      group.options.sort((a, b) => a.displayOrder - b.displayOrder);
    }
    item.servingOptions.sort((a, b) => a.displayOrder - b.displayOrder);
    for (const group of item.servingOptions) {
      group.options.sort((a, b) => a.displayOrder - b.displayOrder);
    }
    item.sizeOptions.sort((a, b) => a.displayOrder - b.displayOrder);
  }

  const addonOptions = items.flatMap((item) => item.addonGroups.flatMap((group) => group.options));
  const sizeOptions = items.flatMap((item) => item.sizeOptions);
  const servingOptions = items.flatMap((item) =>
    item.servingOptions.flatMap((group) => group.options),
  );

  const reviewIssues = data.reviewList.map((line) => {
    const link = MENU_REVIEW_ISSUE_LINKS[line.id] ?? {};
    const affectedCategorySlugs = new Set(link.affectedCategorySlugs ?? []);

    for (const kind of link.affectedCategoryKinds ?? []) {
      for (const category of data.categories) {
        if (category.kind === kind) affectedCategorySlugs.add(category.slug);
      }
    }

    return {
      issueId: line.id,
      sourcePdf: line.sourcePdf,
      sourcePage: line.sourcePage,
      item: line.item,
      issue: line.issue,
      handling: line.handling,
      affectedSlugs: link.affectedSlugs ?? [],
      affectedCategorySlugs: [...affectedCategorySlugs],
      blocking: true,
    };
  });

  return {
    categories,
    items,
    reviewIssues,
    summary: {
      sourceDocuments: data.sourceDocuments.length,
      categories: categories.length,
      products: data.products.length,
      productRecords: items.length,
      distinctProductNames: new Set(items.map((item) => item.name)).size,
      sourceAddonLines: data.addons.length,
      pricedAddonOptions: addonOptions.filter((option) => option.price > 0).length,
      itemsWithAddonGroups: items.filter((item) => item.addonGroups.length > 0).length,
      itemsWithSizeOptions: items.filter((item) => item.sizeOptions.length > 0).length,
      itemsWithServingOptions: items.filter((item) => item.servingOptions.length > 0).length,
      itemsWithIncludedItems: items.filter((item) => item.includedItems.length > 0).length,
      itemsWithImages: items.filter((item) => item.image.url).length,
      sizeOptions: sizeOptions.length,
      servingOptions: servingOptions.length,
      includedItems: items.reduce((total, item) => total + item.includedItems.length, 0),
      pricedLines: data.counts.combined.pricedLines,
      modeledRecords: data.counts.combined.modeledRecords,
      reviewFlags: data.reviewList.length,
      reviewIssues: reviewIssues.length,
    },
  };
}

export { appendReviewNote };
