import { randomInt } from 'node:crypto';
import {
  FULFILLMENT_TYPES,
  ORDER_STATUSES,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
} from '../config/constants.js';
import Order from '../models/Order.js';
import PaymentTransaction from '../models/PaymentTransaction.js';
import { quoteOrder } from './orderQuote.service.js';
import {
  getSettings,
  isOnlinePaymentsReady,
  isPaymentMethodEnabled,
} from './settings.service.js';
import { isOnlinePaymentMethod, getPaymentProvider } from '../payments/providers/index.js';
import { enqueueEmail } from './email.service.js';
import { listTransactionsForOrder } from './payment.service.js';
import { badRequest, conflict, notFound, serviceUnavailable } from '../utils/errors.js';

const STATUS_COPY = {
  [ORDER_STATUSES.PENDING_PAYMENT]: {
    label: 'Awaiting payment',
    message: 'Your order is saved and will be reviewed after payment is confirmed.',
  },
  [ORDER_STATUSES.CONFIRMED]: {
    label: 'Confirmed',
    message: 'The restaurant has received your order.',
  },
  [ORDER_STATUSES.PREPARING]: {
    label: 'Preparing',
    message: 'The kitchen is preparing your order.',
  },
  [ORDER_STATUSES.READY]: {
    label: 'Ready',
    message: 'Your order is ready.',
  },
  [ORDER_STATUSES.OUT_FOR_DELIVERY]: {
    label: 'Out for delivery',
    message: 'Your order is on the way.',
  },
  [ORDER_STATUSES.COMPLETED]: {
    label: 'Completed',
    message: 'This order is complete.',
  },
  [ORDER_STATUSES.CANCELLED]: {
    label: 'Cancelled',
    message: 'This order was cancelled.',
  },
};

const ALLOWED_STATUS_TRANSITIONS = {
  [ORDER_STATUSES.PENDING_PAYMENT]: [ORDER_STATUSES.CONFIRMED, ORDER_STATUSES.CANCELLED],
  [ORDER_STATUSES.CONFIRMED]: [ORDER_STATUSES.PREPARING, ORDER_STATUSES.CANCELLED],
  [ORDER_STATUSES.PREPARING]: [ORDER_STATUSES.READY, ORDER_STATUSES.CANCELLED],
  [ORDER_STATUSES.READY]: [
    ORDER_STATUSES.OUT_FOR_DELIVERY,
    ORDER_STATUSES.COMPLETED,
    ORDER_STATUSES.CANCELLED,
  ],
  [ORDER_STATUSES.OUT_FOR_DELIVERY]: [ORDER_STATUSES.COMPLETED, ORDER_STATUSES.CANCELLED],
  [ORDER_STATUSES.COMPLETED]: [],
  [ORDER_STATUSES.CANCELLED]: [],
};

function referenceFor() {
  const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Kigali' })
    .format(new Date())
    .replaceAll('-', '')
    .slice(2);
  return `FF-${date}-${randomInt(100000, 1000000)}`;
}

function statusCopy(status) {
  return STATUS_COPY[status] ?? STATUS_COPY[ORDER_STATUSES.PENDING_PAYMENT];
}

export function toPublicOrder(order) {
  const copy = statusCopy(order.status);
  return {
    id: String(order._id ?? order.id),
    orderNumber: order.orderNumber,
    customer: order.customer,
    fulfillmentType: order.fulfillmentType,
    deliveryAddress: order.deliveryAddress,
    notes: order.notes ?? '',
    items: order.items,
    subtotal: order.subtotal,
    deliveryFee: order.deliveryFee,
    total: order.total,
    currency: order.currency,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    status: order.status,
    statusLabel: copy.label,
    statusMessage: copy.message,
    statusHistory: (order.statusHistory ?? []).map((event) => ({
      status: event.status,
      note: event.note ?? '',
      changedAt: event.changedAt,
    })),
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

function assertCanView(order, actor = {}) {
  if (order.user) {
    if (!actor.user || String(order.user) !== actor.user.id) {
      throw notFound('Order not found');
    }
    return;
  }

  if (!actor.email || order.customer.email !== actor.email.toLowerCase()) {
    throw notFound('Order not found');
  }
}

function addHistory(order, status, note, changedBy = null) {
  order.statusHistory.push({ status, note, changedBy, changedAt: new Date() });
}

async function notifyOrder(order, template, payload, dedupeKey) {
  await enqueueEmail({
    to: order.customer.email,
    template,
    payload,
    dedupeKey,
    user: order.user,
    order: order._id,
  });
}

export async function createOrder(input, user = null, idempotencyKey = null) {
  if (idempotencyKey) {
    const existing = await Order.findOne({ idempotencyKey });
    if (existing) {
      assertCanView(existing, { user, email: input.customer.email });
      return { order: toPublicOrder(existing), paymentAction: null, replayed: true };
    }
  }

  const settings = await getSettings();

  if (settings.fulfillment.orderingPaused) {
    throw conflict('Ordering is temporarily paused. Please try again later.', 'ORDERING_PAUSED');
  }

  if (!isPaymentMethodEnabled(settings, input.paymentMethod)) {
    throw conflict('That payment method is not available right now', 'PAYMENT_METHOD_UNAVAILABLE');
  }

  if (
    input.paymentMethod === PAYMENT_METHODS.CASH_ON_DELIVERY &&
    input.fulfillmentType !== FULFILLMENT_TYPES.DELIVERY
  ) {
    throw badRequest('Cash on delivery is only available for delivery orders');
  }
  if (
    input.paymentMethod === PAYMENT_METHODS.PAY_AT_RESTAURANT &&
    input.fulfillmentType !== FULFILLMENT_TYPES.PICKUP
  ) {
    throw badRequest('Pay at the restaurant is only available for pickup orders');
  }

  const quote = await quoteOrder(input, settings);
  if (!quote.fulfillment.available) {
    throw conflict(
      quote.fulfillment.message ?? 'That fulfillment option is not available',
      'FULFILLMENT_UNAVAILABLE',
    );
  }

  const online = isOnlinePaymentMethod(input.paymentMethod);
  if (online && !isOnlinePaymentsReady(settings)) {
    throw conflict('Online payment is not available right now', 'ONLINE_PAYMENT_UNAVAILABLE');
  }

  const initialStatus = online ? ORDER_STATUSES.PENDING_PAYMENT : ORDER_STATUSES.CONFIRMED;
  const orderData = {
    orderNumber: referenceFor(),
    user: user?.id ?? null,
    customer: input.customer,
    fulfillmentType: input.fulfillmentType,
    deliveryAddress: input.deliveryAddress ?? {},
    notes: input.notes ?? '',
    items: quote.items,
    subtotal: quote.subtotal,
    deliveryFee: quote.deliveryFee,
    total: quote.total,
    currency: quote.currency,
    paymentMethod: input.paymentMethod,
    paymentStatus: PAYMENT_STATUSES.PENDING,
    status: initialStatus,
    statusHistory: [
      {
        status: initialStatus,
        note: online ? 'Order placed, awaiting online payment' : 'Order placed with payment due later',
        changedAt: new Date(),
      },
    ],
    idempotencyKey: idempotencyKey || null,
    source: 'website',
    confirmedAt: online ? null : new Date(),
  };

  let order;
  for (let attempt = 0; attempt < 6; attempt += 1) {
    try {
      order = await Order.create(orderData);
      break;
    } catch (error) {
      if (error?.code === 11000 && error?.keyPattern?.orderNumber && attempt < 5) {
        orderData.orderNumber = referenceFor();
        continue;
      }
      if (error?.code === 11000 && idempotencyKey) {
        const existing = await Order.findOne({ idempotencyKey });
        if (existing) {
          assertCanView(existing, { user, email: input.customer.email });
          return { order: toPublicOrder(existing), paymentAction: null, replayed: true };
        }
      }
      throw error;
    }
  }

  if (!order) throw serviceUnavailable('Unable to create an order reference');

  let paymentAction = null;
  if (online) {
    try {
      const provider = getPaymentProvider();
      if (!provider) throw serviceUnavailable('Online payments are not configured');
      const action = await provider.initiatePayment({
        order,
        method: input.paymentMethod,
        redirectUrl: null,
      });
      await PaymentTransaction.create({
        order: order._id,
        provider: action.provider,
        method: input.paymentMethod,
        status: PAYMENT_STATUSES.REQUIRES_ACTION,
        amount: order.total,
        currency: order.currency,
        providerReference: action.providerReference,
        checkoutUrl: action.checkoutUrl,
      });
      order.paymentStatus = PAYMENT_STATUSES.REQUIRES_ACTION;
      await order.save();
      paymentAction = {
        provider: action.provider,
        checkoutUrl: action.checkoutUrl,
        providerReference: action.providerReference,
      };
    } catch (error) {
      order.status = ORDER_STATUSES.CANCELLED;
      order.paymentStatus = PAYMENT_STATUSES.FAILED;
      order.cancelledAt = new Date();
      addHistory(order, ORDER_STATUSES.CANCELLED, 'Payment could not be started');
      await order.save();
      throw error;
    }
  }

  await notifyOrder(
    order,
    'order_confirmation',
    { order: toPublicOrder(order) },
    `order-confirmation:${order._id}`,
  );

  return {
    order: toPublicOrder(order),
    paymentAction,
    replayed: false,
    message: online
      ? 'Order saved. Complete payment with the provider to confirm it.'
      : 'Order received. The restaurant will review it and confirm payment separately.',
  };
}

export async function getOrderForActor(orderNumber, actor) {
  const order = await Order.findOne({ orderNumber });
  if (!order) throw notFound('Order not found');
  assertCanView(order, actor);
  return order;
}

export async function getPublicOrder(orderNumber, actor) {
  const order = await getOrderForActor(orderNumber, actor);
  return toPublicOrder(order);
}

export async function getAdminOrder(orderId) {
  const order = await Order.findById(orderId);
  if (!order) throw notFound('Order not found');
  return {
    order: toPublicOrder(order),
    payments: await listTransactionsForOrder(order._id),
  };
}

export async function listUserOrders(userId, { page = 1, limit = 20 } = {}) {
  const skip = (page - 1) * limit;
  const [orders, total] = await Promise.all([
    Order.find({ user: userId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Order.countDocuments({ user: userId }),
  ]);

  return {
    orders: orders.map(toPublicOrder),
    meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
}

export async function listAdminOrders({ status, page = 1, limit = 50 } = {}) {
  const filter = status ? { status } : {};
  const skip = (page - 1) * limit;
  const [orders, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Order.countDocuments(filter),
  ]);
  return {
    orders: orders.map(toPublicOrder),
    meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
}

export async function cancelOrder(orderNumber, actor, reason = '') {
  const order = await getOrderForActor(orderNumber, actor);
  if (![ORDER_STATUSES.PENDING_PAYMENT, ORDER_STATUSES.CONFIRMED].includes(order.status)) {
    throw conflict('This order can no longer be cancelled online', 'ORDER_NOT_CANCELLABLE');
  }
  if (order.paymentStatus === PAYMENT_STATUSES.PAID) {
    throw conflict('Contact the restaurant to discuss a refund', 'ORDER_PAID');
  }

  order.status = ORDER_STATUSES.CANCELLED;
  order.paymentStatus = PAYMENT_STATUSES.CANCELLED;
  order.cancelledAt = new Date();
  addHistory(order, ORDER_STATUSES.CANCELLED, reason || 'Cancelled by the customer');
  await order.save();

  await PaymentTransaction.updateMany(
    {
      order: order._id,
      status: { $in: [PAYMENT_STATUSES.PENDING, PAYMENT_STATUSES.REQUIRES_ACTION] },
    },
    { $set: { status: PAYMENT_STATUSES.CANCELLED } },
  );

  await notifyOrder(
    order,
    'order_status_update',
    {
      order: toPublicOrder(order),
      statusLabel: statusCopy(order.status).label,
      note: reason,
    },
    `order-status:${order._id}:${ORDER_STATUSES.CANCELLED}`,
  );

  return toPublicOrder(order);
}

export async function updateOrderStatus(orderId, status, note, adminId) {
  const order = await Order.findById(orderId);
  if (!order) throw notFound('Order not found');

  if (!ALLOWED_STATUS_TRANSITIONS[order.status]?.includes(status)) {
    throw conflict(
      `Order cannot move from ${order.status} to ${status}`,
      'INVALID_STATUS_TRANSITION',
    );
  }

  if (
    status === ORDER_STATUSES.CONFIRMED &&
    isOnlinePaymentMethod(order.paymentMethod) &&
    order.paymentStatus !== PAYMENT_STATUSES.PAID
  ) {
    throw conflict('Online payment has not been verified for this order', 'PAYMENT_NOT_VERIFIED');
  }

  order.status = status;
  if (status === ORDER_STATUSES.CONFIRMED) order.confirmedAt = new Date();
  if (status === ORDER_STATUSES.CANCELLED) {
    order.cancelledAt = new Date();
    if (order.paymentStatus !== PAYMENT_STATUSES.PAID) {
      order.paymentStatus = PAYMENT_STATUSES.CANCELLED;
    }
  }
  addHistory(order, status, note, adminId);
  await order.save();

  await notifyOrder(
    order,
    'order_status_update',
    {
      order: toPublicOrder(order),
      statusLabel: statusCopy(order.status).label,
      note,
    },
    `order-status:${order._id}:${status}:${Date.now()}`,
  );

  return toPublicOrder(order);
}

export async function updateOfflinePaymentStatus(orderId, paymentStatus, note, adminId) {
  const order = await Order.findById(orderId);
  if (!order) throw notFound('Order not found');
  if (isOnlinePaymentMethod(order.paymentMethod)) {
    throw conflict(
      'Online payments must be confirmed by the payment provider',
      'PROVIDER_VERIFICATION_REQUIRED',
    );
  }
  if (
    ![PAYMENT_STATUSES.PENDING, PAYMENT_STATUSES.PAID, PAYMENT_STATUSES.CANCELLED].includes(
      paymentStatus,
    )
  ) {
    throw badRequest('Unsupported payment status');
  }

  order.paymentStatus = paymentStatus;
  addHistory(order, order.status, `Payment marked ${paymentStatus} by staff`, adminId);
  await order.save();

  if (paymentStatus === PAYMENT_STATUSES.PAID) {
    await notifyOrder(
      order,
      'payment_confirmation',
      { order: toPublicOrder(order) },
      `payment-confirmation:${order._id}`,
    );
  }

  return toPublicOrder(order);
}

export { statusCopy };
