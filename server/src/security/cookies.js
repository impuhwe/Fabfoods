import env from '../config/env.js';
import { COOKIE_NAMES } from '../config/constants.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const UNIT_MS = { s: 1000, m: 60 * 1000, h: 60 * 60 * 1000, d: DAY_MS };

function durationToMs(value, fallbackMs) {
  const match = /^(\d+)([smhd])$/.exec(value ?? '');
  return match ? Number(match[1]) * UNIT_MS[match[2]] : fallbackMs;
}

function baseOptions(httpOnly = true) {
  return {
    httpOnly,
    secure: env.COOKIE_SECURE,
    sameSite: env.COOKIE_SAME_SITE,
    path: '/',
    ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
  };
}

export function setAccessCookie(res, token) {
  res.cookie(COOKIE_NAMES.ACCESS, token, {
    ...baseOptions(true),
    maxAge: durationToMs(env.ACCESS_TOKEN_TTL, 15 * 60 * 1000),
  });
}

export function setRefreshCookie(res, token) {
  res.cookie(COOKIE_NAMES.REFRESH, token, {
    ...baseOptions(true),
    maxAge: env.REFRESH_TOKEN_TTL_DAYS * DAY_MS,
  });
}

export function setCsrfCookie(res, token) {
  res.cookie(COOKIE_NAMES.CSRF, token, {
    ...baseOptions(false),
    maxAge: env.REFRESH_TOKEN_TTL_DAYS * DAY_MS,
  });
}

export function clearAuthCookies(res) {
  res.clearCookie(COOKIE_NAMES.ACCESS, baseOptions(true));
  res.clearCookie(COOKIE_NAMES.REFRESH, baseOptions(true));
  res.clearCookie(COOKIE_NAMES.CSRF, baseOptions(false));
}

export function clearCsrfCookie(res) {
  res.clearCookie(COOKIE_NAMES.CSRF, baseOptions(false));
}
