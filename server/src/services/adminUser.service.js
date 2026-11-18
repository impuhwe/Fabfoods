import bcrypt from 'bcrypt';
import { randomBytes } from 'node:crypto';
import env from '../config/env.js';
import { ROLES, STAFF_ROLES, USER_STATUS } from '../config/constants.js';
import { ASSIGNABLE_STAFF_ROLES } from '../config/permissions.js';
import User from '../models/User.js';
import Order from '../models/Order.js';
import Reservation from '../models/Reservation.js';
import { badRequest, conflict, notFound } from '../utils/errors.js';
import { toPublicUser } from '../utils/user.js';

function searchFilter(search) {
  if (!search) return {};
  const pattern = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  return { $or: [{ name: pattern }, { email: pattern }, { phone: pattern }] };
}

function pagination(query) {
  const page = query.page ?? 1;
  const limit = query.limit ?? 50;
  return { page, limit, skip: (page - 1) * limit };
}

function metaFor(query, total) {
  return {
    page: query.page ?? 1,
    limit: query.limit ?? 50,
    total,
    totalPages: Math.max(1, Math.ceil(total / (query.limit ?? 50))),
  };
}

async function paginate(filter, query) {
  const { skip, limit } = pagination(query);
  const [docs, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);
  return { docs, total };
}

export async function listCustomers(query) {
  const filter = { role: ROLES.CUSTOMER, ...searchFilter(query.search) };
  if (query.status) filter.status = query.status;
  const { docs, total } = await paginate(filter, query);
  return {
    customers: docs.map((user) => toPublicUser(user)),
    meta: metaFor(query, total),
  };
}

export async function getCustomerDetails(id) {
  const user = await User.findOne({ _id: id, role: ROLES.CUSTOMER });
  if (!user) throw notFound('Customer not found');

  const [orders, reservations] = await Promise.all([
    Order.find({ user: user._id })
      .select('orderNumber status paymentStatus total currency createdAt')
      .sort({ createdAt: -1 })
      .limit(10),
    Reservation.find({ user: user._id })
      .select('reference date time partySize status startAt createdAt')
      .sort({ createdAt: -1 })
      .limit(10),
  ]);

  return {
    customer: toPublicUser(user),
    activity: {
      orders: orders.map((order) => ({
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        total: order.total,
        currency: order.currency,
        createdAt: order.createdAt,
      })),
      reservations: reservations.map((reservation) => ({
        reference: reservation.reference,
        date: reservation.date,
        time: reservation.time,
        partySize: reservation.partySize,
        status: reservation.status,
        startAt: reservation.startAt,
        createdAt: reservation.createdAt,
      })),
    },
  };
}

export async function setCustomerStatus(id, status) {
  const user = await User.findOne({ _id: id, role: ROLES.CUSTOMER });
  if (!user) throw notFound('Customer not found');
  if (user.status === status) return toPublicUser(user);
  user.status = status;
  await user.save();
  return toPublicUser(user);
}

export async function listStaff(query) {
  const filter = { role: { $in: STAFF_ROLES }, ...searchFilter(query.search) };
  if (query.role && query.role !== ROLES.CUSTOMER) filter.role = query.role;
  if (query.role === ROLES.CUSTOMER) filter.role = { $in: [] };
  if (query.status) filter.status = query.status;
  const { docs, total } = await paginate(filter, query);
  return {
    staff: docs.map(toPublicUser),
    meta: metaFor(query, total),
  };
}

function temporaryPassword() {
  return `${randomBytes(12).toString('base64url')}Aa1`;
}

export async function createStaff(input) {
  if (!ASSIGNABLE_STAFF_ROLES.includes(input.role)) {
    throw badRequest('That staff role cannot be assigned');
  }

  const existing = await User.exists({ email: input.email });
  if (existing) throw conflict('An account with that email already exists', 'EMAIL_IN_USE');

  const password = temporaryPassword();
  const user = await User.create({
    name: input.name,
    email: input.email,
    phone: input.phone || null,
    role: input.role,
    status: USER_STATUS.ACTIVE,
    passwordHash: await bcrypt.hash(password, env.BCRYPT_ROUNDS),
    mustChangePassword: true,
  });

  return {
    user: toPublicUser(user),
    temporaryPassword: password,
  };
}

async function countActiveAdmins() {
  return User.countDocuments({ role: ROLES.ADMIN, status: USER_STATUS.ACTIVE });
}

async function assertSafeStaffUpdate(user, input, actor) {
  const isSelf = String(user._id) === String(actor.id);
  const changesRole = input.role !== undefined && input.role !== user.role;
  const changesStatus = input.status !== undefined && input.status !== user.status;

  if (isSelf && (changesRole || changesStatus)) {
    throw badRequest('You cannot change your own role or account status');
  }

  if (user.role !== ROLES.ADMIN) return;

  const wouldDemote = changesRole && input.role !== ROLES.ADMIN;
  const wouldSuspend = changesStatus && input.status !== USER_STATUS.ACTIVE;
  if (!wouldDemote && !wouldSuspend) return;

  if ((await countActiveAdmins()) <= 1) {
    throw conflict('The last active administrator cannot be demoted or suspended');
  }
}

export async function updateStaff(id, input, actor) {
  const user = await User.findOne({ _id: id, role: { $in: STAFF_ROLES } });
  if (!user) throw notFound('Staff account not found');

  await assertSafeStaffUpdate(user, input, actor);

  if (input.name !== undefined) user.name = input.name;
  if (input.phone !== undefined) user.phone = input.phone || null;
  if (input.role !== undefined) user.role = input.role;
  if (input.status !== undefined) user.status = input.status;
  await user.save();

  return toPublicUser(user);
}

export default {
  listCustomers,
  getCustomerDetails,
  setCustomerStatus,
  listStaff,
  createStaff,
  updateStaff,
};
