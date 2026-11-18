import axios from 'axios';

const DEFAULT_API_BASE_URL = '/api/v1';
const CSRF_COOKIE = 'ff_csrf';
const UNSAFE_METHODS = new Set(['post', 'put', 'patch', 'delete']);
const NO_REFRESH_PATHS = [
  '/auth/login',
  '/auth/register',
  '/auth/refresh',
  '/auth/logout',
  '/invitations/accept',
];
const STATUS_MESSAGES = {
  400: 'Please check the details and try again.',
  401: 'Your session has expired. Please sign in again.',
  403: 'You do not have permission to do that.',
  404: 'We could not find what you were looking for.',
  429: 'Too many attempts. Please wait a moment and try again.',
  500: 'The service is temporarily unavailable. Please try again.',
  502: 'The service is temporarily unavailable. Please try again.',
  503: 'The service is temporarily unavailable. Please try again.',
  504: 'The service took too long to respond. Please try again.',
};

export function resolveApiBaseUrl(value, mode = import.meta.env.MODE) {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  if (mode === 'demo') return DEFAULT_API_BASE_URL;
  return trimmed.replace(/\/+$/, '') || DEFAULT_API_BASE_URL;
}

export const API_BASE_URL = resolveApiBaseUrl(import.meta.env.VITE_API_URL, import.meta.env.MODE);

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
    .then(({ data }) => data?.data?.csrfToken ?? readCookie(CSRF_COOKIE))
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

function shouldSkipRefresh(url = '') {
  const path = url.split('?')[0];
  return NO_REFRESH_PATHS.some((endpoint) => path === endpoint || path.endsWith(endpoint));
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;

    if (!original || status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    if (original._skipRefresh || shouldSkipRefresh(original.url ?? '')) {
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
  if (error?.response) {
    const data = error.response.data;
    const details = data?.error?.details;

    if (Array.isArray(details) && details.length > 0) {
      const first = details.find((detail) => typeof detail?.message === 'string') ?? details[0];
      if (typeof first === 'string' && first.trim()) return first;
      if (typeof first?.message === 'string' && first.message.trim()) return first.message;
    }

    const message = data?.error?.message ?? data?.message;
    if (typeof message === 'string' && message.trim()) return message;
    return STATUS_MESSAGES[error.response.status] ?? fallback;
  }

  if (error?.code === 'ECONNABORTED' || /timeout/i.test(error?.message ?? '')) {
    return 'The request took too long. Please try again.';
  }

  return 'Unable to reach the server. Check your connection and try again.';
}

export default api;
