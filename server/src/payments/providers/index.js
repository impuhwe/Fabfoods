import env from '../../config/env.js';
import { PAYMENT_METHODS } from '../../config/constants.js';
import flutterwaveProvider from './flutterwave.provider.js';

const PROVIDERS = Object.freeze({
  flutterwave: flutterwaveProvider,
});

export function getPaymentProvider(name = env.PAYMENT_PROVIDER) {
  if (!name || name === 'disabled') return null;
  return PROVIDERS[name] ?? null;
}

export function isPaymentProviderConfigured(name = env.PAYMENT_PROVIDER) {
  return Boolean(getPaymentProvider(name)?.isConfigured());
}

export function isOnlinePaymentMethod(method) {
  return [PAYMENT_METHODS.MOBILE_MONEY, PAYMENT_METHODS.BANK_CARD].includes(method);
}

export default getPaymentProvider;
