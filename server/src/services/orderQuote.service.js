import { FULFILLMENT_TYPES } from '../config/constants.js';
import { resolveMenuSelectionLines } from './menuSelectionQuote.service.js';
import {
  effectiveEnabledPaymentMethods,
  getSettings,
  isOnlinePaymentsReady,
  resolveDeliveryQuote,
} from './settings.service.js';

export async function quoteOrder(
  { items, fulfillmentType = FULFILLMENT_TYPES.PICKUP, deliveryAddress },
  settings = null,
) {
  const config = settings ?? (await getSettings());
  const lines = await resolveMenuSelectionLines(items);
  const subtotal = lines.reduce((total, line) => total + line.lineTotal, 0);
  const itemCount = lines.reduce((total, line) => total + line.quantity, 0);
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
