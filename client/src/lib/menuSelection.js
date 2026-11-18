export function validateMenuItemSelection(item, selection = {}) {
  if (!item?.isOrderable) {
    return 'This item is not available for online ordering.';
  }

  if (item.hasSizeOptions && !selection.sizeLabel) {
    return 'Choose a size before adding this item.';
  }

  for (const group of item.servingOptions ?? []) {
    if (group.isRequired && !(selection.serving?.[group.name] ?? []).length) {
      return `Choose an option for ${group.name}.`;
    }
  }

  for (const group of item.addonGroups ?? []) {
    if (group.isRequired && !(selection.addons?.[group.name] ?? []).length) {
      return `Choose an option for ${group.name}.`;
    }
  }

  return '';
}
