import RestaurantSettings from '../models/RestaurantSettings.js';
import { PAYMENT_METHODS } from '../config/constants.js';
import { isOnlinePaymentMethod, isPaymentProviderConfigured } from '../payments/providers/index.js';
import { badRequest } from '../utils/errors.js';

function onlinePaymentsReady(settings) {
  return Boolean(
    settings.payments.onlineEnabled &&
      settings.verification.paymentsApproved &&
      isPaymentProviderConfigured(),
  );
}

export function effectiveEnabledPaymentMethods(settings) {
  const onlineReady = onlinePaymentsReady(settings);
  return settings.payments.enabledMethods.filter(
    (method) => !isOnlinePaymentMethod(method) || onlineReady,
  );
}

export async function getSettings() {
  return RestaurantSettings.findOneAndUpdate(
    { singleton: 'default' },
    { $setOnInsert: { singleton: 'default' } },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );
}

function applyPatch(target, patch) {
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) continue;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      Object.assign(target[key], value);
    } else {
      target[key] = value;
    }
  }
}

function assertSafeConfiguration(settings) {
  if (settings.reservations.autoConfirm) {
    throw badRequest(
      'Automatic reservation confirmation is disabled. Staff must approve each request.',
    );
  }

  if (settings.fulfillment.deliveryEnabled && !settings.verification.deliveryApproved) {
    throw badRequest('Delivery cannot be enabled until zones and fees are approved');
  }

  if (
    settings.payments.enabledMethods.some(isOnlinePaymentMethod) &&
    (!settings.payments.onlineEnabled ||
      !settings.verification.paymentsApproved ||
      !isPaymentProviderConfigured())
  ) {
    throw badRequest(
      'Online payment methods require an approved, configured payment provider',
    );
  }
}

export async function updateSettings(patch) {
  const settings = await getSettings();
  applyPatch(settings, patch);
  assertSafeConfiguration(settings);
  await settings.save();
  return settings;
}

function publicHours(settings) {
  if (!settings.verification.hoursApproved) return [];
  return settings.hours
    .slice()
    .sort((a, b) => a.day - b.day)
    .map((hour) => ({
      day: hour.day,
      isClosed: hour.isClosed,
      open: hour.isClosed ? null : hour.open,
      close: hour.isClosed ? null : hour.close,
    }));
}

function publicZones(settings) {
  if (!settings.verification.deliveryApproved) return [];
  return settings.fulfillment.deliveryZones
    .filter((zone) => zone.isActive && zone.isVerified)
    .map((zone) => ({
      name: zone.name,
      areas: zone.areas,
      fee: zone.fee,
      minOrder: zone.minOrder,
      etaMinutes: zone.etaMinutes,
    }));
}

export function toPublicSettings(settings) {
  return {
    contact: settings.verification.contactApproved
      ? {
          phone: settings.contact.phone,
          email: settings.contact.email,
          address: settings.contact.address,
          whatsapp: settings.contact.whatsapp,
        }
      : null,
    hours: publicHours(settings),
    reservations: {
      enabled: settings.reservations.enabled,
      maxPartySize: settings.reservations.maxPartySize,
      maxDaysAhead: settings.reservations.maxDaysAhead,
      policyText: settings.reservations.policyText,
    },
    fulfillment: {
      pickupEnabled: settings.fulfillment.pickupEnabled,
      deliveryEnabled: Boolean(
        settings.fulfillment.deliveryEnabled && settings.verification.deliveryApproved,
      ),
      orderingPaused: settings.fulfillment.orderingPaused,
      pickupEtaMinutes: settings.fulfillment.pickupEtaMinutes,
      minOrder: settings.fulfillment.minOrder,
      deliveryZones: publicZones(settings),
    },
    payments: {
      currency: settings.payments.currency,
      acceptedMethods: settings.payments.acceptedMethods,
      enabledMethods: effectiveEnabledPaymentMethods(settings),
      onlineEnabled: onlinePaymentsReady(settings),
    },
    verification: {
      contactApproved: settings.verification.contactApproved,
      hoursApproved: settings.verification.hoursApproved,
      deliveryApproved: settings.verification.deliveryApproved,
      paymentsApproved: settings.verification.paymentsApproved,
    },
  };
}

export function resolveDeliveryQuote(settings, { subtotal, address } = {}) {
  if (!settings.fulfillment.deliveryEnabled || !settings.verification.deliveryApproved) {
    return {
      available: false,
      fee: null,
      message: 'Delivery zones and fees are not open yet.',
    };
  }

  if (settings.fulfillment.orderingPaused) {
    return { available: false, fee: null, message: 'Ordering is temporarily paused.' };
  }

  const zones = settings.fulfillment.deliveryZones.filter(
    (zone) => zone.isActive && zone.isVerified,
  );
  if (zones.length === 0) {
    return {
      available: false,
      fee: null,
      message: 'No delivery zones have been approved yet.',
    };
  }

  const addressText = [address?.line1, address?.line2, address?.city, address?.district, address?.sector]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (!addressText) {
    return {
      available: false,
      fee: null,
      message: 'Enter a delivery address to check the fee.',
    };
  }

  const zone = zones.find((candidate) =>
    candidate.areas.some((area) => area && addressText.includes(area.toLowerCase())),
  );

  if (!zone) {
    return {
      available: false,
      fee: null,
      message: 'This address is outside the approved delivery areas.',
    };
  }

  const minimum = Math.max(settings.fulfillment.minOrder ?? 0, zone.minOrder ?? 0);
  if (subtotal < minimum) {
    return {
      available: false,
      fee: null,
      zoneName: zone.name,
      minOrder: minimum,
      message: `The minimum order for ${zone.name} is ${minimum} RWF.`,
    };
  }

  return {
    available: true,
    fee: zone.fee,
    zoneName: zone.name,
    minOrder: minimum,
    etaMinutes: zone.etaMinutes,
    message: `Delivery to ${zone.name} is available.`,
  };
}

export function isPaymentMethodEnabled(settings, method) {
  if (!settings.payments.acceptedMethods.includes(method)) return false;
  return effectiveEnabledPaymentMethods(settings).includes(method);
}

export function isOnlinePaymentsReady(settings) {
  return onlinePaymentsReady(settings);
}

export { PAYMENT_METHODS };
