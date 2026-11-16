import { FULFILLMENT_TYPES } from '../config/constants.js';
import MenuItem from '../models/MenuItem.js';
import { MenuPricingError, resolveMenuItemPrice } from './menuPricing.service.js';
import { isOrderable } from './publicMenu.service.js';
import { badRequest, conflict, notFound } from '../utils/errors.js';
import {
  effectiveEnabledPaymentMethods,
  getSettings,
  isOnlinePaymentsReady,
  resolveDeliveryQuote,
} from './settings.service.js';

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

export async function quoteOrder(
  { items, fulfillmentType = FULFILLMENT_TYPES.PICKUP, deliveryAddress },
  settings = null,
) {
  const config = settings ?? (await getSettings());
  const slugs = [...new Set(items.map((line) => line.slug))];
  const menuItems = await MenuItem.find({ slug: { $in: slugs }, isArchived: false });
  const bySlug = new Map(menuItems.map((item) => [item.slug, item]));

  const lines = [];
  let subtotal = 0;
  let itemCount = 0;

  for (const line of items) {
    const item = bySlug.get(line.slug);
    if (!item) throw notFound(`Menu item not found: ${line.slug}`);
    if (!item.isAvailable) {
      throw conflict(`${item.name} is currently unavailable`, 'ITEM_UNAVAILABLE');
    }
    if (!isOrderable(item)) {
      throw conflict(
        `${item.name} is awaiting owner confirmation and cannot be ordered online yet`,
        'ITEM_NOT_ORDERABLE',
      );
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

    const lineTotal = resolved.unitPrice * line.quantity;
    subtotal += lineTotal;
    itemCount += line.quantity;

    lines.push({
      slug: item.slug,
      name: item.name,
      quantity: line.quantity,
      unitPrice: resolved.unitPrice,
      lineTotal,
      basePrice: resolved.basePrice,
      servingPriceDelta: resolved.servingPriceDelta,
      addonPrice: resolved.addonPrice,
      selectionSummary: selectionSummary(resolved),
      selections: resolved.selections,
    });
  }

  const pickup = fulfillmentType === FULFILLMENT_TYPES.PICKUP;
  let fulfillment;

  if (config.fulfillment.orderingPaused) {
    fulfillment = {
      type: fulfillmentType,
      available: false,
      label: pickup ? 'Pickup' : 'Delivery',
      message: 'Ordering is temporarily paused. Please try again later.',
      fee: null,
    };
  } else if (pickup) {
    fulfillment = {
      type: FULFILLMENT_TYPES.PICKUP,
      available: config.fulfillment.pickupEnabled,
      label: 'Pickup',
      message: config.fulfillment.pickupEnabled
        ? 'Pickup timing is confirmed by the restaurant after your order is reviewed.'
        : 'Pickup ordering is not open yet.',
      fee: config.fulfillment.pickupEnabled ? 0 : null,
      etaMinutes: config.fulfillment.pickupEtaMinutes,
    };
  } else {
    const delivery = resolveDeliveryQuote(config, { subtotal, address: deliveryAddress });
    fulfillment = {
      type: FULFILLMENT_TYPES.DELIVERY,
      label: 'Delivery',
      ...delivery,
    };
  }

  if (subtotal < (config.fulfillment.minOrder ?? 0) && fulfillment.available) {
    fulfillment = {
      ...fulfillment,
      available: false,
      fee: null,
      message: `The minimum order is ${config.fulfillment.minOrder} RWF.`,
    };
  }

  const deliveryFee = fulfillment.available ? (fulfillment.fee ?? 0) : 0;
  const enabledMethods = effectiveEnabledPaymentMethods(config);
  const onlineEnabled = isOnlinePaymentsReady(config);

  return {
    currency: config.payments.currency,
    itemCount,
    subtotal,
    deliveryFee,
    total: subtotal + deliveryFee,
    items: lines,
    fulfillment,
    payment: {
      onlineEnabled,
      enabledMethods,
      acceptedMethods: config.payments.acceptedMethods,
      message:
        enabledMethods.length > 0
          ? onlineEnabled
            ? 'Online payment is available. Your order is confirmed only after the payment provider verifies it.'
            : 'Pay in person. Online payment is not open yet.'
          : 'Ordering is not open until the restaurant enables a payment method.',
    },
  };
}
