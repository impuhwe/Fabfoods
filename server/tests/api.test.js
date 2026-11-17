import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import bcrypt from 'bcrypt';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import User from '../src/models/User.js';
import Session from '../src/models/Session.js';
import { ROLES, USER_STATUS } from '../src/config/constants.js';
import { createAdmin } from '../scripts/createAdmin.js';
import { clearDatabase, startTestDatabase, stopTestDatabase } from './helpers/db.js';
import {
  API,
  cookieHeader,
  fetchCsrf,
  getWithAuth,
  loginUser,
  parseSetCookies,
  postWithCsrf,
  registerUser,
} from './helpers/auth.js';

beforeAll(async () => {
  await startTestDatabase();
});

afterAll(async () => {
  await stopTestDatabase();
});

afterEach(async () => {
  await clearDatabase();
});

describe('health', () => {
  it('reports liveness without touching the database', async () => {
    const response = await request(app).get(`${API}/health/live`).expect(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe('ok');
  });

  it('reports readiness when MongoDB is reachable', async () => {
    const response = await request(app).get(`${API}/health/ready`).expect(200);
    expect(response.body.data.database).toBe('connected');
  });
});

describe('CORS', () => {
  it('permits credentialed requests from the configured frontend origin', async () => {
    const response = await request(app)
      .options(`${API}/auth/login`)
      .set('Origin', 'http://localhost:5173')
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'content-type,x-csrf-token')
      .expect(204);

    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(response.headers['access-control-allow-credentials']).toBe('true');
    expect(response.headers['access-control-allow-methods']).toContain('PATCH');
    expect(response.headers['access-control-allow-headers']).toContain('X-CSRF-Token');
  });

  it('rejects unapproved origins', async () => {
    const response = await request(app)
      .get(`${API}/health/live`)
      .set('Origin', 'https://example.com')
      .expect(403);

    expect(response.body.error.code).toBe('CORS_ORIGIN_DENIED');
  });
});

describe('CSRF protection', () => {
  it('issues a readable CSRF cookie and returns the token', async () => {
    const response = await request(app).get(`${API}/auth/csrf`).expect(200);
    const csrfCookie = (response.headers['set-cookie'] ?? []).find((line) =>
      line.startsWith('ff_csrf='),
    );

    expect(csrfCookie).toBeDefined();
    expect(csrfCookie).not.toContain('HttpOnly');
    expect(response.body.data.csrfToken).toMatch(/^[a-f0-9]{64}$/);
    expect(csrfCookie).toContain(response.body.data.csrfToken);
  });

  it('rejects state-changing requests without a matching token', async () => {
    const response = await request(app)
      .post(`${API}/auth/register`)
      .send({
        name: 'No CSRF',
        email: 'nocsrf@example.com',
        password: 'CorrectHorseBattery1',
      })
      .expect(403);

    expect(response.body.error.code).toBe('CSRF_INVALID');
  });

  it('rejects a token that does not match the cookie', async () => {
    const { response } = await fetchCsrf();
    const cookies = parseSetCookies(response);

    const blocked = await request(app)
      .post(`${API}/auth/register`)
      .set('Cookie', cookieHeader(cookies))
      .set('X-CSRF-Token', 'f'.repeat(64))
      .send({
        name: 'Mismatch',
        email: 'mismatch@example.com',
        password: 'CorrectHorseBattery1',
      })
      .expect(403);

    expect(blocked.body.error.code).toBe('CSRF_INVALID');
  });
});

describe('registration and sessions', () => {
  it('registers a customer, sets HttpOnly cookies and ignores a role in the payload', async () => {
    const { response } = await registerUser({ role: ROLES.ADMIN, name: 'Grace' });

    expect(response.status).toBe(201);
    expect(response.body.data.user.role).toBe(ROLES.CUSTOMER);
    expect(response.body.data.user.name).toBe('Grace');
    expect(JSON.stringify(response.body)).not.toContain('passwordHash');

    const setCookies = response.headers['set-cookie'] ?? [];
    const access = setCookies.find((line) => line.startsWith('ff_access='));
    const refresh = setCookies.find((line) => line.startsWith('ff_refresh='));

    expect(access).toContain('HttpOnly');
    expect(refresh).toContain('HttpOnly');
    expect(access).toContain('SameSite=Lax');

    const stored = await User.findOne({ email: response.body.data.user.email });
    expect(stored.role).toBe(ROLES.CUSTOMER);
  });

  it('never stores the raw refresh token', async () => {
    const { response, tokens } = await registerUser();
    expect(response.status).toBe(201);

    const session = await Session.findOne({ user: response.body.data.user.id }).select(
      '+refreshTokenHash',
    );

    expect(session).toBeTruthy();
    expect(session.refreshTokenHash).not.toBe(tokens.ff_refresh);
    expect(session.refreshTokenHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('returns the current user for a valid access cookie', async () => {
    const { tokens, payload } = await registerUser();
    const response = await getWithAuth('/auth/me', tokens).expect(200);

    expect(response.body.data.user.email).toBe(payload.email);
  });

  it('rejects duplicate email addresses', async () => {
    const { payload } = await registerUser();
    const { tokens } = await fetchCsrf();

    const response = await postWithCsrf('/auth/register', payload, tokens).expect(409);
    expect(response.body.error.code).toBe('EMAIL_IN_USE');
  });

  it('rejects weak passwords', async () => {
    const { tokens } = await fetchCsrf();
    const response = await postWithCsrf(
      '/auth/register',
      {
        name: 'Weak',
        email: 'weak@example.com',
        password: 'short',
      },
      tokens,
    ).expect(400);

    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects incorrect credentials', async () => {
    const { payload } = await registerUser();
    const { response } = await loginUser(payload.email, 'WrongPassword123');
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
  });
});

describe('refresh rotation', () => {
  it('rotates tokens and detects reuse, revoking the family', async () => {
    const { tokens } = await registerUser();
    const oldRefresh = tokens.ff_refresh;

    const rotated = await request(app)
      .post(`${API}/auth/refresh`)
      .set('Cookie', cookieHeader(tokens))
      .set('X-CSRF-Token', tokens.ff_csrf)
      .expect(200);

    const nextTokens = { ...tokens, ...parseSetCookies(rotated) };
    expect(nextTokens.ff_refresh).toBeDefined();
    expect(nextTokens.ff_refresh).not.toBe(oldRefresh);

    const reuse = await request(app)
      .post(`${API}/auth/refresh`)
      .set('Cookie', cookieHeader({ ...nextTokens, ff_refresh: oldRefresh }))
      .set('X-CSRF-Token', nextTokens.ff_csrf)
      .expect(401);

    expect(reuse.body.error.code).toBe('SESSION_REUSED');

    const familyRevoked = await request(app)
      .post(`${API}/auth/refresh`)
      .set('Cookie', cookieHeader(nextTokens))
      .set('X-CSRF-Token', nextTokens.ff_csrf)
      .expect(401);

    expect(familyRevoked.body.error.code).toBe('SESSION_REUSED');
  });
});

describe('logout and suspension', () => {
  it('revokes the session on logout', async () => {
    const { tokens } = await registerUser();

    await request(app)
      .post(`${API}/auth/logout`)
      .set('Cookie', cookieHeader(tokens))
      .set('X-CSRF-Token', tokens.ff_csrf)
      .expect(204);

    const me = await getWithAuth('/auth/me', tokens).expect(401);
    expect(me.body.error.code).toBe('SESSION_REVOKED');

    const refresh = await request(app)
      .post(`${API}/auth/refresh`)
      .set('Cookie', cookieHeader(tokens))
      .set('X-CSRF-Token', tokens.ff_csrf)
      .expect(401);

    expect(['SESSION_REVOKED', 'SESSION_REUSED']).toContain(refresh.body.error.code);
  });

  it('blocks suspended accounts on session use and login', async () => {
    const { tokens, payload, response } = await registerUser();

    await User.updateOne(
      { _id: response.body.data.user.id },
      { $set: { status: USER_STATUS.SUSPENDED } },
    );

    const me = await getWithAuth('/auth/me', tokens).expect(403);
    expect(me.body.error.code).toBe('ACCOUNT_SUSPENDED');

    const login = await loginUser(payload.email, payload.password);
    expect(login.response.status).toBe(403);
    expect(login.response.body.error.code).toBe('ACCOUNT_SUSPENDED');
  });
});

describe('role-based access control', () => {
  async function createAdminUser() {
    const email = `admin-${Date.now()}@example.com`;
    const password = 'AdminPassword123';
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: 'Admin User',
      email,
      passwordHash,
      role: ROLES.ADMIN,
    });

    const { tokens } = await loginUser(email, password);
    return { user, tokens };
  }

  it('allows admins through and blocks customers', async () => {
    const { tokens: adminTokens } = await createAdminUser();
    const adminPing = await getWithAuth('/admin/ping', adminTokens).expect(200);
    expect(adminPing.body.data.role).toBe(ROLES.ADMIN);

    const { tokens: customerTokens } = await registerUser();
    const customerPing = await getWithAuth('/admin/ping', customerTokens).expect(403);
    expect(customerPing.body.error.code).toBe('FORBIDDEN');
  });

  it('requires authentication for the admin area', async () => {
    const response = await request(app).get(`${API}/admin/ping`).expect(401);
    expect(response.body.error.code).toBe('UNAUTHENTICATED');
  });
});

describe('admin bootstrap', () => {
  it('creates a protected admin account and refuses duplicates', async () => {
    const email = `bootstrap-${Date.now()}@example.com`;
    const password = 'BootstrapPassword123';

    const user = await createAdmin({ name: 'Bootstrap Admin', email, password });
    expect(user.role).toBe(ROLES.ADMIN);
    expect(user.status).toBe(USER_STATUS.ACTIVE);
    expect(user.mustChangePassword).toBe(true);

    await expect(createAdmin({ name: 'Duplicate', email, password })).rejects.toMatchObject({
      code: 'EMAIL_IN_USE',
    });

    const { response } = await loginUser(email, password);
    expect(response.status).toBe(200);
    expect(response.body.data.user.role).toBe(ROLES.ADMIN);
  });
});

describe('database invariants', () => {
  it('has a TTL index on session expiry', async () => {
    await Session.init();
    const indexes = await Session.collection.indexes();
    const ttl = indexes.find((index) => index.key?.expiresAt === 1);
    expect(ttl).toBeTruthy();
    expect(ttl.expireAfterSeconds).toBe(0);
  });

  it('does not expose Mongoose internals in responses', async () => {
    const response = await request(app).get(`${API}/does-not-exist`).expect(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
    expect(JSON.stringify(response.body)).not.toContain('stack');
    expect(mongoose.connection.readyState).toBe(1);
  });
});
