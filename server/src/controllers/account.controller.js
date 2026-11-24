import { asyncHandler } from '../middleware/errorHandler.js';
import { sendSuccess } from '../utils/response.js';
import * as accountService from '../services/account.service.js';
import * as orderService from '../services/order.service.js';

export const updateProfile = asyncHandler(async (req, res) => {
  const user = await accountService.updateProfile(req.user.id, req.body);
  sendSuccess(res, { user });
});

export const changePassword = asyncHandler(async (req, res) => {
  await accountService.changePassword(
    req.user.id,
    req.auth.sid,
    req.body.currentPassword,
    req.body.newPassword,
  );
  sendSuccess(res, {
    message: 'Password updated. Other signed-in devices have been signed out.',
  });
});

export const orders = asyncHandler(async (req, res) => {
  const result = await orderService.listUserOrders(req.user.id, {
    page: req.query.page ? Number(req.query.page) : 1,
    limit: req.query.limit ? Number(req.query.limit) : 20,
  });
  sendSuccess(res, result.orders, 200, result.meta);
});

export const order = asyncHandler(async (req, res) => {
  const order = await orderService.getPublicOrder(req.params.orderNumber, {
    user: req.user,
  });
  sendSuccess(res, { order });
});
