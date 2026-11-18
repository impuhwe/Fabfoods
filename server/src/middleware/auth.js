import Session from '../models/Session.js';
import { COOKIE_NAMES } from '../config/constants.js';
import { verifyAccessToken } from '../security/tokens.js';
import { toPublicUser } from '../utils/user.js';
import { forbidden, unauthenticated } from '../utils/errors.js';
import { USER_STATUS } from '../config/constants.js';
import { hasPermission } from '../config/permissions.js';

async function resolveSessionUser(req) {
  const token = req.cookies?.[COOKIE_NAMES.ACCESS];
  if (!token) throw unauthenticated('Sign in to continue');

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    throw unauthenticated('Your session is invalid or has expired', 'INVALID_SESSION');
  }

  if (payload?.typ !== 'access' || !payload.sid || !payload.sub) {
    throw unauthenticated('Your session is invalid', 'INVALID_SESSION');
  }

  const session = await Session.findById(payload.sid).populate('user');

  if (!session) throw unauthenticated('Session is no longer valid', 'SESSION_REVOKED');
  if (session.revokedAt) throw unauthenticated('Session was signed out', 'SESSION_REVOKED');
  if (session.expiresAt.getTime() <= Date.now()) {
    throw unauthenticated('Session has expired', 'SESSION_EXPIRED');
  }
  if (!session.user) throw unauthenticated('Account no longer exists', 'SESSION_REVOKED');
  if (String(session.user._id) !== payload.sub) {
    throw unauthenticated('Session is invalid', 'INVALID_SESSION');
  }
  if (session.user.status !== USER_STATUS.ACTIVE) {
    throw forbidden('This account is suspended', 'ACCOUNT_SUSPENDED');
  }

  req.auth = payload;
  req.session = session;
  req.user = toPublicUser(session.user);
}

export async function requireAuth(req, _res, next) {
  try {
    await resolveSessionUser(req);
    return next();
  } catch (error) {
    return next(error);
  }
}

export async function optionalAuth(req, _res, next) {
  try {
    await resolveSessionUser(req);
  } catch {
    req.user = null;
    req.session = null;
    req.auth = null;
  }
  return next();
}

export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user) return next(unauthenticated('Sign in to continue'));
    if (!roles.includes(req.user.role)) {
      return next(forbidden('You do not have permission to do that'));
    }
    return next();
  };
}

export function assertPermission(req, permission) {
  if (!req.user) throw unauthenticated('Sign in to continue');
  if (!hasPermission(req.user.role, permission)) {
    throw forbidden('You do not have permission to do that');
  }
}

export function requirePermission(...permissions) {
  return (req, _res, next) => {
    if (!req.user) return next(unauthenticated('Sign in to continue'));
    const allowed = permissions.every((permission) => hasPermission(req.user.role, permission));
    if (!allowed) return next(forbidden('You do not have permission to do that'));
    return next();
  };
}
