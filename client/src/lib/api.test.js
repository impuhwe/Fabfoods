import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  API_BASE_URL,
  api,
  ensureCsrfToken,
  getApiErrorMessage,
  resolveApiBaseUrl,
} from './api.js';

const originalAdapter = api.defaults.adapter;

function response(config, data, status = 200) {
  return { data, status, statusText: 'OK', headers: {}, config };
}

function httpError(status, data, config = {}) {
  const error = new Error(`Request failed with status code ${status}`);
  error.config = config;
  error.response = response(config, data, status);
  error.isAxiosError = true;
  return error;
}

function clearCsrfCookie() {
  document.cookie = 'ff_csrf=; Max-Age=0; Path=/';
}

beforeEach(() => {
  clearCsrfCookie();
});

afterEach(() => {
  api.defaults.adapter = originalAdapter;
  clearCsrfCookie();
  vi.restoreAllMocks();
});

describe('API configuration', () => {
  it('resolves the base URL from Vite configuration', () => {
    expect(resolveApiBaseUrl('  http://localhost:5000/api/v1/  ')).toBe(
      'http://localhost:5000/api/v1',
    );
    expect(resolveApiBaseUrl('')).toBe('/api/v1');
    expect(resolveApiBaseUrl(undefined)).toBe('/api/v1');
  });

  it('uses the configured base URL with credentials enabled', () => {
    expect(API_BASE_URL).toBe(resolveApiBaseUrl(import.meta.env.VITE_API_URL));
    expect(api.defaults.baseURL).toBe(API_BASE_URL);
    expect(api.defaults.withCredentials).toBe(true);
    expect(api.defaults.timeout).toBe(15000);
  });
});

describe('CSRF handling', () => {
  it('fetches a missing token and sends it on unsafe requests', async () => {
    const adapter = vi.fn(async (config) => {
      if (config.url === '/auth/csrf') {
        document.cookie = 'ff_csrf=server-token; Path=/';
        return response(config, { success: true, data: { csrfToken: 'server-token' } });
      }
      return response(config, { success: true, data: { ok: true } });
    });
    api.defaults.adapter = adapter;

    await expect(ensureCsrfToken()).resolves.toBe('server-token');
    await api.post('/contact', { message: 'Hello' });

    const postConfig = adapter.mock.calls.find(([config]) => config.url === '/contact')[0];
    expect(postConfig.headers.get('X-CSRF-Token')).toBe('server-token');
    expect(postConfig.withCredentials).toBe(true);
  });

  it('does not attach a CSRF token to safe requests', async () => {
    document.cookie = 'ff_csrf=cookie-token; Path=/';
    const adapter = vi.fn(async (config) => response(config, { success: true, data: {} }));
    api.defaults.adapter = adapter;

    await api.get('/menu/meta');

    const getConfig = adapter.mock.calls[0][0];
    expect(getConfig.headers.has('X-CSRF-Token')).toBe(false);
  });
});

describe('authentication requests', () => {
  it('refreshes an expired session once and retries the original request', async () => {
    document.cookie = 'ff_csrf=cookie-token; Path=/';
    let protectedCalls = 0;
    const adapter = vi.fn(async (config) => {
      if (config.url === '/auth/refresh') {
        return response(config, { success: true, data: {} });
      }
      if (config.url === '/protected') {
        protectedCalls += 1;
        if (protectedCalls === 1) {
          throw httpError(401, { error: { code: 'UNAUTHENTICATED' } }, config);
        }
      }
      return response(config, { success: true, data: { ok: true } });
    });
    api.defaults.adapter = adapter;

    const result = await api.get('/protected');

    expect(result.data.data.ok).toBe(true);
    expect(adapter.mock.calls.map(([config]) => config.url)).toEqual([
      '/protected',
      '/auth/refresh',
      '/protected',
    ]);
  });

  it('does not attempt a refresh after a failed login', async () => {
    document.cookie = 'ff_csrf=cookie-token; Path=/';
    const adapter = vi.fn(async (config) => {
      throw httpError(401, { error: { code: 'INVALID_CREDENTIALS' } }, config);
    });
    api.defaults.adapter = adapter;

    await expect(api.post('/auth/login', {})).rejects.toMatchObject({
      response: { status: 401 },
    });
    expect(adapter).toHaveBeenCalledTimes(1);
  });

  it('does not retry the original request when refresh fails', async () => {
    document.cookie = 'ff_csrf=cookie-token; Path=/';
    const adapter = vi.fn(async (config) => {
      throw httpError(401, { error: { code: 'UNAUTHENTICATED' } }, config);
    });
    api.defaults.adapter = adapter;

    await expect(api.get('/protected')).rejects.toMatchObject({ response: { status: 401 } });
    expect(adapter.mock.calls.map(([config]) => config.url)).toEqual([
      '/protected',
      '/auth/refresh',
    ]);
  });

  it('attempts at most one refresh for the guest auth probe', async () => {
    document.cookie = 'ff_csrf=cookie-token; Path=/';
    const adapter = vi.fn(async (config) => {
      throw httpError(401, { error: { code: 'UNAUTHENTICATED' } }, config);
    });
    api.defaults.adapter = adapter;

    await expect(api.get('/auth/me')).rejects.toMatchObject({ response: { status: 401 } });
    expect(adapter.mock.calls.map(([config]) => config.url)).toEqual([
      '/auth/me',
      '/auth/refresh',
    ]);
  });
});

describe('API error messages', () => {
  it('uses server validation details when present', () => {
    const error = httpError(400, {
      error: { details: [{ field: 'email', message: 'A valid email is required.' }] },
    });
    expect(getApiErrorMessage(error)).toBe('A valid email is required.');
  });

  it.each([
    [401, 'Your session has expired. Please sign in again.'],
    [403, 'You do not have permission to do that.'],
    [404, 'We could not find what you were looking for.'],
    [429, 'Too many attempts. Please wait a moment and try again.'],
    [500, 'The service is temporarily unavailable. Please try again.'],
  ])('maps HTTP %i to a safe message', (status, message) => {
    expect(getApiErrorMessage(httpError(status, { error: {} }))).toBe(message);
  });

  it('distinguishes network and timeout failures', () => {
    const networkError = Object.assign(new Error('Network Error'), { code: 'ERR_NETWORK' });
    const timeoutError = Object.assign(new Error('timeout of 15000ms exceeded'), {
      code: 'ECONNABORTED',
    });

    expect(getApiErrorMessage(networkError)).toMatch(/Unable to reach the server/);
    expect(getApiErrorMessage(timeoutError)).toMatch(/took too long/);
  });
});
