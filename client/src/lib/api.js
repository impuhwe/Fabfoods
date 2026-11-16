import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? '/api/v1';
const CSRF_COOKIE = 'ff_csrf';
const UNSAFE_METHODS = new Set(['post', 'put', 'patch', 'delete']);
const NO_REFRESH_URLS = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout'];

export function readCookie(name) {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 15000,
  headers: { Accept: 'application/json' },
});

let csrfRequest;

export async function ensureCsrfToken() {
  const existing = readCookie(CSRF_COOKIE);
  if (existing) return existing;

  csrfRequest ??= api
    .get('/auth/csrf')
    .then(() => readCookie(CSRF_COOKIE))
    .finally(() => {
      csrfRequest = null;
    });

  return csrfRequest;
}

api.interceptors.request.use(async (config) => {
  if (UNSAFE_METHODS.has((config.method ?? 'get').toLowerCase())) {
    const token = await ensureCsrfToken();
    if (token) config.headers.set('X-CSRF-Token', token);
  }
  return config;
});

let refreshRequest;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;

    if (!original || status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    const url = original.url ?? '';
    if (original._skipRefresh || NO_REFRESH_URLS.some((path) => url.includes(path))) {
      return Promise.reject(error);
    }

    original._retry = true;

    try {
      refreshRequest ??= api.post('/auth/refresh', null, { _skipRefresh: true }).finally(() => {
        refreshRequest = null;
      });

      await refreshRequest;
      return api(original);
    } catch {
      return Promise.reject(error);
    }
  },
);

export function getApiErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  const details = error?.response?.data?.error?.details;
  if (Array.isArray(details) && details.length > 0) {
    return details[0].message ?? fallback;
  }
  return error?.response?.data?.error?.message ?? fallback;
}

export default api;
