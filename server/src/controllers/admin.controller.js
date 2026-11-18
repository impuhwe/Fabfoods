import { asyncHandler } from '../middleware/errorHandler.js';
import { assertPermission } from '../middleware/auth.js';
import { PERMISSIONS } from '../config/permissions.js';
import { sendSuccess } from '../utils/response.js';
import { getSettings, toPublicSettings, updateSettings } from '../services/settings.service.js';
import * as orderService from '../services/order.service.js';
import * as reservationService from '../services/reservation.service.js';
import * as emailService from '../services/email.service.js';
import * as adminMenuService from '../services/adminMenu.service.js';
import * as cloudinaryService from '../services/cloudinary.service.js';
import EmailOutbox from '../models/EmailOutbox.js';
import { notFound } from '../utils/errors.js';
import { listAuditLogs, recordAudit } from '../services/audit.service.js';
import * as adminUserService from '../services/adminUser.service.js';
import * as dashboardService from '../services/dashboard.service.js';

function hasSensitiveSettings(body) {
  const verification = body.verification ?? {};
  const payments = body.payments ?? {};
  const fulfillment = body.fulfillment ?? {};
  return (
    Object.keys(verification).length > 0 ||
    payments.onlineEnabled !== undefined ||
    payments.enabledMethods !== undefined ||
    fulfillment.deliveryEnabled !== undefined ||
    (fulfillment.deliveryZones ?? []).some((zone) => zone.isVerified !== undefined)
  );
}

export const settings = asyncHandler(async (_req, res) => {
  const settings = await getSettings();
  sendSuccess(res, { settings: settings.toJSON(), publicSettings: toPublicSettings(settings) });
});

export const update = asyncHandler(async (req, res) => {
  if (hasSensitiveSettings(req.body)) {
    assertPermission(req, PERMISSIONS.SETTINGS_SENSITIVE_UPDATE);
    if (Object.keys(req.body.verification ?? {}).length > 0) {
      assertPermission(req, PERMISSIONS.SETTINGS_VERIFICATION_APPROVE);
    }
  }

  const settings = await updateSettings(req.body);
  await recordAudit(req, {
    action: 'settings.update',
    targetType: 'restaurantSettings',
    targetId: 'default',
    summary: 'Restaurant settings updated',
    metadata: { fields: Object.keys(req.body) },
  });
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
  await recordAudit(req, {
    action: 'order.payment.update',
    targetType: 'order',
    targetId: req.params.id,
    summary: `Payment marked ${req.body.paymentStatus}`,
    metadata: { paymentStatus: req.body.paymentStatus },
  });
  sendSuccess(res, { order });
});

export const reservations = asyncHandler(async (req, res) => {
  const result = await reservationService.listAdminReservations(req.query);
  sendSuccess(res, result.reservations, 200, result.meta);
});

export const reservationDetail = asyncHandler(async (req, res) => {
  const reservation = await reservationService.getAdminReservation(req.params.id);
  sendSuccess(res, { reservation });
});

export const rescheduleReservation = asyncHandler(async (req, res) => {
  const reservation = await reservationService.rescheduleAdminReservation(
    req.params.id,
    req.body,
    req.user.id,
  );
  await recordAudit(req, {
    action: 'reservation.reschedule',
    targetType: 'reservation',
    targetId: req.params.id,
    summary: `Reservation rescheduled to ${req.body.date} at ${req.body.time}`,
  });
  sendSuccess(res, { reservation });
});

export const updateReservationStatus = asyncHandler(async (req, res) => {
  const reservation = await reservationService.updateReservationStatus(
    req.params.id,
    req.body.status,
    req.body.note,
    req.user.id,
  );
  await recordAudit(req, {
    action: 'reservation.status.update',
    targetType: 'reservation',
    targetId: req.params.id,
    summary: `Reservation status changed to ${req.body.status}`,
  });
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
  await recordAudit(req, {
    action: 'email.retry',
    targetType: 'emailOutbox',
    targetId: req.params.id,
    summary: 'Email delivery retried',
  });
  sendSuccess(res, { email });
});

export const processEmails = asyncHandler(async (req, res) => {
  const result = await emailService.processEmailOutbox();
  await recordAudit(req, {
    action: 'email.process',
    targetType: 'emailOutbox',
    summary: 'Email outbox processed',
    metadata: result,
  });
  sendSuccess(res, result);
});

export const menuItems = asyncHandler(async (req, res) => {
  const result = await adminMenuService.listAdminMenuItems(req.query);
  sendSuccess(res, result.items, 200, result.meta);
});

export const menuCategories = asyncHandler(async (_req, res) => {
  sendSuccess(res, { categories: await adminMenuService.listAdminMenuCategories() });
});

export const createMenuItem = asyncHandler(async (req, res) => {
  const item = await adminMenuService.createAdminMenuItem(req.body, req.user);
  await recordAudit(req, {
    action: 'menu.item.create',
    targetType: 'menuItem',
    targetId: item.id,
    summary: `Created unverified menu item ${item.name}`,
  });
  sendSuccess(res, { item }, 201);
});

export const createMenuCategory = asyncHandler(async (req, res) => {
  const category = await adminMenuService.createAdminMenuCategory(req.body);
  await recordAudit(req, {
    action: 'menu.category.create',
    targetType: 'menuCategory',
    targetId: category.id,
    summary: `Created menu category ${category.name}`,
  });
  sendSuccess(res, { category }, 201);
});

export const updateMenuCategory = asyncHandler(async (req, res) => {
  const category = await adminMenuService.updateAdminMenuCategory(req.params.id, req.body);
  await recordAudit(req, {
    action: 'menu.category.update',
    targetType: 'menuCategory',
    targetId: category.id,
    summary: `Updated menu category ${category.name}`,
  });
  sendSuccess(res, { category });
});

export const menuReviewIssues = asyncHandler(async (_req, res) => {
  sendSuccess(res, { issues: await adminMenuService.listAdminReviewIssues() });
});

export const menuImageStatus = asyncHandler(async (_req, res) => {
  sendSuccess(res, cloudinaryService.cloudinaryStatus());
});

export const menuImageUploadSignature = asyncHandler(async (_req, res) => {
  sendSuccess(res, cloudinaryService.createMenuImageUploadSignature());
});

export const menuImageDelete = asyncHandler(async (req, res) => {
  const result = await cloudinaryService.deleteCloudinaryImage(req.body.publicId);
  await recordAudit(req, {
    action: 'menu.image.delete',
    targetType: 'menuImage',
    targetId: req.body.publicId,
    summary: 'Deleted managed menu image',
  });
  sendSuccess(res, result);
});

export const updateMenuItem = asyncHandler(async (req, res) => {
  const item = await adminMenuService.updateAdminMenuItem(req.params.id, req.body, req.user);
  await recordAudit(req, {
    action: 'menu.item.update',
    targetType: 'menuItem',
    targetId: item.id,
    summary: `Updated menu item ${item.name}`,
  });
  sendSuccess(res, { item });
});

export const verifyMenuItem = asyncHandler(async (req, res) => {
  const item = await adminMenuService.verifyAdminMenuItem(req.params.id, req.body, req.user);
  await recordAudit(req, {
    action: 'menu.item.verify',
    targetType: 'menuItem',
    targetId: item.id,
    summary: `Verified menu item ${item.name}`,
  });
  sendSuccess(res, { item });
});

export const setMenuItemAvailability = asyncHandler(async (req, res) => {
  const item = await adminMenuService.setAdminMenuItemAvailability(
    req.params.id,
    req.body.isAvailable,
    req.user,
  );
  await recordAudit(req, {
    action: 'menu.item.availability',
    targetType: 'menuItem',
    targetId: item.id,
    summary: `Menu item availability set to ${req.body.isAvailable}`,
  });
  sendSuccess(res, { item });
});

export const archiveMenuItem = asyncHandler(async (req, res) => {
  const item = await adminMenuService.setAdminMenuItemArchived(req.params.id, true, req.user);
  await recordAudit(req, {
    action: 'menu.item.archive',
    targetType: 'menuItem',
    targetId: item.id,
    summary: `Archived menu item ${item.name}`,
  });
  sendSuccess(res, { item });
});

export const restoreMenuItem = asyncHandler(async (req, res) => {
  const item = await adminMenuService.setAdminMenuItemArchived(req.params.id, false, req.user);
  await recordAudit(req, {
    action: 'menu.item.restore',
    targetType: 'menuItem',
    targetId: item.id,
    summary: `Restored menu item ${item.name}`,
  });
  sendSuccess(res, { item });
});

export const resolveMenuIssue = asyncHandler(async (req, res) => {
  const issue = await adminMenuService.resolveAdminReviewIssue(
    req.params.id,
    req.body,
    req.user.id,
  );
  await recordAudit(req, {
    action: 'menu.issue.resolve',
    targetType: 'menuReviewIssue',
    targetId: issue.id,
    summary: `Review issue ${req.body.status}`,
  });
  sendSuccess(res, { issue });
});

export const dashboard = asyncHandler(async (_req, res) => {
  sendSuccess(res, await dashboardService.getDashboardStats());
});

export const customers = asyncHandler(async (req, res) => {
  const result = await adminUserService.listCustomers(req.query);
  sendSuccess(res, result.customers, 200, result.meta);
});

export const customerDetail = asyncHandler(async (req, res) => {
  sendSuccess(res, await adminUserService.getCustomerDetails(req.params.id));
});

export const setCustomerStatus = asyncHandler(async (req, res) => {
  const customer = await adminUserService.setCustomerStatus(req.params.id, req.body.status);
  await recordAudit(req, {
    action: 'customer.status.update',
    targetType: 'customer',
    targetId: customer.id,
    summary: `Customer account ${req.body.status}`,
  });
  sendSuccess(res, { customer });
});

export const staff = asyncHandler(async (req, res) => {
  const result = await adminUserService.listStaff(req.query);
  sendSuccess(res, result.staff, 200, result.meta);
});

export const createStaff = asyncHandler(async (req, res) => {
  const result = await adminUserService.createStaff(req.body);
  await recordAudit(req, {
    action: 'staff.create',
    targetType: 'staffUser',
    targetId: result.user.id,
    summary: `Created ${result.user.role} account ${result.user.email}`,
    metadata: { role: result.user.role },
  });
  sendSuccess(res, result, 201);
});

export const updateStaff = asyncHandler(async (req, res) => {
  const user = await adminUserService.updateStaff(req.params.id, req.body, req.user);
  await recordAudit(req, {
    action: 'staff.update',
    targetType: 'staffUser',
    targetId: user.id,
    summary: `Updated staff account ${user.email}`,
    metadata: { fields: Object.keys(req.body).filter((key) => key !== 'reason') },
  });
  sendSuccess(res, { user });
});

export const auditLogs = asyncHandler(async (req, res) => {
  sendSuccess(res, await listAuditLogs(req.query));
});
