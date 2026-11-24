import bcrypt from 'bcrypt';
import env from '../config/env.js';
import User from '../models/User.js';
import Session from '../models/Session.js';
import { toPublicUser } from '../utils/user.js';
import { conflict, notFound, unauthenticated } from '../utils/errors.js';

export async function updateProfile(userId, patch) {
  const user = await User.findById(userId);
  if (!user) throw unauthenticated('Account no longer exists', 'SESSION_REVOKED');

  if (patch.email && patch.email !== user.email) {
    const existing = await User.exists({ email: patch.email, _id: { $ne: user._id } });
    if (existing) throw conflict('An account with that email already exists', 'EMAIL_IN_USE');
    user.email = patch.email;
  }
  if (patch.name !== undefined) user.name = patch.name;
  if (patch.phone !== undefined) user.phone = patch.phone || null;

  await user.save();
  return toPublicUser(user);
}

export async function changePassword(userId, sessionId, currentPassword, newPassword) {
  const user = await User.findById(userId).select('+passwordHash');
  if (!user) throw notFound('Account not found');

  const matches = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!matches) throw conflict('Current password is incorrect', 'INVALID_CURRENT_PASSWORD');

  user.passwordHash = await bcrypt.hash(newPassword, env.BCRYPT_ROUNDS);
  user.passwordChangedAt = new Date();
  user.mustChangePassword = false;
  await user.save();

  await Session.updateMany(
    { user: user._id, _id: { $ne: sessionId }, revokedAt: null },
    { $set: { revokedAt: new Date() } },
  );

  return toPublicUser(user);
}
