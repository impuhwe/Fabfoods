import { describe, expect, it } from 'vitest';
import { validateMenuItemSelection } from './menuSelection.js';

describe('menu item selections', () => {
  it('requires a size when the item has size options', () => {
    const item = {
      isOrderable: true,
      hasSizeOptions: true,
      servingOptions: [],
      addonGroups: [],
    };

    expect(validateMenuItemSelection(item, { sizeLabel: '' })).toBe(
      'Choose a size before adding this item.',
    );
    expect(validateMenuItemSelection(item, { sizeLabel: 'Regular', serving: {}, addons: {} })).toBe(
      '',
    );
  });

  it('requires every required serving and add-on group', () => {
    const item = {
      isOrderable: true,
      hasSizeOptions: false,
      servingOptions: [{ name: 'Temperature', isRequired: true }],
      addonGroups: [{ name: 'Extras', isRequired: true }],
    };

    expect(
      validateMenuItemSelection(item, {
        serving: { Temperature: ['Hot'] },
        addons: {},
      }),
    ).toBe('Choose an option for Extras.');
    expect(
      validateMenuItemSelection(item, {
        serving: { Temperature: ['Hot'] },
        addons: { Extras: ['Sauce'] },
      }),
    ).toBe('');
  });

  it('does not allow an unorderable item', () => {
    expect(validateMenuItemSelection({ isOrderable: false })).toBe(
      'This item is not available for online ordering.',
    );
  });
});
