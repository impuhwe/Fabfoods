import { randomInt } from 'node:crypto';
import { RESERVATION_SELECTION_STATUSES, RESERVATION_STATUSES } from '../config/constants.js';
import Reservation from '../models/Reservation.js';
import { enqueueEmail } from './email.service.js';
import { resolveMenuSelectionLines } from './menuSelectionQuote.service.js';
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

const SELECTION_STATUS_COPY = {
  [RESERVATION_SELECTION_STATUSES.NOT_REQUESTED]: {
    label: 'No pre-selection',
    message: 'No food or drinks were selected with this reservation.',
  },
  [RESERVATION_SELECTION_STATUSES.PENDING_REVIEW]: {
    label: 'Awaiting review',
    message: 'The restaurant has not reviewed these selections yet.',
  },
  [RESERVATION_SELECTION_STATUSES.CONFIRMED]: {
    label: 'Selection confirmed',
    message: 'The restaurant has reviewed these selections.',
  },
  [RESERVATION_SELECTION_STATUSES.DECLINED]: {
    label: 'Selection declined',
    message: 'The restaurant could not confirm these selections.',
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

const ALLOWED_SELECTION_TRANSITIONS = {
  [RESERVATION_SELECTION_STATUSES.NOT_REQUESTED]: [],
  [RESERVATION_SELECTION_STATUSES.PENDING_REVIEW]: [
    RESERVATION_SELECTION_STATUSES.CONFIRMED,
    RESERVATION_SELECTION_STATUSES.DECLINED,
  ],
  [RESERVATION_SELECTION_STATUSES.CONFIRMED]: [],
  [RESERVATION_SELECTION_STATUSES.DECLINED]: [],
};

function toSelectionLine(line) {
  return {
    slug: line.slug,
    name: line.name,
    quantity: line.quantity,
    unitPrice: line.unitPrice,
    lineTotal: line.lineTotal,
    basePrice: line.basePrice,
    servingPriceDelta: line.servingPriceDelta ?? 0,
    addonPrice: line.addonPrice ?? 0,
    selectionSummary: [...(line.selectionSummary ?? [])],
    selections: {
      sizeLabel: line.selections?.sizeLabel ?? null,
      serving: (line.selections?.serving ?? []).map((selection) => ({
        groupName: selection.groupName,
        optionName: selection.optionName,
        priceDelta: selection.priceDelta,
      })),
      addons: (line.selections?.addons ?? []).map((selection) => ({
        groupName: selection.groupName,
        optionName: selection.optionName,
        price: selection.price,
      })),
    },
  };
}

function toSelectionEstimate(estimate) {
  if (!estimate) return null;
  return {
    currency: estimate.currency,
    itemCount: estimate.itemCount,
    subtotal: estimate.subtotal,
    total: estimate.total,
    calculatedAt: estimate.calculatedAt,
  };
}

function toPublicReservation(reservation) {
  const statusCopy = STATUS_COPY[reservation.status] ?? STATUS_COPY[RESERVATION_STATUSES.PENDING];
  const selectionStatus =
    reservation.selectionStatus ?? RESERVATION_SELECTION_STATUSES.NOT_REQUESTED;
  const selectionCopy =
    SELECTION_STATUS_COPY[selectionStatus] ?? SELECTION_STATUS_COPY.NOT_REQUESTED;

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
    preparationNotes: reservation.preparationNotes ?? '',
    menuSelections: (reservation.menuSelections ?? []).map(toSelectionLine),
    selectionEstimate: toSelectionEstimate(reservation.selectionEstimate),
    selectionStatus,
    selectionStatusLabel: selectionCopy.label,
    selectionStatusMessage: selectionCopy.message,
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
    selectionReviewNote: reservation.selectionReviewNote ?? '',
    selectionReviewedBy: reservation.selectionReviewedBy
      ? String(reservation.selectionReviewedBy)
      : null,
    selectionReviewedAt: reservation.selectionReviewedAt ?? null,
    selectionStatusHistory: (reservation.selectionStatusHistory ?? []).map((event) => ({
      status: event.status,
      note: event.note ?? '',
      changedAt: event.changedAt,
      changedBy: event.changedBy ? String(event.changedBy) : null,
    })),
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

function addSelectionHistory(reservation, status, note, changedBy = null) {
  reservation.selectionStatusHistory.push({ status, note, changedBy, changedAt: new Date() });
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

  const menuSelections = payload.menuSelections ?? [];
  const pricedLines = menuSelections.length
    ? await resolveMenuSelectionLines(menuSelections, 'reservation')
    : [];
  const subtotal = pricedLines.reduce((total, line) => total + line.lineTotal, 0);
  const itemCount = pricedLines.reduce((total, line) => total + line.quantity, 0);
  const selectionEstimate = pricedLines.length
    ? {
        currency: settings.payments.currency,
        itemCount,
        subtotal,
        total: subtotal,
        calculatedAt: new Date(),
      }
    : null;
  const selectionStatus = pricedLines.length
    ? RESERVATION_SELECTION_STATUSES.PENDING_REVIEW
    : RESERVATION_SELECTION_STATUSES.NOT_REQUESTED;

  const startAt = new Date(`${payload.date}T${payload.time}:00+02:00`);

  for (let attempt = 0; attempt < 6; attempt += 1) {
    try {
      const reservation = await Reservation.create({
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        date: payload.date,
        time: payload.time,
        partySize: payload.partySize,
        occasion: payload.occasion ?? '',
        specialRequests: payload.specialRequests ?? '',
        preparationNotes: payload.preparationNotes ?? '',
        menuSelections: pricedLines,
        selectionEstimate,
        selectionStatus,
        selectionStatusHistory: pricedLines.length
          ? [
              {
                status: RESERVATION_SELECTION_STATUSES.PENDING_REVIEW,
                note: 'Food and drink pre-selection submitted with the table request',
                changedAt: new Date(),
              },
            ]
          : [],
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

export async function updateReservationSelectionStatus(id, status, note, adminId) {
  const reservation = await Reservation.findById(id);
  if (!reservation) throw notFound('Reservation not found');
  if (!reservation.menuSelections?.length) {
    throw badRequest('This reservation has no food or drink selections to review');
  }

  const current = reservation.selectionStatus ?? RESERVATION_SELECTION_STATUSES.PENDING_REVIEW;
  if (!ALLOWED_SELECTION_TRANSITIONS[current]?.includes(status)) {
    throw conflict(
      `Food selection cannot move from ${current} to ${status}`,
      'INVALID_SELECTION_STATUS_TRANSITION',
    );
  }

  reservation.selectionStatus = status;
  reservation.selectionReviewNote = note ?? '';
  reservation.selectionReviewedBy = adminId ?? null;
  reservation.selectionReviewedAt = new Date();
  addSelectionHistory(reservation, status, note, adminId);
  await reservation.save();

  return toAdminReservation(reservation);
}

export { toPublicReservation, toAdminReservation };
