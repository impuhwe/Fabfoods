import { ORDER_STATUSES, PAYMENT_STATUSES } from '../config/constants.js';
import Order from '../models/Order.js';
import PaymentTransaction from '../models/PaymentTransaction.js';
import { getPaymentProvider, isOnlinePaymentMethod } from '../payments/providers/index.js';
import { enqueueEmail } from './email.service.js';
import { conflict, forbidden, notFound, serviceUnavailable } from '../utils/errors.js';

function publicTransaction(transaction) {
  return {
    id: String(transaction._id ?? transaction.id),
    provider: transaction.provider,
    method: transaction.method,
    status: transaction.status,
    amount: transaction.amount,
    currency: transaction.currency,
    providerReference: transaction.providerReference,
    providerTransactionId: transaction.providerTransactionId,
    checkoutUrl: transaction.checkoutUrl,
    verifiedAt: transaction.verifiedAt,
    failureReason: transaction.failureReason,
    createdAt: transaction.createdAt,
  };
}

async function confirmPaidOrder(transaction, verification) {
  const order = await Order.findById(transaction.order);
  if (!order) throw notFound('Order not found for payment');

  if (verification.amount !== order.total || verification.currency !== order.currency) {
    await PaymentTransaction.updateOne(
      { _id: transaction._id },
      {
        $set: {
          status: PAYMENT_STATUSES.FAILED,
          failureReason: 'Payment amount or currency did not match the order',
          providerTransactionId: verification.providerTransactionId,
        },
      },
    );
    throw conflict('The payment amount did not match the order', 'PAYMENT_MISMATCH');
  }

  const claimed = await PaymentTransaction.findOneAndUpdate(
    {
      _id: transaction._id,
      status: {
        $in: [
          PAYMENT_STATUSES.PENDING,
          PAYMENT_STATUSES.REQUIRES_ACTION,
          PAYMENT_STATUSES.PROCESSING,
        ],
      },
    },
    {
      $set: {
        status: PAYMENT_STATUSES.PAID,
        verifiedAt: new Date(),
        providerTransactionId: verification.providerTransactionId,
        failureReason: '',
      },
    },
    { new: true },
  );

  if (!claimed) {
    return {
      transaction: await PaymentTransaction.findById(transaction._id),
      order,
      alreadyPaid: true,
    };
  }

  if (order.paymentStatus !== PAYMENT_STATUSES.PAID) {
    order.paymentStatus = PAYMENT_STATUSES.PAID;
    if (order.status === ORDER_STATUSES.PENDING_PAYMENT) {
      order.status = ORDER_STATUSES.CONFIRMED;
      order.confirmedAt = new Date();
      order.statusHistory.push({
        status: ORDER_STATUSES.CONFIRMED,
        note: 'Payment verified by the provider',
        changedAt: new Date(),
      });
    } else if (order.status === ORDER_STATUSES.CANCELLED) {
      order.statusHistory.push({
        status: ORDER_STATUSES.CANCELLED,
        note: 'Payment arrived after cancellation; a manual refund is required',
        changedAt: new Date(),
      });
    }
    await order.save();

    await enqueueEmail({
      to: order.customer.email,
      template: 'payment_confirmation',
      payload: { order: order.toJSON() },
      dedupeKey: `payment-confirmation:${transaction._id}`,
      user: order.user,
      order: order._id,
    });
  }

  return { transaction: claimed, order, alreadyPaid: false };
}

export async function initiatePayment(order, { redirectUrl } = {}) {
  if (!isOnlinePaymentMethod(order.paymentMethod)) {
    throw conflict('This order does not use online payment', 'OFFLINE_PAYMENT');
  }
  if (order.paymentStatus === PAYMENT_STATUSES.PAID) {
    throw conflict('This order is already paid', 'ORDER_ALREADY_PAID');
  }
  if (order.status === ORDER_STATUSES.CANCELLED) {
    throw conflict('This order was cancelled', 'ORDER_CANCELLED');
  }

  const existing = await PaymentTransaction.findOne({
    order: order._id,
    method: order.paymentMethod,
    status: { $in: [PAYMENT_STATUSES.PENDING, PAYMENT_STATUSES.REQUIRES_ACTION] },
  }).sort({ createdAt: -1 });

  if (existing?.checkoutUrl) {
    return { transaction: publicTransaction(existing), order, reused: true };
  }

  const provider = getPaymentProvider();
  if (!provider?.isConfigured()) {
    throw serviceUnavailable('Online payments are not configured');
  }

  const action = await provider.initiatePayment({
    order,
    method: order.paymentMethod,
    redirectUrl,
  });

  const transaction = await PaymentTransaction.create({
    order: order._id,
    provider: action.provider,
    method: order.paymentMethod,
    status: PAYMENT_STATUSES.REQUIRES_ACTION,
    amount: order.total,
    currency: order.currency,
    providerReference: action.providerReference,
    checkoutUrl: action.checkoutUrl,
  });

  order.paymentStatus = PAYMENT_STATUSES.REQUIRES_ACTION;
  await order.save();

  return { transaction: publicTransaction(transaction), order, reused: false };
}

export async function verifyPayment(order) {
  const transaction = await PaymentTransaction.findOne({ order: order._id }).sort({
    createdAt: -1,
  });
  if (!transaction) throw notFound('No payment has been started for this order');
  if (transaction.status === PAYMENT_STATUSES.PAID) {
    return { transaction: publicTransaction(transaction), order, alreadyPaid: true };
  }

  const provider = getPaymentProvider(transaction.provider);
  if (!provider?.isConfigured()) {
    throw serviceUnavailable('Online payments are not configured');
  }

  const verification = await provider.verifyPayment({
    providerReference: transaction.providerReference,
  });

  if (verification.failed) {
    await PaymentTransaction.updateOne(
      { _id: transaction._id },
      {
        $set: {
          status: PAYMENT_STATUSES.FAILED,
          failureReason: `Provider status: ${verification.status}`,
          providerTransactionId: verification.providerTransactionId,
        },
      },
    );
    return {
      transaction: publicTransaction(await PaymentTransaction.findById(transaction._id)),
      order,
      failed: true,
    };
  }

  if (!verification.paid) {
    return { transaction: publicTransaction(transaction), order, pending: true };
  }

  const result = await confirmPaidOrder(transaction, verification);
  return {
    transaction: publicTransaction(result.transaction),
    order: result.order,
    alreadyPaid: result.alreadyPaid,
  };
}

export async function handlePaymentWebhook(providerName, req) {
  const provider = getPaymentProvider(providerName);
  if (!provider?.isConfigured()) throw notFound('Unknown payment provider');

  const event = provider.verifyWebhook({
    headers: req.headers,
    body: req.body,
    rawBody: req.rawBody,
  });
  if (!event) throw forbidden('Invalid payment webhook signature', 'INVALID_WEBHOOK');

  const transaction = await PaymentTransaction.findOne({
    providerReference: event.providerReference,
  });
  if (!transaction) return { ignored: true, reason: 'Unknown payment reference' };

  if (event.eventId && transaction.webhookEventIds.includes(event.eventId)) {
    return { ignored: true, reason: 'Duplicate event' };
  }

  const verification = await provider.verifyPayment({
    providerReference: transaction.providerReference,
  });

  let result;
  if (verification.paid) {
    result = await confirmPaidOrder(transaction, verification);
  } else if (verification.failed) {
    await PaymentTransaction.updateOne(
      { _id: transaction._id },
      {
        $set: {
          status: PAYMENT_STATUSES.FAILED,
          failureReason: `Provider status: ${verification.status}`,
          providerTransactionId: verification.providerTransactionId,
        },
      },
    );
    result = { transaction: await PaymentTransaction.findById(transaction._id) };
  } else {
    result = { transaction, pending: true };
  }

  if (event.eventId) {
    await PaymentTransaction.updateOne(
      { _id: transaction._id },
      { $addToSet: { webhookEventIds: event.eventId } },
    );
  }

  return {
    ignored: false,
    transaction: publicTransaction(result.transaction),
    alreadyPaid: Boolean(result.alreadyPaid),
  };
}

export async function listTransactionsForOrder(orderId) {
  const transactions = await PaymentTransaction.find({ order: orderId }).sort({ createdAt: -1 });
  return transactions.map(publicTransaction);
}

export { publicTransaction };
