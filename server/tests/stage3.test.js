import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import EmailOutbox from '../src/models/EmailOutbox.js';
import Order from '../src/models/Order.js';
import PaymentTransaction from '../src/models/PaymentTransaction.js';
import Reservation from '../src/models/Reservation.js';
import RestaurantSettings from '../src/models/RestaurantSettings.js';
import { PAYMENT_METHODS } from '../src/config/constants.js';
import { createAdmin } from '../scripts/createAdmin.js';
import { getSettings } from '../src/services/settings.service.js';
import { seedMenu } from '../scripts/seedMenu.js';
import { startTestDatabase, stopTestDatabase } from './helpers/db.js';
import { publishSeededMenu } from './helpers/menu.js';
import {
  API,
  fetchCsrf,
  getWithAuth,
  loginUser,
  patchWithCsrf,
  postWithCsrf,
  registerUser,
} from './helpers/auth.js';

const ADMIN = {
  name: 'Stage Three Admin',
  email: 'stage3-admin@example.com',
  password: 'StageThreePass123',
};

function kigaliDate(offsetDays = 2) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Kigali' }).format(
    new Date(Date.now() + offsetDays * 24 * 60 * 60 * 1000),
  );
}

function customer(overrides = {}) {
  return {
    name: 'Stage Three Customer',
    email: `stage3-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`,
    phone: '+250788123456',
    ...overrides,
  };
}

function orderPayload(overrides = {}) {
  return {
    items: [{ slug: 'french-fries', quantity: 2 }],
    fulfillmentType: 'pickup',
    customer: customer(),
    paymentMethod: PAYMENT_METHODS.PAY_AT_RESTAURANT,
    ...overrides,
  };
}

function reservationPayload(overrides = {}) {
  return {
    name: 'Stage Three Guest',
    email: `stage3-guest-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`,
    phone: '+250788654321',
    date: kigaliDate(),
    time: '19:30',
    partySize: 4,
    occasion: '',
    specialRequests: '',
    ...overrides,
  };
}

function placeOrder(payload, tokens, idempotencyKey) {
  const call = request(app)
    .post(`${API}/orders`)
    .set(
      'Cookie',
      Object.entries(tokens)
        .filter(([name, value]) => name.startsWith('ff_') && value)
        .map(([name, value]) => `${name}=${value}`)
        .join('; '),
    )
    .set('X-CSRF-Token', tokens.ff_csrf)
    .send(payload);

  if (idempotencyKey) call.set('Idempotency-Key', idempotencyKey);
  return call;
}

async function resetSettings() {
  const settings = await RestaurantSettings.findOne({ singleton: 'default' });
  if (!settings) return;

  settings.contact = { phone: '', email: '', address: '', whatsapp: '' };
  settings.hours = [];
  settings.fulfillment.pickupEnabled = true;
  settings.fulfillment.deliveryEnabled = false;
  settings.fulfillment.orderingPaused = false;
  settings.fulfillment.pickupEtaMinutes = null;
  settings.fulfillment.minOrder = 0;
  settings.fulfillment.deliveryZones = [];
  settings.reservations.enabled = true;
  settings.reservations.maxPartySize = 20;
  settings.reservations.maxDaysAhead = 90;
  settings.reservations.policyText = '';
  settings.reservations.autoConfirm = false;
  settings.payments.currency = 'RWF';
  settings.payments.acceptedMethods = Object.values(PAYMENT_METHODS);
  settings.payments.enabledMethods = [
    PAYMENT_METHODS.PAY_AT_RESTAURANT,
    PAYMENT_METHODS.CASH_ON_DELIVERY,
  ];
  settings.payments.onlineEnabled = false;
  settings.verification = {
    contactApproved: false,
    hoursApproved: false,
    deliveryApproved: false,
    paymentsApproved: false,
  };
  await settings.save();
}

let adminTokens;

beforeAll(async () => {
  await startTestDatabase();
  await seedMenu({ allowUnverified: true });
  await publishSeededMenu();
  await createAdmin(ADMIN);
  await getSettings();
  await resetSettings();
  ({ tokens: adminTokens } = await loginUser(ADMIN.email, ADMIN.password));
});

afterAll(async () => {
  await stopTestDatabase();
});

afterEach(async () => {
  await Promise.all([
    Order.deleteMany({}),
    PaymentTransaction.deleteMany({}),
    EmailOutbox.deleteMany({}),
    Reservation.deleteMany({}),
  ]);
  await resetSettings();
});

describe('order placement', () => {
  it('prices pickup orders on the server and queues a confirmation email', async () => {
    const { tokens } = await fetchCsrf();
    const payload = orderPayload();

    const response = await placeOrder(payload, tokens).expect(201);
    const { order, paymentAction } = response.body.data;

    expect(paymentAction).toBeNull();
    expect(order).toMatchObject({
      customer: payload.customer,
      fulfillmentType: 'pickup',
      subtotal: 8000,
      deliveryFee: 0,
      total: 8000,
      currency: 'RWF',
      paymentMethod: 'pay_at_restaurant',
      paymentStatus: 'pending',
      status: 'confirmed',
    });
    expect(order.orderNumber).toMatch(/^FF-\d{6}-\d{6}$/);
    expect(order.items[0]).toMatchObject({
      slug: 'french-fries',
      quantity: 2,
      unitPrice: 4000,
      lineTotal: 8000,
    });
    expect(JSON.stringify(response.body)).not.toContain('reviewNotes');
    expect(JSON.stringify(response.body)).not.toContain('idempotencyKey');

    const email = await EmailOutbox.findOne({ template: 'order_confirmation' });
    expect(email).toMatchObject({
      to: payload.customer.email,
      status: 'queued',
      attempts: 0,
    });
    expect(email.order.toString()).toBe(order.id);
  });

  it('replays an idempotent order without duplicating records or email', async () => {
    const { tokens } = await fetchCsrf();
    const payload = orderPayload();
    const key = `stage3-idempotency-${Date.now()}`;

    const first = await placeOrder(payload, tokens, key).expect(201);
    const second = await placeOrder(payload, tokens, key).expect(201);

    expect(second.body.data.replayed).toBe(true);
    expect(second.body.data.order.orderNumber).toBe(first.body.data.order.orderNumber);
    expect(await Order.countDocuments()).toBe(1);
    expect(await EmailOutbox.countDocuments()).toBe(1);
  });

  it('enforces order ownership and supports guest email lookup', async () => {
    const first = await registerUser({ name: 'Order Owner' });
    const second = await registerUser({ name: 'Other Customer' });
    const payload = orderPayload({
      customer: customer({ email: first.payload.email }),
    });

    const created = await placeOrder(payload, first.tokens).expect(201);
    const orderNumber = created.body.data.order.orderNumber;

    const ownerLookup = await getWithAuth(`/orders/${orderNumber}`, first.tokens).expect(200);
    expect(ownerLookup.body.data.order.orderNumber).toBe(orderNumber);

    await getWithAuth(`/orders/${orderNumber}`, second.tokens).expect(404);

    const history = await getWithAuth('/me/orders', first.tokens).expect(200);
    expect(history.body.data).toHaveLength(1);
    expect(history.body.data[0].orderNumber).toBe(orderNumber);

    const guestTokens = (await fetchCsrf()).tokens;
    const guestOrder = await placeOrder(orderPayload(), guestTokens).expect(201);
    const guestNumber = guestOrder.body.data.order.orderNumber;
    const guestEmail = guestOrder.body.data.order.customer.email;

    const guestLookup = await request(app)
      .get(`${API}/orders/${guestNumber}`)
      .query({ email: guestEmail })
      .expect(200);
    expect(guestLookup.body.data.order.orderNumber).toBe(guestNumber);

    await request(app).get(`${API}/orders/${guestNumber}`).expect(404);
  });

  it('rejects online payments while the provider is disabled', async () => {
    const { tokens } = await fetchCsrf();
    const response = await placeOrder(
      orderPayload({ paymentMethod: PAYMENT_METHODS.MOBILE_MONEY }),
      tokens,
    ).expect(409);

    expect(response.body.error.code).toBe('PAYMENT_METHOD_UNAVAILABLE');
    expect(await Order.countDocuments()).toBe(0);
  });

  it('lets a guest cancel an unpaid order but not another customer order', async () => {
    const { tokens } = await fetchCsrf();
    const payload = orderPayload();
    const created = await placeOrder(payload, tokens).expect(201);
    const orderNumber = created.body.data.order.orderNumber;

    await postWithCsrf(
      `/orders/${orderNumber}/cancel`,
      { email: 'someone-else@example.com' },
      tokens,
    ).expect(404);

    const cancelled = await postWithCsrf(
      `/orders/${orderNumber}/cancel`,
      { email: payload.customer.email, reason: 'Changed plans' },
      tokens,
    ).expect(200);

    expect(cancelled.body.data.order).toMatchObject({
      status: 'cancelled',
      paymentStatus: 'cancelled',
    });
    expect(cancelled.body.data.order.statusHistory.at(-1).note).toBe('Changed plans');

    const again = await postWithCsrf(
      `/orders/${orderNumber}/cancel`,
      { email: payload.customer.email },
      tokens,
    ).expect(409);
    expect(again.body.error.code).toBe('ORDER_NOT_CANCELLABLE');
  });
});

describe('staff order and reservation operations', () => {
  it('reads and safely updates business settings', async () => {
    const settings = await getWithAuth('/admin/settings', adminTokens).expect(200);
    expect(settings.body.data.publicSettings.contact).toBeNull();
    expect(settings.body.data.publicSettings.payments.enabledMethods).toEqual([
      'pay_at_restaurant',
      'cash_on_delivery',
    ]);

    const updated = await patchWithCsrf(
      '/admin/settings',
      {
        contact: {
          phone: '+250788000111',
          email: 'hello@fabfoods.example',
          address: 'Kigali',
          whatsapp: '+250788000111',
        },
        verification: { contactApproved: true },
      },
      adminTokens,
    ).expect(200);

    expect(updated.body.data.publicSettings.contact).toMatchObject({
      phone: '+250788000111',
      email: 'hello@fabfoods.example',
    });

    const unsafeDelivery = await patchWithCsrf(
      '/admin/settings',
      { fulfillment: { deliveryEnabled: true } },
      adminTokens,
    ).expect(400);
    expect(unsafeDelivery.body.error.message).toMatch(/zones and fees are approved/i);

    const unsafeOnline = await patchWithCsrf(
      '/admin/settings',
      { payments: { enabledMethods: ['mobile_money'] } },
      adminTokens,
    ).expect(400);
    expect(unsafeOnline.body.error.message).toMatch(/approved, configured payment provider/i);
  });

  it('moves an offline order through staff status and payment updates', async () => {
    const { tokens } = await fetchCsrf();
    const created = await placeOrder(orderPayload(), tokens).expect(201);
    const orderId = created.body.data.order.id;

    const list = await getWithAuth('/admin/orders', adminTokens).expect(200);
    expect(list.body.data).toHaveLength(1);

    const detail = await getWithAuth(`/admin/orders/${orderId}`, adminTokens).expect(200);
    expect(detail.body.data.order.id).toBe(orderId);
    expect(detail.body.data.payments).toEqual([]);

    const preparing = await patchWithCsrf(
      `/admin/orders/${orderId}/status`,
      { status: 'preparing', note: 'Kitchen started' },
      adminTokens,
    ).expect(200);
    expect(preparing.body.data.order.status).toBe('preparing');

    const paid = await patchWithCsrf(
      `/admin/orders/${orderId}/payment`,
      { paymentStatus: 'paid', note: 'Cash received' },
      adminTokens,
    ).expect(200);
    expect(paid.body.data.order.paymentStatus).toBe('paid');

    expect(await EmailOutbox.countDocuments({ template: 'payment_confirmation' })).toBe(1);

    const invalid = await patchWithCsrf(
      `/admin/orders/${orderId}/status`,
      { status: 'confirmed' },
      adminTokens,
    ).expect(409);
    expect(invalid.body.error.code).toBe('INVALID_STATUS_TRANSITION');
  });

  it('refuses staff payment confirmation for provider-verified orders', async () => {
    const { tokens } = await fetchCsrf();
    const created = await placeOrder(orderPayload(), tokens).expect(201);
    await Order.updateOne(
      { _id: created.body.data.order.id },
      { $set: { paymentMethod: PAYMENT_METHODS.MOBILE_MONEY } },
    );

    const response = await patchWithCsrf(
      `/admin/orders/${created.body.data.order.id}/payment`,
      { paymentStatus: 'paid' },
      adminTokens,
    ).expect(409);
    expect(response.body.error.code).toBe('PROVIDER_VERIFICATION_REQUIRED');
  });

  it('approves a reservation and records the staff decision', async () => {
    const { tokens } = await fetchCsrf();
    const payload = reservationPayload();
    const created = await postWithCsrf('/reservations', payload, tokens).expect(201);
    const reservationId = created.body.data.reservation.id;

    const list = await getWithAuth('/admin/reservations', adminTokens).expect(200);
    expect(list.body.data).toHaveLength(1);

    const confirmed = await patchWithCsrf(
      `/admin/reservations/${reservationId}/status`,
      { status: 'confirmed', note: 'Table reserved' },
      adminTokens,
    ).expect(200);

    expect(confirmed.body.data.reservation).toMatchObject({
      status: 'confirmed',
      statusLabel: 'Confirmed',
    });
    expect(confirmed.body.data.reservation.statusHistory).toHaveLength(2);
    expect(confirmed.body.data.reservation.statusHistory[1]).toMatchObject({
      status: 'confirmed',
      note: 'Table reserved',
    });
    expect(await EmailOutbox.countDocuments({ template: 'reservation_decision' })).toBe(1);
  });

  it('keeps queued email undelivered while delivery is disabled', async () => {
    const { tokens } = await fetchCsrf();
    await placeOrder(orderPayload(), tokens).expect(201);

    const processed = await postWithCsrf('/admin/emails/process', {}, adminTokens).expect(200);
    expect(processed.body.data).toMatchObject({
      skipped: true,
      processed: 0,
    });
    expect(await EmailOutbox.countDocuments({ status: 'queued' })).toBe(1);
  });
});

describe('customer account management', () => {
  it('updates profile fields and prevents duplicate email addresses', async () => {
    const first = await registerUser({ name: 'Profile Owner' });
    const second = await registerUser({ name: 'Other Profile' });

    const updated = await patchWithCsrf(
      '/me/profile',
      { name: 'Updated Name', phone: '+250788999000' },
      first.tokens,
    ).expect(200);
    expect(updated.body.data.user).toMatchObject({
      name: 'Updated Name',
      phone: '+250788999000',
    });

    const me = await getWithAuth('/auth/me', first.tokens).expect(200);
    expect(me.body.data.user.name).toBe('Updated Name');

    const duplicate = await patchWithCsrf(
      '/me/profile',
      { email: second.payload.email },
      first.tokens,
    ).expect(409);
    expect(duplicate.body.error.code).toBe('EMAIL_IN_USE');
  });

  it('changes the password and revokes other sessions', async () => {
    const registered = await registerUser({ name: 'Password Owner' });
    const secondSession = await loginUser(registered.payload.email, registered.payload.password);

    const wrong = await postWithCsrf(
      '/me/password',
      {
        currentPassword: 'WrongPassword123',
        newPassword: 'NewPassword456',
      },
      registered.tokens,
    ).expect(409);
    expect(wrong.body.error.code).toBe('INVALID_CURRENT_PASSWORD');

    const changed = await postWithCsrf(
      '/me/password',
      {
        currentPassword: registered.payload.password,
        newPassword: 'NewPassword456',
      },
      registered.tokens,
    ).expect(200);
    expect(changed.body.data.message).toMatch(/other signed-in devices/i);

    await getWithAuth('/auth/me', registered.tokens).expect(200);
    const revoked = await getWithAuth('/auth/me', secondSession.tokens).expect(401);
    expect(revoked.body.error.code).toBe('SESSION_REVOKED');

    const oldLogin = await loginUser(registered.payload.email, registered.payload.password);
    expect(oldLogin.response.status).toBe(401);

    const newLogin = await loginUser(registered.payload.email, 'NewPassword456');
    expect(newLogin.response.status).toBe(200);
  });

  it('cancels a signed-in customer reservation from their history', async () => {
    const registered = await registerUser({ name: 'Reservation Owner' });
    const payload = reservationPayload({
      name: registered.payload.name,
      email: registered.payload.email,
    });

    const created = await postWithCsrf('/reservations', payload, registered.tokens).expect(201);
    const reference = created.body.data.reservation.reference;

    const cancelled = await postWithCsrf(
      `/reservations/${reference}/cancel`,
      { reason: 'Plans changed' },
      registered.tokens,
    ).expect(200);
    expect(cancelled.body.data.reservation).toMatchObject({
      reference,
      status: 'cancelled',
      statusLabel: 'Cancelled',
    });

    const mine = await getWithAuth('/reservations/mine', registered.tokens).expect(200);
    expect(mine.body.data.reservations[0].status).toBe('cancelled');
    expect(await EmailOutbox.countDocuments({ template: 'reservation_cancelled' })).toBe(1);
  });
});

describe('stage 3 route guards', () => {
  it('requires staff access for admin order and settings routes', async () => {
    const customerSession = await registerUser({ name: 'Not Staff' });

    await getWithAuth('/admin/orders', customerSession.tokens).expect(403);
    await getWithAuth('/admin/settings', customerSession.tokens).expect(403);
    await getWithAuth('/admin/orders', {}).expect(401);
  });

  it('validates malformed stage 3 payloads', async () => {
    const { tokens } = await fetchCsrf();

    const badOrder = await placeOrder(
      orderPayload({ items: [{ slug: 'french-fries', quantity: 1, price: 1 }] }),
      tokens,
    ).expect(400);
    expect(badOrder.body.error.code).toBe('VALIDATION_ERROR');

    const badPassword = await postWithCsrf(
      '/me/password',
      { currentPassword: 'same', newPassword: 'same' },
      tokens,
    ).expect(401);
    expect(badPassword.body.error.code).toBe('UNAUTHENTICATED');
  });
});
