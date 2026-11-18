import { randomInt } from 'node:crypto';
import { RESERVATION_STATUSES } from '../config/constants.js';
import Reservation from '../models/Reservation.js';
import { enqueueEmail } from './email.service.js';
import { getSettings } from './settings.service.js';
import { badRequest, conflict, notFound } from '../utils/errors.js';

function referenceFor(date) {
  const compactDate = date.replaceAll('-', '').slice(2);
  return `RS-${compactDate}-${randomInt(100, 1000)}`;
}

const STATUS_COPY = {
  [RESERVATION_STATUSES.PENDING]: {
    label: 'Request received',
    message: 'Your table request has been received. The restaurant will confirm it separately.',
  },
  [RESERVATION_STATUSES.CONFIRMED]: {
    label: 'Confirmed',
    message: 'The restaurant has confirmed this reservation.',
  },
  [RESERVATION_STATUSES.DECLINED]: {
    label: 'Declined',
    message: 'The restaurant could not accommodate this request.',
  },
  [RESERVATION_STATUSES.CANCELLED]: {
    label: 'Cancelled',
    message: 'This reservation request was cancelled.',
  },
  [RESERVATION_STATUSES.COMPLETED]: {
    label: 'Completed',
    message: 'This reservation is complete.',
  },
  [RESERVATION_STATUSES.NO_SHOW]: {
    label: 'No show',
    message: 'This reservation was recorded as a no show.',
  },
};

const ALLOWED_TRANSITIONS = {
  [RESERVATION_STATUSES.PENDING]: [
    RESERVATION_STATUSES.CONFIRMED,
    RESERVATION_STATUSES.DECLINED,
    RESERVATION_STATUSES.CANCELLED,
  ],
  [RESERVATION_STATUSES.CONFIRMED]: [
    RESERVATION_STATUSES.COMPLETED,
    RESERVATION_STATUSES.CANCELLED,
    RESERVATION_STATUSES.NO_SHOW,
  ],
  [RESERVATION_STATUSES.DECLINED]: [],
  [RESERVATION_STATUSES.CANCELLED]: [],
  [RESERVATION_STATUSES.COMPLETED]: [],
  [RESERVATION_STATUSES.NO_SHOW]: [],
};

function toPublicReservation(reservation) {
  const statusCopy = STATUS_COPY[reservation.status] ?? STATUS_COPY[RESERVATION_STATUSES.PENDING];

  return {
    id: String(reservation._id ?? reservation.id),
    reference: reservation.reference,
    name: reservation.name,
    email: reservation.email,
    phone: reservation.phone,
    date: reservation.date,
    time: reservation.time,
    partySize: reservation.partySize,
    occasion: reservation.occasion ?? '',
    specialRequests: reservation.specialRequests ?? '',
    status: reservation.status,
    statusLabel: statusCopy.label,
    statusMessage: statusCopy.message,
    createdAt: reservation.createdAt,
  };
}

function toAdminReservation(reservation) {
  return {
    ...toPublicReservation(reservation),
    user: reservation.user ? String(reservation.user) : null,
    source: reservation.source,
    statusHistory: (reservation.statusHistory ?? []).map((event) => ({
      status: event.status,
      note: event.note ?? '',
      changedAt: event.changedAt,
      changedBy: event.changedBy ? String(event.changedBy) : null,
    })),
    updatedAt: reservation.updatedAt,
  };
}

function addHistory(reservation, status, note, changedBy = null) {
  reservation.statusHistory.push({ status, note, changedBy, changedAt: new Date() });
}

function assertCanView(reservation, actor = {}) {
  if (reservation.user) {
    if (!actor.user || String(reservation.user) !== actor.user.id) {
      throw notFound('Reservation not found');
    }
    return;
  }
  if (!actor.email || reservation.email !== actor.email.toLowerCase()) {
    throw notFound('Reservation not found');
  }
}

export async function createReservation(payload, user = null) {
  const settings = await getSettings();
  if (!settings.reservations.enabled) {
    throw conflict('Table requests are not open right now', 'RESERVATIONS_CLOSED');
  }
  if (payload.partySize > settings.reservations.maxPartySize) {
    throw badRequest(
      `For parties over ${settings.reservations.maxPartySize}, please contact the restaurant directly`,
    );
  }

  const latest = new Date(Date.now() + settings.reservations.maxDaysAhead * 24 * 60 * 60 * 1000);
  const latestDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Kigali' }).format(latest);
  if (payload.date > latestDate) {
    throw badRequest(`Choose a date within the next ${settings.reservations.maxDaysAhead} days`);
  }

  const startAt = new Date(`${payload.date}T${payload.time}:00+02:00`);

  for (let attempt = 0; attempt < 6; attempt += 1) {
    try {
      const reservation = await Reservation.create({
        ...payload,
        reference: referenceFor(payload.date),
        startAt,
        user: user?.id ?? null,
        status: RESERVATION_STATUSES.PENDING,
        statusHistory: [
          {
            status: RESERVATION_STATUSES.PENDING,
            note: 'Request submitted from the website',
            changedAt: new Date(),
          },
        ],
        source: 'website',
      });

      await enqueueEmail({
        to: reservation.email,
        template: 'reservation_received',
        payload: { reservation: toPublicReservation(reservation) },
        dedupeKey: `reservation-received:${reservation._id}`,
        user: reservation.user,
        reservation: reservation._id,
      });

      return toPublicReservation(reservation);
    } catch (error) {
      if (error?.code === 11000 && attempt < 5) continue;
      throw error;
    }
  }

  throw new Error('Unable to create a unique reservation reference');
}

export async function listUserReservations(userId) {
  const reservations = await Reservation.find({ user: userId })
    .sort({ startAt: -1 })
    .limit(50)
    .lean();

  return reservations.map(toPublicReservation);
}

export async function listAdminReservations({ status, date, page = 1, limit = 50 } = {}) {
  const filter = {};
  if (status) filter.status = status;
  if (date) {
    filter.startAt = {
      $gte: new Date(`${date}T00:00:00+02:00`),
      $lt: new Date(`${date}T23:59:59.999+02:00`),
    };
  }

  const skip = (page - 1) * limit;
  const [reservations, total] = await Promise.all([
    Reservation.find(filter).sort({ startAt: -1 }).skip(skip).limit(limit),
    Reservation.countDocuments(filter),
  ]);

  return {
    reservations: reservations.map(toAdminReservation),
    meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
}

export async function cancelReservation(reference, actor = {}, reason = '') {
  const reservation = await Reservation.findOne({ reference: String(reference).toUpperCase() });
  if (!reservation) throw notFound('Reservation not found');
  assertCanView(reservation, actor);

  if (
    ![RESERVATION_STATUSES.PENDING, RESERVATION_STATUSES.CONFIRMED].includes(reservation.status)
  ) {
    throw conflict(
      'This reservation can no longer be cancelled online',
      'RESERVATION_NOT_CANCELLABLE',
    );
  }

  reservation.status = RESERVATION_STATUSES.CANCELLED;
  addHistory(reservation, RESERVATION_STATUSES.CANCELLED, reason || 'Cancelled by the customer');
  await reservation.save();

  await enqueueEmail({
    to: reservation.email,
    template: 'reservation_cancelled',
    payload: {
      reservation: toPublicReservation(reservation),
      note: reason,
    },
    dedupeKey: `reservation-cancelled:${reservation._id}`,
    user: reservation.user,
    reservation: reservation._id,
  });

  return toPublicReservation(reservation);
}

export async function getAdminReservation(id) {
  const reservation = await Reservation.findById(id);
  if (!reservation) throw notFound('Reservation not found');
  return toAdminReservation(reservation);
}

export async function rescheduleAdminReservation(id, input, adminId) {
  const reservation = await Reservation.findById(id);
  if (!reservation) throw notFound('Reservation not found');

  if (
    ![RESERVATION_STATUSES.PENDING, RESERVATION_STATUSES.CONFIRMED].includes(reservation.status)
  ) {
    throw conflict(
      'This reservation can no longer be rescheduled',
      'RESERVATION_NOT_RESCHEDULABLE',
    );
  }

  const settings = await getSettings();
  if (input.partySize > settings.reservations.maxPartySize) {
    throw badRequest(
      `For parties over ${settings.reservations.maxPartySize}, please contact the restaurant directly`,
    );
  }

  const latest = new Date(Date.now() + settings.reservations.maxDaysAhead * 24 * 60 * 60 * 1000);
  const latestDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Kigali' }).format(latest);
  if (input.date > latestDate) {
    throw badRequest(`Choose a date within the next ${settings.reservations.maxDaysAhead} days`);
  }

  reservation.date = input.date;
  reservation.time = input.time;
  reservation.partySize = input.partySize;
  reservation.startAt = new Date(`${input.date}T${input.time}:00+02:00`);
  addHistory(
    reservation,
    reservation.status,
    input.note || 'Reservation rescheduled by staff',
    adminId,
  );
  await reservation.save();

  return toAdminReservation(reservation);
}

export async function updateReservationStatus(id, status, note, adminId) {
  const reservation = await Reservation.findById(id);
  if (!reservation) throw notFound('Reservation not found');

  if (!ALLOWED_TRANSITIONS[reservation.status]?.includes(status)) {
    throw conflict(
      `Reservation cannot move from ${reservation.status} to ${status}`,
      'INVALID_STATUS_TRANSITION',
    );
  }

  reservation.status = status;
  addHistory(reservation, status, note, adminId);
  await reservation.save();

  const copy = STATUS_COPY[status];
  if ([RESERVATION_STATUSES.CONFIRMED, RESERVATION_STATUSES.DECLINED].includes(status)) {
    await enqueueEmail({
      to: reservation.email,
      template: 'reservation_decision',
      payload: {
        reservation: toPublicReservation(reservation),
        statusLabel: copy.label,
        message: copy.message,
        note,
      },
      dedupeKey: `reservation-decision:${reservation._id}:${status}`,
      user: reservation.user,
      reservation: reservation._id,
    });
  }

  return toAdminReservation(reservation);
}

export { toPublicReservation, toAdminReservation };
