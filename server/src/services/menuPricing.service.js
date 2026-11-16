export class MenuPricingError extends Error {
  constructor(message, code = 'MENU_PRICING_ERROR') {
    super(message);
    this.name = 'MenuPricingError';
    this.code = code;
  }
}

const normalize = (value) => value.trim().toLowerCase();

function assertPrice(value, label) {
  if (!Number.isInteger(value) || value < 0) {
    throw new MenuPricingError(`${label} must be a non-negative integer amount in RWF`);
  }
}

function availableOptions(options) {
  return options.filter((option) => option.isAvailable !== false);
}

function findOption(options, name) {
  return availableOptions(options).find((option) => normalize(option.name) === normalize(name));
}

function findSize(options, label) {
  return availableOptions(options).find((option) => normalize(option.label) === normalize(label));
}

function selectedForGroup(selections, groupName) {
  return selections.filter((selection) => normalize(selection.groupName) === normalize(groupName));
}

function validateSelectionShape(selection, kind) {
  if (
    !selection ||
    typeof selection.groupName !== 'string' ||
    typeof selection.optionName !== 'string'
  ) {
    throw new MenuPricingError(`Each ${kind} selection needs groupName and optionName`);
  }
}

function resolveServingGroups(groups, selections) {
  const resolved = [];
  let totalDelta = 0;
  const knownGroupNames = new Set(groups.map((group) => normalize(group.name)));

  for (const selection of selections) {
    validateSelectionShape(selection, 'serving');
    if (!knownGroupNames.has(normalize(selection.groupName))) {
      throw new MenuPricingError(`Unknown serving group: ${selection.groupName}`);
    }
  }

  for (const group of groups) {
    const groupSelections = selectedForGroup(selections, group.name);
    let selected = groupSelections;

    if (selected.length === 0) {
      if (!group.isRequired) continue;
      const defaultOption = availableOptions(group.options ?? []).find(
        (option) => option.isDefault,
      );
      if (!defaultOption) {
        throw new MenuPricingError(
          `A selection is required for serving group: ${group.name}`,
          'SERVING_CHOICE_REQUIRED',
        );
      }
      selected = [{ groupName: group.name, optionName: defaultOption.name }];
    }

    if (group.selectionType === 'single' && selected.length !== 1) {
      throw new MenuPricingError(`Serving group ${group.name} allows exactly one selection`);
    }

    if (selected.length > group.maxSelections) {
      throw new MenuPricingError(
        `Serving group ${group.name} allows at most ${group.maxSelections} selections`,
      );
    }

    for (const selection of selected) {
      const option = findOption(group.options ?? [], selection.optionName);
      if (!option) {
        throw new MenuPricingError(
          `Unknown or unavailable serving option: ${selection.optionName}`,
          'SERVING_OPTION_UNAVAILABLE',
        );
      }
      assertPrice(option.priceDelta, `Serving option ${option.name}`);
      totalDelta += option.priceDelta;
      resolved.push({
        groupName: group.name,
        optionName: option.name,
        priceDelta: option.priceDelta,
      });
    }
  }

  return { totalDelta, selections: resolved };
}

function resolveAddonGroups(groups, selections) {
  const resolved = [];
  let total = 0;
  const knownGroupNames = new Set(groups.map((group) => normalize(group.name)));

  for (const selection of selections) {
    validateSelectionShape(selection, 'add-on');
    if (!knownGroupNames.has(normalize(selection.groupName))) {
      throw new MenuPricingError(`Unknown add-on group: ${selection.groupName}`);
    }
  }

  for (const group of groups) {
    const groupSelections = selectedForGroup(selections, group.name);
    let selected = groupSelections;

    if (selected.length === 0) {
      if (!group.isRequired) continue;
      const defaultOption = availableOptions(group.options ?? []).find(
        (option) => option.isDefault,
      );
      if (!defaultOption) {
        throw new MenuPricingError(
          `A selection is required for add-on group: ${group.name}`,
          'ADDON_CHOICE_REQUIRED',
        );
      }
      selected = [{ groupName: group.name, optionName: defaultOption.name }];
    }

    if (group.selectionType === 'single' && selected.length !== 1) {
      throw new MenuPricingError(`Add-on group ${group.name} allows exactly one selection`);
    }

    if (selected.length > group.maxSelections) {
      throw new MenuPricingError(
        `Add-on group ${group.name} allows at most ${group.maxSelections} selections`,
      );
    }

    for (const selection of selected) {
      const option = findOption(group.options ?? [], selection.optionName);
      if (!option) {
        throw new MenuPricingError(
          `Unknown or unavailable add-on: ${selection.optionName}`,
          'ADDON_UNAVAILABLE',
        );
      }
      assertPrice(option.price, `Add-on ${option.name}`);
      total += option.price;
      resolved.push({
        groupName: group.name,
        optionName: option.name,
        price: option.price,
      });
    }
  }

  return { total, selections: resolved };
}

/**
 * Resolve a menu item's unit price from server-owned option data.
 *
 * The selection object is intentionally name-based. Any client-supplied price
 * fields are ignored; only prices stored on the menu item are used.
 */
export function resolveMenuItemPrice(item, selection = {}) {
  const { sizeLabel, servingSelections = [], addonSelections = [] } = selection;
  let basePrice;
  let selectedSize = null;

  if (item.sizeOptions?.length) {
    if (!sizeLabel) {
      throw new MenuPricingError(
        'A size selection is required for this item',
        'SIZE_SELECTION_REQUIRED',
      );
    }

    selectedSize = findSize(item.sizeOptions, sizeLabel);
    if (!selectedSize) {
      throw new MenuPricingError(`Unknown or unavailable size: ${sizeLabel}`, 'SIZE_UNAVAILABLE');
    }
    basePrice = selectedSize.price;
  } else {
    basePrice = item.price;
  }

  assertPrice(basePrice, 'Menu item price');

  const serving = resolveServingGroups(item.servingOptions ?? [], servingSelections);
  const addons = resolveAddonGroups(item.addonGroups ?? [], addonSelections);
  const unitPrice = basePrice + serving.totalDelta + addons.total;

  return {
    unitPrice,
    basePrice,
    sizeLabel: selectedSize?.label ?? null,
    servingPriceDelta: serving.totalDelta,
    addonPrice: addons.total,
    selections: {
      sizeLabel: selectedSize?.label ?? null,
      serving: serving.selections,
      addons: addons.selections,
    },
  };
}

export function getMenuOptions(item) {
  return {
    includedItems: [...(item.includedItems ?? [])],
    sizeOptions: (item.sizeOptions ?? []).map((option) => ({
      label: option.label,
      price: option.price,
      priceText: option.priceText,
      isDefault: option.isDefault,
      isAvailable: option.isAvailable,
      displayOrder: option.displayOrder,
    })),
    servingOptions: (item.servingOptions ?? []).map((group) => ({
      name: group.name,
      selectionType: group.selectionType,
      isRequired: group.isRequired,
      maxSelections: group.maxSelections,
      displayOrder: group.displayOrder,
      options: (group.options ?? []).map((option) => ({
        name: option.name,
        priceDelta: option.priceDelta,
        priceDeltaNote: option.priceDeltaNote,
        isDefault: option.isDefault,
        isAvailable: option.isAvailable,
        displayOrder: option.displayOrder,
      })),
    })),
    addonGroups: (item.addonGroups ?? []).map((group) => ({
      name: group.name,
      selectionType: group.selectionType,
      isRequired: group.isRequired,
      maxSelections: group.maxSelections,
      displayOrder: group.displayOrder,
      options: (group.options ?? []).map((option) => ({
        name: option.name,
        price: option.price,
        isDefault: option.isDefault,
        isAvailable: option.isAvailable,
        displayOrder: option.displayOrder,
      })),
    })),
  };
}
