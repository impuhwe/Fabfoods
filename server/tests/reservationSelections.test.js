import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import bcrypt from 'bcrypt';
import User from '../src/models/User.js';
import AuditLog from '../src/models/AuditLog.js';
import MenuItem from '../src/models/MenuItem.js';
import Order from '../src/models/Order.js';
import Reservation from '../src/models/Reservation.js';
import { ROLES, USER_STATUS } from '../src/config/constants.js';
import { createAdmin } from '../scripts/createAdmin.js';
import { seedMenu } from '../scripts/seedMenu.js';
import { startTestDatabase, stopTestDatabase } from './helpers/db.js';
import { fetchCsrf, getWithAuth, loginUser, patchWithCsrf, postWithCsrf } from './helpers/auth.js';
import { publishSeededMenu } from './helpers/menu.js';

const PASSWORD = 'SelectionPass123';
const tokens = {};

function kigaliDate(offsetDays = 3) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Kigali' }).format(
    new Date(Date.now() + offsetDays * 24 * 60 * 60 * 1000),
  );
}

function payload(overrides = {}) {
  return {
    name: 'Selection Guest',
    email: `selection-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`,
    phone: '+250788000000',
    date: kigaliDate(),
    time: '19:00',
    partySize: 2,
    occasion: '',
    specialRequests: '',
    preparationNotes: 'No peanuts, please.',
    menuSelections: [],
    ...overrides,
  };
}

async function createReservation(body) {
  const { tokens: csrf } = await fetchCsrf();
  const response = await postWithCsrf('/reservations', body, csrf);
  return response;
}

beforeAll(async () => {
  await startTestDatabase();
  await seedMenu({ allowUnverified: true });
  await publishSeededMenu();
  await MenuItem.updateMany({}, { $set: { reviewTags: [] } });

  await createAdmin({
    name: 'Selection Admin',
    email: 'selection-admin@example.com',
    role: ROLES.ADMIN,
    password: PASSWORD,
  });
  await User.create({
    name: 'Selection Staff',
    email: 'selection-staff@example.com',
    passwordHash: await bcrypt.hash(PASSWORD, 10),
    role: ROLES.STAFF,
    status: USER_STATUS.ACTIVE,
    mustChangePassword: false,
  });
  await User.create({
    name: 'Selection Customer',
    email: 'selection-customer@example.com',
    passwordHash: await bcrypt.hash(PASSWORD, 10),
    role: ROLES.CUSTOMER,
    status: USER_STATUS.ACTIVE,
    mustChangePassword: false,
  });

  for (const [key, email] of Object.entries({
    admin: 'selection-admin@example.com',
    staff: 'selection-staff@example.com',
    customer: 'selection-customer@example.com',
  })) {
    const result = await loginUser(email, PASSWORD);
    expect(result.response.status).toBe(200);
    tokens[key] = result.tokens;
  }
});

afterAll(async () => {
  await stopTestDatabase();
});

afterEach(async () => {
  await Reservation.deleteMany({});
  await Order.deleteMany({});
  await AuditLog.deleteMany({});
  await MenuItem.updateOne({ slug: 'continental-breakfast' }, { $set: { price: 8000 } });
  await MenuItem.updateOne(
    { slug: 'continental-breakfast' },
    { $set: { verified: true, needsReview: false, isAvailable: true, reviewTags: [] } },
  );
  await MenuItem.updateOne(
    { slug: 'whole-grilled-chicken' },
    {
      $set: {
        'servingOptions.0.selectionType': 'single',
        'servingOptions.0.options.0.isDefault': true,
        'servingOptions.0.options.1.isDefault': false,
        'servingOptions.0.options.2.isDefault': false,
      },
    },
  );
});

describe('reservation food and drink pre-selection', () => {
  it('accepts a reservation with no selections and marks the selection as not requested', async () => {
    const response = await createReservation(payload());

    expect(response.status).toBe(201);
    expect(response.body.data.reservation).toMatchObject({
      status: 'pending',
      selectionStatus: 'not_requested',
      selectionEstimate: null,
      preparationNotes: 'No peanuts, please.',
      occasion: '',
    });
    expect(response.body.data.reservation.menuSelections).toEqual([]);
    expect(await Order.countDocuments({})).toBe(0);
  });

  it('prices multiple food and drink selections on the server', async () => {
    const response = await createReservation(
      payload({
        menuSelections: [
          { slug: 'continental-breakfast', quantity: 2 },
          { slug: 'inyange-juice', quantity: 1, sizeLabel: 'Big' },
        ],
      }),
    );

    expect(response.status).toBe(201);
    const reservation = response.body.data.reservation;
    expect(reservation.menuSelections).toHaveLength(2);
    expect(reservation.menuSelections[0]).toMatchObject({
      slug: 'continental-breakfast',
      unitPrice: 8000,
      lineTotal: 16000,
    });
    expect(reservation.menuSelections[1]).toMatchObject({
      slug: 'inyange-juice',
      unitPrice: 1000,
      lineTotal: 1000,
      selections: { sizeLabel: 'Big' },
    });
    expect(reservation.selectionEstimate).toMatchObject({
      currency: 'RWF',
      itemCount: 3,
      subtotal: 17000,
      total: 17000,
    });
    expect(reservation.selectionStatus).toBe('pending_review');
    expect(reservation.status).toBe('pending');
  });

  it('validates required serving options and unknown add-ons', async () => {
    const chicken = await MenuItem.findOne({ slug: 'whole-grilled-chicken' });
    chicken.servingOptions[0].selectionType = 'multiple';
    chicken.servingOptions[0].options.forEach((option) => {
      option.isDefault = false;
    });
    await chicken.save();

    const missingServing = await createReservation(
      payload({ menuSelections: [{ slug: 'whole-grilled-chicken', quantity: 1 }] }),
    );
    expect(missingServing.status).toBe(400);
    expect(missingServing.body.error.details?.[0]?.field).toBe('whole-grilled-chicken');

    const unknownAddon = await createReservation(
      payload({
        menuSelections: [
          {
            slug: 'stir-fried-vegetables',
            quantity: 1,
            addonSelections: [{ groupName: 'Extras', optionName: 'Unknown' }],
          },
        ],
      }),
    );
    expect(unknownAddon.status).toBe(400);
    expect(unknownAddon.body.error.details?.[0]?.field).toBe('stir-fried-vegetables');
  });

  it('rejects unverified menu items and client price tampering', async () => {
    await MenuItem.updateOne({ slug: 'continental-breakfast' }, { $set: { verified: false } });
    const unverified = await createReservation(
      payload({ menuSelections: [{ slug: 'continental-breakfast', quantity: 1 }] }),
    );
    expect(unverified.status).toBe(409);
    expect(unverified.body.error.code).toBe('ITEM_NOT_VERIFIED');

    const tampered = await createReservation(
      payload({
        menuSelections: [
          { slug: 'continental-breakfast', quantity: 1, unitPrice: 1, lineTotal: 1 },
        ],
      }),
    );
    expect(tampered.status).toBe(400);
    expect(tampered.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('keeps historical price snapshots after menu prices change', async () => {
    const created = await createReservation(
      payload({ menuSelections: [{ slug: 'continental-breakfast', quantity: 1 }] }),
    );
    expect(created.status).toBe(201);

    await MenuItem.updateOne({ slug: 'continental-breakfast' }, { $set: { price: 12000 } });
    const detail = await getWithAuth(
      `/admin/reservations/${created.body.data.reservation.id}`,
      tokens.admin,
    );

    expect(detail.status).toBe(200);
    expect(detail.body.data.reservation.menuSelections[0]).toMatchObject({
      unitPrice: 8000,
      lineTotal: 8000,
    });
    expect(detail.body.data.reservation.selectionEstimate.total).toBe(8000);
  });

  it('shows selections to staff and restricts selection review by permission', async () => {
    const created = await createReservation(
      payload({ menuSelections: [{ slug: 'continental-breakfast', quantity: 2 }] }),
    );
    const id = created.body.data.reservation.id;

    const customerDetail = await getWithAuth(`/admin/reservations/${id}`, tokens.customer);
    expect(customerDetail.status).toBe(403);

    const staffDetail = await getWithAuth(`/admin/reservations/${id}`, tokens.staff);
    expect(staffDetail.status).toBe(200);
    expect(staffDetail.body.data.reservation.menuSelections[0].name).toBe('CONTINENTAL BREAKFAST');
    expect(staffDetail.body.data.reservation.preparationNotes).toBe('No peanuts, please.');

    const customerReview = await patchWithCsrf(
      `/admin/reservations/${id}/selection-status`,
      { status: 'confirmed' },
      tokens.customer,
    );
    expect(customerReview.status).toBe(403);

    const staffReview = await patchWithCsrf(
      `/admin/reservations/${id}/selection-status`,
      { status: 'confirmed', note: 'Checked with guest' },
      tokens.staff,
    );
    expect(staffReview.status).toBe(200);
    expect(staffReview.body.data.reservation.selectionStatus).toBe('confirmed');
    expect(staffReview.body.data.reservation.selectionStatusHistory).toEqual(
      expect.arrayContaining([expect.objectContaining({ status: 'confirmed' })]),
    );

    const invalidTransition = await patchWithCsrf(
      `/admin/reservations/${id}/selection-status`,
      { status: 'declined' },
      tokens.admin,
    );
    expect(invalidTransition.status).toBe(409);
    expect(invalidTransition.body.error.code).toBe('INVALID_SELECTION_STATUS_TRANSITION');
  });

  it('preserves selections when an administrator reschedules a reservation', async () => {
    const created = await createReservation(
      payload({
        menuSelections: [
          { slug: 'continental-breakfast', quantity: 1 },
          { slug: 'inyange-juice', quantity: 2, sizeLabel: 'Small' },
        ],
      }),
    );
    const id = created.body.data.reservation.id;
    const nextDate = kigaliDate(5);

    const response = await patchWithCsrf(
      `/admin/reservations/${id}/reschedule`,
      { date: nextDate, time: '18:30', partySize: 3, note: 'Moved by guest' },
      tokens.admin,
    );

    expect(response.status).toBe(200);
    expect(response.body.data.reservation).toMatchObject({
      date: nextDate,
      time: '18:30',
      partySize: 3,
      selectionStatus: 'pending_review',
    });
    expect(response.body.data.reservation.menuSelections).toHaveLength(2);
    expect(response.body.data.reservation.selectionEstimate.total).toBe(9400);
  });
});
