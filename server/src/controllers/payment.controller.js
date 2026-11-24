import { asyncHandler } from '../middleware/errorHandler.js';
import { sendSuccess } from '../utils/response.js';
import { handlePaymentWebhook } from '../services/payment.service.js';

export const webhook = asyncHandler(async (req, res) => {
  const result = await handlePaymentWebhook(req.params.provider, req);
  sendSuccess(res, result);
});
