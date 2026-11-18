import { describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { API } from './helpers/auth.js';

describe('health alias', () => {
  it('responds at /health without touching the database', async () => {
    const response = await request(app).get(`${API}/health`).expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe('ok');
  });
});
