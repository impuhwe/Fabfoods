import MenuItem from '../models/MenuItem.js';
import { MenuPricingError, resolveMenuItemPrice } from './menuPricing.service.js';
import { isOrderable } from './publicMenu.service.js';
import { badRequest, conflict, notFound } from '../utils/errors.js';

function selectionSummary(resolved) {
  const parts = [];
  if (resolved.sizeLabel) parts.push(resolved.sizeLabel);
  for (const selection of resolved.selections.serving) {
    parts.push(selection.optionName);
  }
  for (const selection of resolved.selections.addons) {
    parts.push(selection.optionName);
  }
  return parts;
}

const COPY = {
  order: {
    unverified: (name) => `${name} has not been verified by staff and cannot be ordered online yet`,
    reviewRequired: (name) =>
      `${name} has an unresolved review issue and cannot be ordered online yet`,
    notOrderable: (name) =>
      `${name} is awaiting owner confirmation and cannot be ordered online yet`,
  },
  reservation: {
    unverified: (name) =>
      `${name} has not been verified by staff and cannot be selected for a reservation yet`,
    reviewRequired: (name) =>
      `${name} has an unresolved review issue and cannot be selected for a reservation yet`,
    notOrderable: (name) =>
      `${name} is awaiting owner confirmation and cannot be selected for a reservation yet`,
  },
};

export async function resolveMenuSelectionLines(items, context = 'order') {
  const copy = COPY[context] ?? COPY.order;
  const slugs = [...new Set(items.map((line) => line.slug))];
  const menuItems = await MenuItem.find({ slug: { $in: slugs }, isArchived: false });
  const bySlug = new Map(menuItems.map((item) => [item.slug, item]));
  const lines = [];

  for (const line of items) {
    const item = bySlug.get(line.slug);
    if (!item) throw notFound(`Menu item not found: ${line.slug}`);
    if (!item.verified || item.needsReview) {
      throw conflict(copy.unverified(item.name), 'ITEM_NOT_VERIFIED');
    }
    if (item.hasUnresolvedBlockingIssues) {
      throw conflict(copy.reviewRequired(item.name), 'ITEM_REVIEW_REQUIRED');
    }
    if (!item.isAvailable) {
      throw conflict(`${item.name} is currently unavailable`, 'ITEM_UNAVAILABLE');
    }
    if (!isOrderable(item)) {
      throw conflict(copy.notOrderable(item.name), 'ITEM_NOT_ORDERABLE');
    }

    let resolved;
    try {
      resolved = resolveMenuItemPrice(item, {
        sizeLabel: line.sizeLabel,
        servingSelections: line.servingSelections,
        addonSelections: line.addonSelections,
      });
    } catch (error) {
      if (error instanceof MenuPricingError) {
        throw badRequest(error.message, [{ field: line.slug, message: error.message }]);
      }
      throw error;
    }

    lines.push({
      slug: item.slug,
      name: item.name,
      quantity: line.quantity,
      unitPrice: resolved.unitPrice,
      lineTotal: resolved.unitPrice * line.quantity,
      basePrice: resolved.basePrice,
      servingPriceDelta: resolved.servingPriceDelta,
      addonPrice: resolved.addonPrice,
      selectionSummary: selectionSummary(resolved),
      selections: resolved.selections,
    });
  }

  return lines;
}
