import { PAYMENT_STATUSES, RESERVATION_STATUSES, ROLES } from '../config/constants.js';
import Order from '../models/Order.js';
import Reservation from '../models/Reservation.js';
import MenuItem from '../models/MenuItem.js';
import MenuReviewIssue from '../models/MenuReviewIssue.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';

function countBy(rows) {
  return rows.reduce((result, row) => {
    result[row._id] = row.count;
    return result;
  }, {});
}

async function revenue() {
  const [result] = await Order.aggregate([
    { $match: { paymentStatus: PAYMENT_STATUSES.PAID } },
    { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } },
  ]);
  return { total: result?.total ?? 0, paidOrders: result?.count ?? 0 };
}

export async function getDashboardStats() {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [
    orderCounts,
    reservationCounts,
    paidRevenue,
    customers,
    verifiedItems,
    pendingItems,
    unresolvedIssues,
    todayOrders,
    recentOrders,
    recentReservations,
    recentActivity,
  ] = await Promise.all([
    Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Reservation.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    revenue(),
    User.countDocuments({ role: ROLES.CUSTOMER }),
    MenuItem.countDocuments({ verified: true, isArchived: false }),
    MenuItem.countDocuments({ needsReview: true, isArchived: false }),
    MenuReviewIssue.countDocuments({ status: { $ne: 'resolved' }, blocking: true }),
    Order.countDocuments({ createdAt: { $gte: startOfToday } }),
    Order.find()
      .select('orderNumber status paymentStatus total currency customer createdAt')
      .sort({ createdAt: -1 })
      .limit(5),
    Reservation.find()
      .select('reference name date time partySize status createdAt')
      .sort({ createdAt: -1 })
      .limit(5),
    AuditLog.find().sort({ createdAt: -1 }).limit(8),
  ]);

  const activeOrders = ['pending_payment', 'confirmed', 'preparing', 'ready', 'out_for_delivery'];

  return {
    summary: {
      totalOrders: orderCounts.reduce((sum, row) => sum + row.count, 0),
      activeOrders: activeOrders.reduce(
        (sum, status) => sum + (countBy(orderCounts)[status] ?? 0),
        0,
      ),
      paidRevenue: paidRevenue.total,
      paidOrderCount: paidRevenue.paidOrders,
      ordersToday: todayOrders,
      totalReservations: reservationCounts.reduce((sum, row) => sum + row.count, 0),
      pendingReservations: countBy(reservationCounts)[RESERVATION_STATUSES.PENDING] ?? 0,
      customers,
      publishedMenuItems: verifiedItems,
      menuItemsAwaitingReview: pendingItems,
      unresolvedBlockingIssues: unresolvedIssues,
    },
    ordersByStatus: countBy(orderCounts),
    reservationsByStatus: countBy(reservationCounts),
    recentOrders: recentOrders.map((order) => ({
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      total: order.total,
      currency: order.currency,
      customer: order.customer,
      createdAt: order.createdAt,
    })),
    recentReservations: recentReservations.map((reservation) => ({
      reference: reservation.reference,
      name: reservation.name,
      date: reservation.date,
      time: reservation.time,
      partySize: reservation.partySize,
      status: reservation.status,
      createdAt: reservation.createdAt,
    })),
    recentActivity: recentActivity.map((log) => ({
      id: String(log.id ?? log._id),
      action: log.action,
      targetType: log.targetType,
      targetId: log.targetId,
      summary: log.summary,
      actorEmail: log.actorEmail,
      createdAt: log.createdAt,
    })),
  };
}

export default getDashboardStats;
