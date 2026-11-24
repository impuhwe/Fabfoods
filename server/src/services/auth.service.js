import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import User from '../models/User.js';
import Session from '../models/Session.js';
import env from '../config/env.js';
import { COOKIE_NAMES, ROLES, USER_STATUS } from '../config/constants.js';
import {
  createRefreshToken,
  generateCsrfToken,
  hashRefreshToken,
  signAccessToken,
  verifyAccessToken,
} from '../security/tokens.js';
import {
  clearAuthCookies,
  setAccessCookie,
  setCsrfCookie,
  setRefreshCookie,
} from '../security/cookies.js';
import { conflict, forbidden, invalidCredentials, unauthenticated } from '../utils/errors.js';
import { toPublicUser } from '../utils/user.js';

const DAY_MS = 24 * 60 * 60 * 1000;

function requestMeta(req) {
  return {
    userAgent: req.get('user-agent')?.slice(0, 300) ?? null,
    ip: req.ip?.slice(0, 64) ?? null,
  };
}

async function issueSession(user, req, res, { familyId } = {}) {
  const sessionId = new mongoose.Types.ObjectId();
  const refreshToken = createRefreshToken();
  const csrfToken = generateCsrfToken();
  const meta = requestMeta(req);

  await Session.create({
    _id: sessionId,
    user: user._id,
    refreshTokenHash: hashRefreshToken(refreshToken),
    familyId: familyId ?? new mongoose.Types.ObjectId().toString(),
    expiresAt: new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * DAY_MS),
    lastUsedAt: new Date(),
    ...meta,
  });

  const accessToken = signAccessToken({
    userId: user._id,
    role: user.role,
    sessionId,
  });

  setAccessCookie(res, accessToken);
  setRefreshCookie(res, refreshToken);
  setCsrfCookie(res, csrfToken);

  return { user: toPublicUser(user), csrfToken, sessionId };
}

async function revokeFamily(familyId) {
  await Session.updateMany({ familyId, revokedAt: null }, { $set: { revokedAt: new Date() } });
}

export async function register(input, req, res) {
  const existing = await User.exists({ email: input.email });
  if (existing) throw conflict('An account with that email already exists', 'EMAIL_IN_USE');

  const passwordHash = await bcrypt.hash(input.password, env.BCRYPT_ROUNDS);

  let user;
  try {
    user = await User.create({
      name: input.name,
      email: input.email,
      phone: input.phone ?? null,
      passwordHash,
      role: ROLES.CUSTOMER,
    });
  } catch (error) {
    if (error?.code === 11000) {
      throw conflict('An account with that email already exists', 'EMAIL_IN_USE');
    }
    throw error;
  }

  return issueSession(user, req, res);
}

export async function login(input, req, res) {
  const user = await User.findOne({ email: input.email }).select('+passwordHash');
  if (!user) throw invalidCredentials();

  const matches = await bcrypt.compare(input.password, user.passwordHash);
  if (!matches) throw invalidCredentials();

  if (user.status !== USER_STATUS.ACTIVE) {
    throw forbidden('This account is suspended', 'ACCOUNT_SUSPENDED');
  }

  user.lastLoginAt = new Date();
  await User.updateOne({ _id: user._id }, { $set: { lastLoginAt: user.lastLoginAt } });

  return issueSession(user, req, res);
}

export async function refresh(req, res) {
  const rawToken = req.cookies?.[COOKIE_NAMES.REFRESH];
  if (typeof rawToken !== 'string' || rawToken.length === 0) {
    throw unauthenticated('Refresh token is missing', 'INVALID_REFRESH_TOKEN');
  }

  const session = await Session.findOne({
    refreshTokenHash: hashRefreshToken(rawToken),
  }).populate('user');

  if (!session) {
    throw unauthenticated('Refresh token is not valid', 'INVALID_REFRESH_TOKEN');
  }

  if (session.expiresAt.getTime() <= Date.now()) {
    clearAuthCookies(res);
    throw unauthenticated('Session has expired, please sign in again', 'SESSION_EXPIRED');
  }

  if (session.revokedAt) {
    await revokeFamily(session.familyId);
    clearAuthCookies(res);
    throw unauthenticated('Session reuse detected, please sign in again', 'SESSION_REUSED');
  }

  const user = session.user;
  if (!user) {
    await revokeFamily(session.familyId);
    clearAuthCookies(res);
    throw unauthenticated('Session owner no longer exists', 'SESSION_REVOKED');
  }

  if (user.status !== USER_STATUS.ACTIVE) {
    await revokeFamily(session.familyId);
    clearAuthCookies(res);
    throw forbidden('This account is suspended', 'ACCOUNT_SUSPENDED');
  }

  const claimed = await Session.findOneAndUpdate(
    { _id: session._id, revokedAt: null },
    { $set: { revokedAt: new Date(), lastUsedAt: new Date() } },
    { new: false },
  );

  if (!claimed) {
    await revokeFamily(session.familyId);
    clearAuthCookies(res);
    throw unauthenticated('Session reuse detected, please sign in again', 'SESSION_REUSED');
  }

  const result = await issueSession(user, req, res, { familyId: session.familyId });

  await Session.updateOne({ _id: claimed._id }, { $set: { replacedBySession: result.sessionId } });

  return result;
}

export async function logout(req, res) {
  const revokedIds = [];

  const accessToken = req.cookies?.[COOKIE_NAMES.ACCESS];
  if (accessToken) {
    try {
      const payload = verifyAccessToken(accessToken);
      if (payload?.sid) revokedIds.push(payload.sid);
    } catch {
      // An expired access token must not prevent sign-out.
    }
  }

  const rawRefresh = req.cookies?.[COOKIE_NAMES.REFRESH];
  if (rawRefresh) {
    const refreshSession = await Session.findOne({
      refreshTokenHash: hashRefreshToken(rawRefresh),
    }).select('_id');
    if (refreshSession) revokedIds.push(refreshSession._id);
  }

  if (revokedIds.length > 0) {
    await Session.updateMany(
      { _id: { $in: revokedIds }, revokedAt: null },
      { $set: { revokedAt: new Date() } },
    );
  }

  clearAuthCookies(res);
}

export async function getCurrentUser(userId) {
  const user = await User.findById(userId);
  if (!user) throw unauthenticated('Account no longer exists', 'SESSION_REVOKED');
  return toPublicUser(user);
}
