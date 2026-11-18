import { describe, expect, it } from 'vitest';
import {
  buildReservationLine,
  createReservationSelection,
  estimateReservationSelection,
  toReservationSelectionPayload,
  validateReservationLine,
} from './reservationMenu.js';

const food = {
  slug: 'continental-breakfast',
  name: 'Continental Breakfast',
  price: 8000,
  hasSizeOptions: false,
  sizeOptions: [],
  servingOptions: [],
  addonGroups: [],
  isOrderable: true,
};

const drink = {
  slug: 'inyange-juice',
  name: 'Inyange Juice',
  price: 700,
  hasSizeOptions: true,
  sizeOptions: [
    { label: 'Small', price: 700, isAvailable: true },
    { label: 'Big', price: 1000, isAvailable: true },
  ],
  servingOptions: [{ name: 'Served with', isRequired: false, options: [{ name: 'Ice' }] }],
  addonGroups: [{ name: 'Extras', isRequired: false, options: [{ name: 'More ice', price: 100 }] }],
  isOrderable: true,
};

describe('reservation menu helpers', () => {
  it('creates a one-quantity selection with empty option maps', () => {
    expect(createReservationSelection(food)).toEqual({
      quantity: 1,
      sizeLabel: '',
      serving: {},
      addons: {},
    });
  });

  it('estimates selections with sizes and quantities', () => {
    const breakfast = { ...createReservationSelection(food), quantity: 2 };
    const juice = { ...createReservationSelection(drink), sizeLabel: 'Big', quantity: 1 };

    expect(estimateReservationSelection(food, breakfast)).toBe(8000);
    expect(estimateReservationSelection(drink, juice)).toBe(1000);
    expect(
      breakfast.quantity * estimateReservationSelection(food, breakfast) +
        juice.quantity * estimateReservationSelection(drink, juice),
    ).toBe(17000);
  });

  it('sends only selection identifiers and option choices', () => {
    const line = buildReservationLine(drink, {
      ...createReservationSelection(drink),
      quantity: 2,
      sizeLabel: 'Big',
      serving: { 'Served with': ['Ice'] },
      addons: { Extras: ['More ice'] },
    });
    const payload = toReservationSelectionPayload(line);

    expect(payload).toEqual({
      slug: 'inyange-juice',
      quantity: 2,
      sizeLabel: 'Big',
      servingSelections: [{ groupName: 'Served with', optionName: 'Ice' }],
      addonSelections: [{ groupName: 'Extras', optionName: 'More ice' }],
    });
    expect(JSON.stringify(payload)).not.toContain('unitPrice');
    expect(JSON.stringify(payload)).not.toContain('lineTotal');
  });

  it('validates selections before adding them', () => {
    expect(validateReservationLine(food, createReservationSelection(food))).toBe('');
    expect(
      validateReservationLine({ ...food, isOrderable: false }, createReservationSelection(food)),
    ).toBe('This item is not available for online ordering.');
    expect(
      validateReservationLine(drink, { ...createReservationSelection(drink), sizeLabel: 'Huge' }),
    ).toBe('Choose an available size for this item.');
  });
});
