export function validateMenuItemSelection(item, selection = {}) {
  if (!item?.isOrderable) {
    return 'This item is not available for online ordering.';
  }

  if (item.hasSizeOptions && !selection.sizeLabel) {
    return 'Choose a size before adding this item.';
  }

  if (item.hasSizeOptions && selection.sizeLabel) {
    const size = (item.sizeOptions ?? []).find(
      (option) =>
        option.label.toLowerCase() === String(selection.sizeLabel).toLowerCase() &&
        option.isAvailable !== false,
    );
    if (!size) return 'Choose an available size for this item.';
  }

  for (const group of item.servingOptions ?? []) {
    const selected = selection.serving?.[group.name] ?? [];
    if (group.isRequired && !selected.length) {
      return `Choose an option for ${group.name}.`;
    }
    if (group.selectionType === 'single' && selected.length > 1) {
      return `Choose only one option for ${group.name}.`;
    }
    if (group.maxSelections && selected.length > group.maxSelections) {
      return `Choose at most ${group.maxSelections} options for ${group.name}.`;
    }
    for (const optionName of selected) {
      const option = (group.options ?? []).find(
        (entry) =>
          entry.name.toLowerCase() === String(optionName).toLowerCase() &&
          entry.isAvailable !== false,
      );
      if (!option) return `Choose an available option for ${group.name}.`;
    }
  }

  for (const group of item.addonGroups ?? []) {
    const selected = selection.addons?.[group.name] ?? [];
    if (group.isRequired && !selected.length) {
      return `Choose an option for ${group.name}.`;
    }
    if (group.selectionType === 'single' && selected.length > 1) {
      return `Choose only one option for ${group.name}.`;
    }
    if (group.maxSelections && selected.length > group.maxSelections) {
      return `Choose at most ${group.maxSelections} options for ${group.name}.`;
    }
    for (const optionName of selected) {
      const option = (group.options ?? []).find(
        (entry) =>
          entry.name.toLowerCase() === String(optionName).toLowerCase() &&
          entry.isAvailable !== false,
      );
      if (!option) return `Choose an available option for ${group.name}.`;
    }
  }

  return '';
}
