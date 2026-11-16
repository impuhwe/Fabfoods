import request from 'supertest';
import app from '../../src/app.js';

export const API = '/api/v1';

export function parseSetCookies(response) {
  const cookies = {};
  const headers = response.headers['set-cookie'] ?? [];

  for (const line of headers) {
    const [pair] = line.split(';');
    const separator = pair.indexOf('=');
    if (separator === -1) continue;
    const name = pair.slice(0, separator).trim();
    const value = pair.slice(separator + 1);
    cookies[name] = value;
  }

  return cookies;
}

export function cookieHeader(tokens) {
  return Object.entries(tokens)
    .filter(([name, value]) => name.startsWith('ff_') && value)
    .map(([name, value]) => `${name}=${value}`)
    .join('; ');
}

export async function fetchCsrf() {
  const response = await request(app).get(`${API}/auth/csrf`).expect(200);
  const cookies = parseSetCookies(response);
  return { response, tokens: { ...cookies, ff_csrf: response.body.data.csrfToken } };
}

export function postWithCsrf(path, body, tokens) {
  return request(app)
    .post(`${API}${path}`)
    .set('Cookie', cookieHeader(tokens))
    .set('X-CSRF-Token', tokens.ff_csrf)
    .send(body);
}

export function getWithAuth(path, tokens) {
  return request(app).get(`${API}${path}`).set('Cookie', cookieHeader(tokens));
}

export async function registerUser(overrides = {}) {
  const { tokens } = await fetchCsrf();
  const payload = {
    name: 'Test Customer',
    email: `customer-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`,
    password: 'CorrectHorseBattery1',
    ...overrides,
  };

  const response = await postWithCsrf('/auth/register', payload, tokens);
  const nextTokens = { ...tokens, ...parseSetCookies(response) };

  if (response.body?.data?.csrfToken) nextTokens.ff_csrf = response.body.data.csrfToken;

  return { response, tokens: nextTokens, payload };
}

export async function loginUser(email, password) {
  const { tokens } = await fetchCsrf();
  const response = await postWithCsrf('/auth/login', { email, password }, tokens);
  const nextTokens = { ...tokens, ...parseSetCookies(response) };

  if (response.body?.data?.csrfToken) nextTokens.ff_csrf = response.body.data.csrfToken;

  return { response, tokens: nextTokens };
}
