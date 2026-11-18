import { formatRwf } from './format.js';
import { menuItemImage } from './imagery.js';
import { validateMenuItemSelection } from './menuSelection.js';

function defaultSize(item) {
  return (
    item.sizeOptions?.find((option) => option.isDefault && option.isAvailable)?.label ??
    item.sizeOptions?.find((option) => option.isAvailable)?.label ??
    ''
  );
}

export function createReservationSelection(item) {
  const serving = {};
  for (const group of item.servingOptions ?? []) {
    const defaults = (group.options ?? []).filter(
      (option) => option.isDefault && option.isAvailable !== false,
    );
    serving[group.name] =
      group.isRequired || defaults.length ? defaults.map((option) => option.name) : [];
  }

  const addons = {};
  for (const group of item.addonGroups ?? []) {
    const defaults = (group.options ?? []).filter(
      (option) => option.isDefault && option.isAvailable !== false,
    );
    addons[group.name] = defaults.map((option) => option.name);
  }

  return { quantity: 1, sizeLabel: defaultSize(item), serving, addons };
}

export function estimateReservationSelection(item, selection) {
  if (!item) return 0;
  const size = (item.sizeOptions ?? []).find(
    (option) => option.label.toLowerCase() === String(selection.sizeLabel ?? '').toLowerCase(),
  );
  let total = size?.price ?? item.price ?? 0;
  for (const group of item.servingOptions ?? []) {
    for (const optionName of selection.serving?.[group.name] ?? []) {
      total += (group.options ?? []).find((option) => option.name === optionName)?.priceDelta ?? 0;
    }
  }
  for (const group of item.addonGroups ?? []) {
    for (const optionName of selection.addons?.[group.name] ?? []) {
      total += (group.options ?? []).find((option) => option.name === optionName)?.price ?? 0;
    }
  }
  return total;
}

function selectionPairs(groups, selected) {
  return Object.entries(selected ?? {}).flatMap(([groupName, options]) =>
    (options ?? []).map((optionName) => ({ groupName, optionName })),
  );
}

export function buildReservationLine(item, selection) {
  const servingSelections = selectionPairs(item.servingOptions, selection.serving);
  const addonSelections = selectionPairs(item.addonGroups, selection.addons);
  const unitPrice = estimateReservationSelection(item, selection);
  const selectionSummary = [
    selection.sizeLabel,
    ...servingSelections.map((selection) => selection.optionName),
    ...addonSelections.map((selection) => selection.optionName),
  ].filter(Boolean);
  const detail = [...selectionSummary].sort().join('::');

  return {
    key: `${item.slug}::${selection.sizeLabel ?? ''}::${detail}`,
    slug: item.slug,
    name: item.name,
    category: item.category?.name ?? 'Kitchen',
    categoryKind: item.category?.kind ?? 'food',
    image: menuItemImage(item),
    imageAlt: item.image?.alt ?? `Illustrative image for ${item.name}`,
    quantity: selection.quantity,
    sizeLabel: selection.sizeLabel || undefined,
    servingSelections,
    addonSelections,
    selectionSummary,
    unitPrice,
    lineTotal: unitPrice * selection.quantity,
  };
}

export function toReservationSelectionPayload(line) {
  return {
    slug: line.slug,
    quantity: line.quantity,
    ...(line.sizeLabel ? { sizeLabel: line.sizeLabel } : {}),
    servingSelections: line.servingSelections ?? [],
    addonSelections: line.addonSelections ?? [],
  };
}

export function reservationSelectionLineText(line) {
  const detail = line.selectionSummary?.length ? ` (${line.selectionSummary.join(', ')})` : '';
  return `${line.name}${detail} · ${line.quantity} × ${formatRwf(line.unitPrice)}`;
}

export function validateReservationLine(item, selection) {
  return validateMenuItemSelection(item, selection);
}
