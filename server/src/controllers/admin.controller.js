import { asyncHandler } from '../middleware/errorHandler.js';
import { sendSuccess } from '../utils/response.js';
import { getSettings, toPublicSettings, updateSettings } from '../services/settings.service.js';
import * as orderService from '../services/order.service.js';
import * as reservationService from '../services/reservation.service.js';
import * as emailService from '../services/email.service.js';
import * as adminMenuService from '../services/adminMenu.service.js';
import EmailOutbox from '../models/EmailOutbox.js';
import { notFound } from '../utils/errors.js';

export const settings = asyncHandler(async (_req, res) => {
  const settings = await getSettings();
  sendSuccess(res, { settings: settings.toJSON(), publicSettings: toPublicSettings(settings) });
});

export const update = asyncHandler(async (req, res) => {
  const settings = await updateSettings(req.body);
  sendSuccess(res, { settings: settings.toJSON(), publicSettings: toPublicSettings(settings) });
});

export const publicSettings = asyncHandler(async (_req, res) => {
  const settings = await getSettings();
  sendSuccess(res, { settings: toPublicSettings(settings) });
});

export const orders = asyncHandler(async (req, res) => {
  const result = await orderService.listAdminOrders(req.query);
  sendSuccess(res, result.orders, 200, result.meta);
});

export const order = asyncHandler(async (req, res) => {
  const order = await orderService.getAdminOrder(req.params.id);
  sendSuccess(res, order);
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await orderService.updateOrderStatus(
    req.params.id,
    req.body.status,
    req.body.note,
    req.user.id,
  );
  sendSuccess(res, { order });
});

export const updateOrderPayment = asyncHandler(async (req, res) => {
  const order = await orderService.updateOfflinePaymentStatus(
    req.params.id,
    req.body.paymentStatus,
    req.body.note,
    req.user.id,
  );
  sendSuccess(res, { order });
});

export const reservations = asyncHandler(async (req, res) => {
  const result = await reservationService.listAdminReservations(req.query);
  sendSuccess(res, result.reservations, 200, result.meta);
});

export const updateReservationStatus = asyncHandler(async (req, res) => {
  const reservation = await reservationService.updateReservationStatus(
    req.params.id,
    req.body.status,
    req.body.note,
    req.user.id,
  );
  sendSuccess(res, { reservation });
});

export const emails = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 50 } = req.query;
  const filter = status ? { status } : {};
  const skip = (page - 1) * limit;
  const [emails, total] = await Promise.all([
    EmailOutbox.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    EmailOutbox.countDocuments(filter),
  ]);
  sendSuccess(res, { emails }, 200, {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  });
});

export const retryEmail = asyncHandler(async (req, res) => {
  const email = await emailService.retryEmail(req.params.id);
  if (!email) throw notFound('Email not found');
  sendSuccess(res, { email });
});

export const processEmails = asyncHandler(async (_req, res) => {
  const result = await emailService.processEmailOutbox();
  sendSuccess(res, result);
});

export const menuItems = asyncHandler(async (req, res) => {
  const result = await adminMenuService.listAdminMenuItems(req.query);
  sendSuccess(res, result.items, 200, result.meta);
});

export const menuCategories = asyncHandler(async (_req, res) => {
  sendSuccess(res, { categories: await adminMenuService.listAdminMenuCategories() });
});

export const menuReviewIssues = asyncHandler(async (_req, res) => {
  sendSuccess(res, { issues: await adminMenuService.listAdminReviewIssues() });
});

export const updateMenuItem = asyncHandler(async (req, res) => {
  const item = await adminMenuService.updateAdminMenuItem(
    req.params.id,
    req.body,
    req.user.id,
  );
  sendSuccess(res, { item });
});

export const verifyMenuItem = asyncHandler(async (req, res) => {
  const item = await adminMenuService.verifyAdminMenuItem(
    req.params.id,
    req.body,
    req.user.id,
  );
  sendSuccess(res, { item });
});

export const archiveMenuItem = asyncHandler(async (req, res) => {
  const item = await adminMenuService.setAdminMenuItemArchived(req.params.id, true, req.user.id);
  sendSuccess(res, { item });
});

export const restoreMenuItem = asyncHandler(async (req, res) => {
  const item = await adminMenuService.setAdminMenuItemArchived(req.params.id, false, req.user.id);
  sendSuccess(res, { item });
});

export const resolveMenuIssue = asyncHandler(async (req, res) => {
  const issue = await adminMenuService.resolveAdminReviewIssue(
    req.params.id,
    req.body,
    req.user.id,
  );
  sendSuccess(res, { issue });
});
