import { describe, expect, it } from 'vitest';
import { validateMenuItemSelection } from './menuSelection.js';

describe('menu item selections', () => {
  it('requires a size when the item has size options', () => {
    const item = {
      isOrderable: true,
      hasSizeOptions: true,
      sizeOptions: [{ label: 'Regular', price: 500 }],
      servingOptions: [],
      addonGroups: [],
    };

    expect(validateMenuItemSelection(item, { sizeLabel: '' })).toBe(
      'Choose a size before adding this item.',
    );
    expect(validateMenuItemSelection(item, { sizeLabel: 'Regular', serving: {}, addons: {} })).toBe(
      '',
    );
    expect(validateMenuItemSelection(item, { sizeLabel: 'Large', serving: {}, addons: {} })).toBe(
      'Choose an available size for this item.',
    );
  });

  it('requires every required serving and add-on group', () => {
    const item = {
      isOrderable: true,
      hasSizeOptions: false,
      sizeOptions: [],
      servingOptions: [{ name: 'Temperature', isRequired: true, options: [{ name: 'Hot' }] }],
      addonGroups: [{ name: 'Extras', isRequired: true, options: [{ name: 'Sauce' }] }],
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

  it('rejects unavailable option names', () => {
    expect(
      validateMenuItemSelection(
        {
          isOrderable: true,
          hasSizeOptions: false,
          servingOptions: [{ name: 'Temperature', isRequired: true, options: [{ name: 'Hot' }] }],
          addonGroups: [],
        },
        { serving: { Temperature: ['Cold'] }, addons: {} },
      ),
    ).toBe('Choose an available option for Temperature.');
  });

  it('does not allow an unorderable item', () => {
    expect(validateMenuItemSelection({ isOrderable: false })).toBe(
      'This item is not available for online ordering.',
    );
  });
});
