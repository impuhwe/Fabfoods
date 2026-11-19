import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import Order from '../src/models/Order.js';
import Reservation from '../src/models/Reservation.js';
import {
  RESERVATION_SELECTION_STATUSES,
  RESERVATION_STATUSES,
  ROLES,
} from '../src/config/constants.js';
import { createAdmin } from '../scripts/createAdmin.js';
import { startTestDatabase, stopTestDatabase } from './helpers/db.js';
import { fetchCsrf, getWithAuth, loginUser, patchWithCsrf, postWithCsrf } from './helpers/auth.js';

const PASSWORD = 'ReservationPass123';
let adminTokens;

function kigaliDate(offsetDays = 3) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Kigali' }).format(
    new Date(Date.now() + offsetDays * 24 * 60 * 60 * 1000),
  );
}

function payload(overrides = {}) {
  return {
    name: 'Reservation Guest',
    email: `reservation-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`,
    phone: '+250788000000',
    date: kigaliDate(),
    time: '19:00',
    partySize: 2,
    occasion: '',
    specialRequests: '',
    ...overrides,
  };
}

async function createReservation(body) {
  const { tokens: csrf } = await fetchCsrf();
  return postWithCsrf('/reservations', body, csrf);
}

beforeAll(async () => {
  await startTestDatabase();
  await createAdmin({
    name: 'Reservation Admin',
    email: 'reservation-admin@example.com',
    role: ROLES.ADMIN,
    password: PASSWORD,
  });
  const result = await loginUser('reservation-admin@example.com', PASSWORD);
  expect(result.response.status).toBe(200);
  adminTokens = result.tokens;
});

afterAll(async () => {
  await stopTestDatabase();
});

afterEach(async () => {
  await Reservation.deleteMany({});
  await Order.deleteMany({});
});

describe('reservation requests without food or drink selection', () => {
  it('rejects selection fields on the public reservation endpoint', async () => {
    const response = await createReservation(
      payload({
        preparationNotes: 'No peanuts, please.',
        menuSelections: [{ slug: 'continental-breakfast', quantity: 1 }],
      }),
    );

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('creates a reservation without selection data or an order', async () => {
    const response = await createReservation(payload());

    expect(response.status).toBe(201);
    const reservation = response.body.data.reservation;
    expect(reservation).toMatchObject({
      status: 'pending',
      occasion: '',
      specialRequests: '',
    });
    for (const field of [
      'preparationNotes',
      'menuSelections',
      'selectionEstimate',
      'selectionStatus',
      'selectionStatusLabel',
      'selectionStatusMessage',
    ]) {
      expect(reservation).not.toHaveProperty(field);
    }
    expect(await Order.countDocuments({})).toBe(0);
  });

  it('keeps legacy selection data read-only in admin details', async () => {
    const legacy = await Reservation.create({
      reference: `RS-LEGACY-${Date.now()}`,
      name: 'Legacy Guest',
      email: 'legacy-guest@example.com',
      phone: '+250788000001',
      date: kigaliDate(),
      time: '19:00',
      startAt: new Date(`${kigaliDate()}T19:00:00+02:00`),
      partySize: 2,
      occasion: '',
      specialRequests: '',
      preparationNotes: 'No peanuts, please.',
      menuSelections: [
        {
          slug: 'continental-breakfast',
          name: 'CONTINENTAL BREAKFAST',
          quantity: 1,
          unitPrice: 8000,
          lineTotal: 8000,
          basePrice: 8000,
        },
      ],
      selectionEstimate: {
        currency: 'RWF',
        itemCount: 1,
        subtotal: 8000,
        total: 8000,
        calculatedAt: new Date(),
      },
      selectionStatus: RESERVATION_SELECTION_STATUSES.PENDING_REVIEW,
      status: RESERVATION_STATUSES.PENDING,
      statusHistory: [
        {
          status: RESERVATION_STATUSES.PENDING,
          note: 'Migrated historical request',
          changedAt: new Date(),
        },
      ],
      source: 'admin',
    });

    const detail = await getWithAuth(`/admin/reservations/${legacy.id}`, adminTokens);
    expect(detail.status).toBe(200);
    expect(detail.body.data.reservation).toMatchObject({
      preparationNotes: 'No peanuts, please.',
      selectionStatus: 'pending_review',
      selectionStatusLabel: 'Awaiting review',
    });
    expect(detail.body.data.reservation.menuSelections[0].name).toBe('CONTINENTAL BREAKFAST');

    const review = await patchWithCsrf(
      `/admin/reservations/${legacy.id}/selection-status`,
      { status: 'confirmed' },
      adminTokens,
    );
    expect(review.status).toBe(404);
  });
});
