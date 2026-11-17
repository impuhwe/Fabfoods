import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import ContactMessage from '../src/models/ContactMessage.js';
import MenuItem from '../src/models/MenuItem.js';
import Reservation from '../src/models/Reservation.js';
import { seedMenu } from '../scripts/seedMenu.js';
import { startTestDatabase, stopTestDatabase } from './helpers/db.js';
import { publishSeededMenu } from './helpers/menu.js';
import { API, fetchCsrf, getWithAuth, postWithCsrf, registerUser } from './helpers/auth.js';

function kigaliDate(offsetDays = 0) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Kigali' }).format(
    new Date(Date.now() + offsetDays * 24 * 60 * 60 * 1000),
  );
}

beforeAll(async () => {
  await startTestDatabase();
  await seedMenu({ allowUnverified: true });
  await publishSeededMenu();
});

afterAll(async () => {
  await stopTestDatabase();
});

afterEach(async () => {
  await Reservation.deleteMany({});
  await ContactMessage.deleteMany({});
});

describe('public menu API', () => {
  it('lists visible categories with item counts', async () => {
    const response = await request(app).get(`${API}/menu/categories`).expect(200);
    const { categories } = response.body.data;

    expect(categories).toHaveLength(19);
    expect(categories.reduce((total, category) => total + category.itemCount, 0)).toBe(111);
    expect(categories[0]).toMatchObject({ slug: 'breakfast', kind: 'food' });
    expect(JSON.stringify(response.body)).not.toContain('reviewNotes');
  });

  it('returns menu metadata without internal review data', async () => {
    const response = await request(app).get(`${API}/menu/meta`).expect(200);
    const data = response.body.data;

    expect(data.totalItems).toBe(111);
    expect(data.categories).toHaveLength(19);
    expect(data.orderabilityNotice).toMatch(/staff-verified/i);
    expect(JSON.stringify(response.body)).not.toContain('needsReview');
    expect(JSON.stringify(response.body)).not.toContain('sourcePage');
  });

  it('filters, searches, sorts and paginates public items', async () => {
    const firstPage = await request(app)
      .get(`${API}/menu/items`)
      .query({ limit: 10, sort: 'price-asc' })
      .expect(200);

    expect(firstPage.body.data.items).toHaveLength(10);
    expect(firstPage.body.meta).toMatchObject({
      page: 1,
      limit: 10,
      total: 111,
      totalPages: 12,
      hasNextPage: true,
    });
    const prices = firstPage.body.data.items.map((item) => item.price);
    expect(prices).toEqual([...prices].sort((a, b) => a - b));

    const search = await request(app)
      .get(`${API}/menu/items`)
      .query({ search: 'cappucino' })
      .expect(200);
    expect(search.body.data.items.length).toBeGreaterThan(0);
    for (const item of search.body.data.items) {
      expect(item.name.toLowerCase()).toContain('cappucino');
    }

    const coffee = await request(app)
      .get(`${API}/menu/items`)
      .query({ kind: 'drink', limit: 60 })
      .expect(200);
    expect(coffee.body.data.items.length).toBeGreaterThan(0);
    for (const item of coffee.body.data.items) {
      expect(item.category.kind).toBe('drink');
    }
  });

  it('returns detail options for an item and hides review metadata', async () => {
    const response = await request(app).get(`${API}/menu/items/whole-grilled-chicken`).expect(200);
    const { item } = response.body.data;

    expect(item).toMatchObject({
      name: 'WHOLE GRILLED CHICKEN',
      isOrderable: true,
      hasServingOptions: true,
    });
    expect(item.servingOptions[0].name).toBe('Served with');
    expect(item.reviewTags).toBeUndefined();
    expect(item.reviewNotes).toBeUndefined();
    expect(item.verified).toBeUndefined();

    const fries = await request(app).get(`${API}/menu/items/french-fries`).expect(200);
    expect(fries.body.data.item.isOrderable).toBe(true);
    expect(fries.body.data.item.price).toBe(4000);

    const avocado = await request(app).get(`${API}/menu/items/avocado-salad`).expect(200);
    expect(avocado.body.data.item.isOrderable).toBe(false);
    expect(avocado.body.data.item.orderabilityNote).toMatch(/staff verification/i);
  });

  it('returns a clean 404 for unknown items and categories', async () => {
    const missingItem = await request(app).get(`${API}/menu/items/not-a-dish`).expect(404);
    expect(missingItem.body.error.code).toBe('NOT_FOUND');

    const missingCategory = await request(app)
      .get(`${API}/menu/items`)
      .query({ category: 'not-a-category' })
      .expect(404);
    expect(missingCategory.body.error.code).toBe('NOT_FOUND');
  });
});

describe('server-authoritative order quote', () => {
  let csrfTokens;

  beforeAll(async () => {
    ({ tokens: csrfTokens } = await fetchCsrf());
  });

  it('prices a simple pickup order from the database', async () => {
    const response = await postWithCsrf(
      '/orders/quote',
      {
        items: [{ slug: 'french-fries', quantity: 2 }],
        fulfillmentType: 'pickup',
      },
      csrfTokens,
    ).expect(200);

    const { quote } = response.body.data;
    expect(quote).toMatchObject({
      currency: 'RWF',
      itemCount: 2,
      subtotal: 8000,
      total: 8000,
    });
    expect(quote.items[0]).toMatchObject({
      slug: 'french-fries',
      quantity: 2,
      unitPrice: 4000,
      lineTotal: 8000,
    });
    expect(quote.fulfillment).toMatchObject({ type: 'pickup', available: true, fee: 0 });
    expect(quote.payment.onlineEnabled).toBe(false);
  });

  it('applies paid add-ons and reports delivery as unavailable', async () => {
    const response = await postWithCsrf(
      '/orders/quote',
      {
        items: [
          {
            slug: 'stir-fried-vegetables',
            quantity: 1,
            addonSelections: [{ groupName: 'Add-ons', optionName: 'aDD GRILLED CHICKEN BREAST' }],
          },
        ],
        fulfillmentType: 'delivery',
      },
      csrfTokens,
    ).expect(200);

    const { quote } = response.body.data;
    expect(quote.items[0].unitPrice).toBe(8000);
    expect(quote.items[0].addonPrice).toBe(3000);
    expect(quote.total).toBe(8000);
    expect(quote.fulfillment).toMatchObject({ type: 'delivery', available: false, fee: null });
  });

  it('rejects items awaiting staff verification or review resolution', async () => {
    const blockedByTags = await postWithCsrf(
      '/orders/quote',
      { items: [{ slug: 'avocado-salad', quantity: 1 }] },
      csrfTokens,
    ).expect(409);

    expect(blockedByTags.body.error.code).toBe('ITEM_NOT_ORDERABLE');

    await MenuItem.updateOne(
      { slug: 'french-fries' },
      { $set: { verified: false, needsReview: true } },
    );
    try {
      const unverified = await postWithCsrf(
        '/orders/quote',
        { items: [{ slug: 'french-fries', quantity: 1 }] },
        csrfTokens,
      ).expect(409);
      expect(unverified.body.error.code).toBe('ITEM_NOT_VERIFIED');
      expect(unverified.body.error.message).toMatch(/not been verified/i);
    } finally {
      await MenuItem.updateOne(
        { slug: 'french-fries' },
        { $set: { verified: true, needsReview: false } },
      );
    }

    await MenuItem.updateOne(
      { slug: 'french-fries' },
      { $set: { hasUnresolvedBlockingIssues: true } },
    );
    try {
      const unresolved = await postWithCsrf(
        '/orders/quote',
        { items: [{ slug: 'french-fries', quantity: 1 }] },
        csrfTokens,
      ).expect(409);
      expect(unresolved.body.error.code).toBe('ITEM_REVIEW_REQUIRED');
      expect(unresolved.body.error.message).toMatch(/unresolved review issue/i);
    } finally {
      await MenuItem.updateOne(
        { slug: 'french-fries' },
        { $set: { hasUnresolvedBlockingIssues: false } },
      );
    }
  });

  it('rejects invalid selections, client prices and unavailable items', async () => {
    const tampered = await postWithCsrf(
      '/orders/quote',
      { items: [{ slug: 'french-fries', quantity: 1, price: 1 }] },
      csrfTokens,
    ).expect(400);
    expect(tampered.body.error.code).toBe('VALIDATION_ERROR');

    const invalid = await postWithCsrf(
      '/orders/quote',
      {
        items: [
          {
            slug: 'stir-fried-vegetables',
            quantity: 1,
            addonSelections: [{ groupName: 'Add-ons', optionName: 'Not on the menu' }],
          },
        ],
      },
      csrfTokens,
    ).expect(400);
    expect(invalid.body.error.code).toBe('VALIDATION_ERROR');

    await MenuItem.updateOne({ slug: 'french-fries' }, { $set: { isAvailable: false } });
    try {
      const unavailable = await postWithCsrf(
        '/orders/quote',
        { items: [{ slug: 'french-fries', quantity: 1 }] },
        csrfTokens,
      ).expect(409);
      expect(unavailable.body.error.code).toBe('ITEM_UNAVAILABLE');
    } finally {
      await MenuItem.updateOne({ slug: 'french-fries' }, { $set: { isAvailable: true } });
    }
  });

  it('rejects an empty cart and unknown items', async () => {
    const empty = await postWithCsrf('/orders/quote', { items: [] }, csrfTokens).expect(400);
    expect(empty.body.error.code).toBe('VALIDATION_ERROR');

    const unknown = await postWithCsrf(
      '/orders/quote',
      { items: [{ slug: 'missing-dish', quantity: 1 }] },
      csrfTokens,
    ).expect(404);
    expect(unknown.body.error.code).toBe('NOT_FOUND');
  });
});

describe('reservation requests', () => {
  const payload = {
    name: 'Aline Test',
    email: 'aline@example.com',
    phone: '+250788000000',
    date: kigaliDate(2),
    time: '19:30',
    partySize: 4,
    occasion: 'Birthday',
    specialRequests: 'Window table if possible',
  };

  it('creates a pending request and never claims confirmation', async () => {
    const { tokens } = await fetchCsrf();
    const response = await postWithCsrf('/reservations', payload, tokens).expect(201);
    const { reservation, message } = response.body.data;

    expect(reservation).toMatchObject({
      name: payload.name,
      date: payload.date,
      time: '19:30',
      partySize: 4,
      status: 'pending',
      statusLabel: 'Request received',
    });
    expect(reservation.reference).toMatch(/^RS-\d{6}-\d{3}$/);
    expect(message).toMatch(/not a confirmed reservation/i);

    const stored = await Reservation.findOne({ reference: reservation.reference });
    expect(stored.user).toBeNull();
    expect(stored.statusHistory).toHaveLength(1);
    expect(stored.source).toBe('website');
  });

  it('attaches a request to a signed-in customer and lists it in their history', async () => {
    const { tokens } = await registerUser({ name: 'Reservation Customer' });
    const response = await postWithCsrf('/reservations', payload, tokens).expect(201);

    const mine = await getWithAuth('/reservations/mine', tokens).expect(200);
    expect(mine.body.data.reservations).toHaveLength(1);
    expect(mine.body.data.reservations[0]).toMatchObject({
      id: response.body.data.reservation.id,
      status: 'pending',
    });
  });

  it('requires authentication for reservation history', async () => {
    const response = await request(app).get(`${API}/reservations/mine`).expect(401);
    expect(response.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('validates dates, party size and unknown fields', async () => {
    const { tokens } = await fetchCsrf();

    const past = await postWithCsrf(
      '/reservations',
      { ...payload, date: kigaliDate(-1) },
      tokens,
    ).expect(400);
    expect(past.body.error.code).toBe('VALIDATION_ERROR');

    const party = await postWithCsrf('/reservations', { ...payload, partySize: 25 }, tokens).expect(
      400,
    );
    expect(party.body.error.code).toBe('VALIDATION_ERROR');

    const unknown = await postWithCsrf(
      '/reservations',
      { ...payload, internalNote: 'should not be accepted' },
      tokens,
    ).expect(400);
    expect(unknown.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('contact messages', () => {
  it('saves a message without claiming email delivery', async () => {
    const { tokens } = await fetchCsrf();
    const response = await postWithCsrf(
      '/contact',
      {
        name: 'Contact Test',
        email: 'contact@example.com',
        phone: '',
        message: 'I would like to ask about a large group booking.',
      },
      tokens,
    ).expect(201);

    expect(response.body.data.id).toBeDefined();
    expect(response.body.data.message).toMatch(/email delivery is not connected/i);
    expect(await ContactMessage.countDocuments()).toBe(1);
  });

  it('rejects short messages and unknown fields', async () => {
    const { tokens } = await fetchCsrf();

    const short = await postWithCsrf(
      '/contact',
      { name: 'A', email: 'bad', message: 'hi' },
      tokens,
    ).expect(400);
    expect(short.body.error.code).toBe('VALIDATION_ERROR');

    const unknown = await postWithCsrf(
      '/contact',
      {
        name: 'Contact Test',
        email: 'contact@example.com',
        message: 'A valid message for the restaurant.',
        subject: 'not allowed',
      },
      tokens,
    ).expect(400);
    expect(unknown.body.error.code).toBe('VALIDATION_ERROR');
  });
});
