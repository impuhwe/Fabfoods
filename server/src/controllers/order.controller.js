import { asyncHandler } from '../middleware/errorHandler.js';
import { sendSuccess } from '../utils/response.js';
import { quoteOrder } from '../services/orderQuote.service.js';
import * as orderService from '../services/order.service.js';
import * as paymentService from '../services/payment.service.js';

function actorFrom(req, body = {}) {
  return { user: req.user, email: body.email ?? req.query.email };
}

export const quote = asyncHandler(async (req, res) => {
  const quote = await quoteOrder(req.body);
  sendSuccess(res, { quote });
});

export const create = asyncHandler(async (req, res) => {
  const result = await orderService.createOrder(
    req.body,
    req.user,
    req.get('idempotency-key') ?? null,
  );
  sendSuccess(res, result, 201);
});

export const mine = asyncHandler(async (req, res) => {
  const result = await orderService.listUserOrders(req.user.id, {
    page: req.query.page ? Number(req.query.page) : 1,
    limit: req.query.limit ? Number(req.query.limit) : 20,
  });
  sendSuccess(res, result.orders, 200, result.meta);
});

export const get = asyncHandler(async (req, res) => {
  const order = await orderService.getPublicOrder(
    req.params.orderNumber,
    actorFrom(req),
  );
  sendSuccess(res, { order });
});

export const cancel = asyncHandler(async (req, res) => {
  const order = await orderService.cancelOrder(
    req.params.orderNumber,
    actorFrom(req, req.body),
    req.body.reason,
  );
  sendSuccess(res, { order });
});

export const initiatePayment = asyncHandler(async (req, res) => {
  const order = await orderService.getOrderForActor(
    req.params.orderNumber,
    actorFrom(req, req.body),
  );
  const result = await paymentService.initiatePayment(order, {
    redirectUrl: req.body.redirectUrl,
  });
  sendSuccess(res, {
    order: orderService.toPublicOrder(result.order),
    payment: {
      transactionId: result.transaction.id,
      provider: result.transaction.provider,
      providerReference: result.transaction.providerReference,
      checkoutUrl: result.transaction.checkoutUrl,
      status: result.transaction.status,
      reused: result.reused,
    },
  });
});

export const verifyPayment = asyncHandler(async (req, res) => {
  const order = await orderService.getOrderForActor(
    req.params.orderNumber,
    actorFrom(req, req.body),
  );
  const result = await paymentService.verifyPayment(order);
  sendSuccess(res, {
    order: orderService.toPublicOrder(result.order),
    payment: result.transaction,
    pending: Boolean(result.pending),
    failed: Boolean(result.failed),
  });
});
