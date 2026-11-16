import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import jwt from 'jsonwebtoken';
import env from '../config/env.js';

const ISSUER = 'fab-foods-api';
const AUDIENCE = 'fab-foods-web';

export function signAccessToken({ userId, role, sessionId }) {
  return jwt.sign(
    { sub: String(userId), role, sid: String(sessionId), typ: 'access' },
    env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: env.ACCESS_TOKEN_TTL,
      issuer: ISSUER,
      audience: AUDIENCE,
      algorithm: 'HS256',
    },
  );
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.ACCESS_TOKEN_SECRET, {
    issuer: ISSUER,
    audience: AUDIENCE,
    algorithms: ['HS256'],
  });
}

export function createRefreshToken() {
  return randomBytes(48).toString('base64url');
}

export function hashRefreshToken(token) {
  return createHmac('sha256', env.REFRESH_TOKEN_PEPPER).update(token).digest('hex');
}

export function generateCsrfToken() {
  return randomBytes(32).toString('hex');
}

export function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  if (bufferA.length !== bufferB.length) return false;
  return timingSafeEqual(bufferA, bufferB);
}
