import { API_PREFIX, COOKIE_NAMES, CSRF_HEADER } from '../config/constants.js';
import { generateCsrfToken, safeEqual } from './tokens.js';
import { setCsrfCookie } from './cookies.js';
import { forbidden } from '../utils/errors.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const WEBHOOK_PREFIX = `${API_PREFIX}/payments/webhooks/`;
const CSRF_ERROR = () =>
  forbidden('Missing or invalid CSRF token. Refresh the page and try again.', 'CSRF_INVALID');

export function ensureCsrfCookie(req, res, next) {
  const existing = req.cookies?.[COOKIE_NAMES.CSRF];
  if (existing) {
    req.csrfToken = existing;
    return next();
  }

  const token = generateCsrfToken();
  setCsrfCookie(res, token);
  req.csrfToken = token;
  next();
}

export function verifyCsrf(req, _res, next) {
  if (SAFE_METHODS.has(req.method)) return next();
  if (req.originalUrl.startsWith(WEBHOOK_PREFIX)) return next();

  const cookieToken = req.cookies?.[COOKIE_NAMES.CSRF];
  const headerToken = req.get(CSRF_HEADER);

  if (!cookieToken || !headerToken || !safeEqual(cookieToken, headerToken)) {
    return next(CSRF_ERROR());
  }

  return next();
}
