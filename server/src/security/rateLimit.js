import rateLimit from 'express-rate-limit';
import env from '../config/env.js';
import { tooManyRequests } from '../utils/errors.js';

function buildLimiter({ windowMs, limit, name }) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skip: () => env.RATE_LIMIT_DISABLED,
    handler: (_req, _res, next) => next(tooManyRequests(`${name} rate limit reached`)),
    validate: { trustProxy: false, xForwardedForHeader: false },
  });
}

export const globalLimiter = buildLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  name: 'Request',
});

export const authLimiter = buildLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  name: 'Authentication',
});

export const refreshLimiter = buildLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  name: 'Session refresh',
});

export const formLimiter = buildLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 12,
  name: 'Form submission',
});
