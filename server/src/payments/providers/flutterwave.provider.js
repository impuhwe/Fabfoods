import { randomUUID } from 'node:crypto';
import env from '../../config/env.js';
import { PAYMENT_METHODS } from '../../config/constants.js';
import { safeEqual } from '../../security/tokens.js';
import { serviceUnavailable } from '../../utils/errors.js';

const BASE_URL = 'https://api.flutterwave.com/v3';

function isConfigured() {
  return Boolean(env.FLUTTERWAVE_SECRET_KEY && env.FLUTTERWAVE_WEBHOOK_HASH);
}

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${env.FLUTTERWAVE_SECRET_KEY}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw serviceUnavailable('The payment provider could not be reached');
  }

  const body = await response.json().catch(() => null);
  if (!response.ok || body?.status === 'error') {
    throw serviceUnavailable(body?.message ?? 'The payment provider rejected the request');
  }
  return body;
}

export const flutterwaveProvider = {
  name: 'flutterwave',
  isConfigured,

  async initiatePayment({ order, method, redirectUrl }) {
    if (!isConfigured()) {
      throw serviceUnavailable('Online payments are not configured');
    }

    const providerReference = `FF-${order.orderNumber}-${randomUUID().slice(0, 8)}`;
    const body = await request('/payments', {
      method: 'POST',
      body: JSON.stringify({
        tx_ref: providerReference,
        amount: order.total,
        currency: order.currency,
        redirect_url:
          redirectUrl ||
          env.PAYMENT_REDIRECT_URL ||
          `${env.clientOrigins[0]}/order/${order.orderNumber}`,
        payment_options: method === PAYMENT_METHODS.MOBILE_MONEY ? 'mobilemoneyrwanda' : 'card',
        customer: {
          email: order.customer.email,
          name: order.customer.name,
          phonenumber: order.customer.phone,
        },
        customizations: {
          title: 'Fabs Restaurant',
          description: `Order ${order.orderNumber}`,
        },
        meta: { orderNumber: order.orderNumber },
      }),
    });

    const checkoutUrl = body?.data?.link;
    if (!checkoutUrl)
      throw serviceUnavailable('The payment provider did not return a checkout link');

    return {
      provider: 'flutterwave',
      providerReference,
      checkoutUrl,
      status: 'requires_action',
    };
  },

  async verifyPayment({ providerReference }) {
    if (!isConfigured()) {
      throw serviceUnavailable('Online payments are not configured');
    }

    const body = await request(
      `/transactions/verify_by_reference?tx_ref=${encodeURIComponent(providerReference)}`,
    );
    const transaction = body?.data;
    if (!transaction) throw serviceUnavailable('The payment provider returned no transaction');

    return {
      paid: transaction.status === 'successful',
      failed: ['failed', 'cancelled'].includes(transaction.status),
      providerTransactionId: transaction.id ? String(transaction.id) : null,
      amount: Number(transaction.amount),
      currency: transaction.currency,
      status: transaction.status,
    };
  },

  verifyWebhook({ headers, body }) {
    const suppliedHash = headers['verif-hash'];
    if (!suppliedHash || !safeEqual(String(suppliedHash), env.FLUTTERWAVE_WEBHOOK_HASH)) {
      return null;
    }

    const providerReference = body?.data?.tx_ref;
    if (typeof providerReference !== 'string' || !providerReference) return null;

    return {
      providerReference,
      eventId: body?.data?.id ? String(body.data.id) : null,
    };
  },
};

export default flutterwaveProvider;
