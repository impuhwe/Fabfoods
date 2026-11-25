import { describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

describe('static runtime images', () => {
  it('serves menu images from the backend', async () => {
    const response = await request(app).get('/images/menu/cafe-latte.webp').expect(200);

    expect(response.headers['content-type']).toMatch(/^image\/webp/);
    expect(response.headers['cache-control']).toContain('public, max-age=3600');
  });

  it('serves brand images from the backend', async () => {
    const response = await request(app).get('/brand/fab-foods-logo.webp').expect(200);

    expect(response.headers['content-type']).toMatch(/^image\/webp/);
    expect(response.headers['cache-control']).toContain('public, max-age=3600');
  });

  it('returns a 404 for missing images', async () => {
    const response = await request(app).get('/images/menu/does-not-exist.webp').expect(404);

    expect(response.body.error.code).toBe('NOT_FOUND');
  });

  it('does not serve files outside the image directories', async () => {
    await request(app).get('/images/menu/..%2f..%2f..%2fpackage.json').expect(404);
    await request(app).get('/brand/..%2f..%2f..%2fpackage.json').expect(404);
  });
});
