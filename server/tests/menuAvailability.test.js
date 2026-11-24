import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import MenuCategory from '../src/models/MenuCategory.js';
import MenuItem from '../src/models/MenuItem.js';
import { API, cookieHeader, fetchCsrf } from './helpers/auth.js';
import {
  clearDatabase,
  getMongoUri,
  startTestDatabase,
  stopTestDatabase,
} from './helpers/db.js';

beforeAll(async () => {
  await startTestDatabase();
});

afterEach(async () => {
  if (mongoose.connection.readyState === 1) await clearDatabase();
});

afterAll(async () => {
  await stopTestDatabase();
});

describe('public menu availability', () => {
  it('returns valid empty responses when the menu collections are empty', async () => {
    const items = await request(app).get(`${API}/menu/items`).expect(200);
    expect(items.body.data.items).toEqual([]);
    expect(items.body.meta).toMatchObject({
      page: 1,
      limit: 24,
      total: 0,
      totalPages: 1,
      hasNextPage: false,
    });

    const meta = await request(app).get(`${API}/menu/meta`).expect(200);
    expect(meta.body.data).toMatchObject({
      categories: [],
      totalItems: 0,
      featuredCount: 0,
    });

    const categories = await request(app).get(`${API}/menu/categories`).expect(200);
    expect(categories.body.data.categories).toEqual([]);
  });

  it('returns published items and hides unverified or blocked items', async () => {
    const category = await MenuCategory.create({ name: 'Test Food', slug: 'test-food' });
    const base = { category: category._id, price: 1500 };

    await MenuItem.create({
      ...base,
      name: 'Published One',
      slug: 'published-one',
      verified: true,
      needsReview: false,
      reviewStatus: 'verified',
      isAvailable: true,
      hasUnresolvedBlockingIssues: false,
    });
    await MenuItem.create({
      ...base,
      name: 'Published Two',
      slug: 'published-two',
      price: 2500,
      verified: true,
      needsReview: false,
      reviewStatus: 'verified',
      isAvailable: true,
      hasUnresolvedBlockingIssues: false,
    });
    await MenuItem.create({
      ...base,
      name: 'Unverified Dish',
      slug: 'unverified-dish',
    });
    await MenuItem.create({
      ...base,
      name: 'Blocked Dish',
      slug: 'blocked-dish',
      verified: true,
      needsReview: false,
      reviewStatus: 'verified',
      isAvailable: true,
      hasUnresolvedBlockingIssues: true,
    });

    const list = await request(app).get(`${API}/menu/items`).expect(200);
    expect(list.body.data.items.map((item) => item.slug)).toEqual([
      'published-one',
      'published-two',
    ]);
    expect(list.body.data.items.every((item) => item.isOrderable)).toBe(true);

    const filtered = await request(app)
      .get(`${API}/menu/items?category=test-food&page=1&limit=1`)
      .expect(200);
    expect(filtered.body.meta).toMatchObject({ total: 2, totalPages: 2, hasNextPage: true });

    const secondPage = await request(app)
      .get(`${API}/menu/items?category=test-food&page=2&limit=1`)
      .expect(200);
    expect(secondPage.body.data.items.map((item) => item.slug)).toEqual(['published-two']);

    await request(app).get(`${API}/menu/items/unverified-dish`).expect(404);
    await request(app).get(`${API}/menu/items/blocked-dish`).expect(404);

    const meta = await request(app).get(`${API}/menu/meta`).expect(200);
    expect(meta.body.data.totalItems).toBe(2);
    expect(meta.body.data.categories[0]).toMatchObject({ slug: 'test-food', itemCount: 2 });
  });

  it('returns a structured 503 when the database is unavailable', async () => {
    const uri = await getMongoUri();
    await mongoose.disconnect();

    const response = await request(app).get(`${API}/menu/items`).expect(503);
    expect(response.body.error.code).toBe('DATABASE_UNAVAILABLE');

    await mongoose.connect(uri, { serverSelectionTimeoutMS: 30_000 });
  });
});

describe('refresh cookie validation', () => {
  it('returns 401 when no refresh cookie is present', async () => {
    const { tokens } = await fetchCsrf();

    const response = await request(app)
      .post(`${API}/auth/refresh`)
      .set('Cookie', cookieHeader(tokens))
      .set('X-CSRF-Token', tokens.ff_csrf)
      .expect(401);

    expect(response.body.error.code).toBe('INVALID_REFRESH_TOKEN');
  });

  it('returns 401 when the refresh cookie is not a valid token', async () => {
    const { tokens } = await fetchCsrf();

    const response = await request(app)
      .post(`${API}/auth/refresh`)
      .set('Cookie', cookieHeader({ ...tokens, ff_refresh: 'not-a-valid-refresh-token' }))
      .set('X-CSRF-Token', tokens.ff_csrf)
      .expect(401);

    expect(response.body.error.code).toBe('INVALID_REFRESH_TOKEN');
  });
});
