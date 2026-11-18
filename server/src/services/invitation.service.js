import bcrypt from 'bcrypt';
import { randomBytes } from 'node:crypto';
import env from '../config/env.js';
import {
  ADMIN_INVITATION_STATUS,
  ADMIN_INVITATION_TTL_HOURS,
  ROLES,
  USER_STATUS,
} from '../config/constants.js';
import AdminInvitation from '../models/AdminInvitation.js';
import User from '../models/User.js';
import { createAdminInvitationToken, hashAdminInvitationToken } from '../security/tokens.js';
import { isEmailConfigured, sendEmail } from '../emails/brevo.provider.js';
import { renderEmailTemplate } from '../emails/templates.js';
import { badRequest, conflict, forbidden, notFound } from '../utils/errors.js';
import { toPublicUser } from '../utils/user.js';
import { recordAudit } from './audit.service.js';

const HOUR_MS = 60 * 60 * 1000;

function invitationUrl(token) {
  const origin = (env.clientOrigins[0] ?? 'http://localhost:5173').replace(/\/+$/, '');
  return `${origin}/admin/accept-invitation#invitation=${encodeURIComponent(token)}`;
}

function expiresAt() {
  return new Date(Date.now() + ADMIN_INVITATION_TTL_HOURS * HOUR_MS);
}

function temporaryPassword() {
  return `${randomBytes(12).toString('base64url')}Aa1`;
}

async function releasePlaceholder(userId) {
  if (!userId) return;
  await User.deleteOne({
    _id: userId,
    status: USER_STATUS.SUSPENDED,
    mustChangePassword: true,
  });
}

async function expireInvitation(invitation, req) {
  const expired = await AdminInvitation.findOneAndUpdate(
    {
      _id: invitation._id,
      status: ADMIN_INVITATION_STATUS.PENDING,
      expiresAt: { $lte: new Date() },
    },
    { $set: { status: ADMIN_INVITATION_STATUS.EXPIRED } },
    { new: true },
  );
  if (!expired) return null;

  await releasePlaceholder(expired.placeholderUser);
  await recordAudit(req, {
    action: 'admin_invitation.expire',
    targetType: 'adminInvitation',
    targetId: expired._id,
    summary: `Administrator invitation expired for ${expired.email}`,
    metadata: { email: expired.email },
  });
  return expired;
}

async function expireAllPending(req) {
  const due = await AdminInvitation.find({
    status: ADMIN_INVITATION_STATUS.PENDING,
    expiresAt: { $lte: new Date() },
  }).select('_id');
  for (const invitation of due) {
    await expireInvitation(invitation, req);
  }
}

export async function listInvitations(query, req) {
  await expireAllPending(req);

  const filter = query.status ? { status: query.status } : {};
  const skip = (query.page - 1) * query.limit;
  const [invitations, total] = await Promise.all([
    AdminInvitation.find(filter).sort({ createdAt: -1 }).skip(skip).limit(query.limit),
    AdminInvitation.countDocuments(filter),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / query.limit));

  return {
    invitations: invitations.map((invitation) => invitation.toJSON()),
    meta: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages,
      hasNextPage: query.page < totalPages,
      hasPreviousPage: query.page > 1,
    },
  };
}

export async function createInvitation(input, actor, req) {
  if (actor.role !== ROLES.ADMIN) {
    throw forbidden('Only administrators can invite other administrators');
  }

  if (await User.exists({ email: input.email })) {
    throw conflict('An account with that email already exists', 'EMAIL_IN_USE');
  }
  const existing = await AdminInvitation.exists({
    email: input.email,
    status: ADMIN_INVITATION_STATUS.PENDING,
    expiresAt: { $gt: new Date() },
  });
  if (existing) {
    throw conflict('A pending invitation already exists for that email', 'INVITATION_PENDING');
  }

  const token = createAdminInvitationToken();
  const tokenHash = hashAdminInvitationToken(token);
  const validUntil = expiresAt();
  const placeholderPasswordHash = await bcrypt.hash(temporaryPassword(), env.BCRYPT_ROUNDS);

  let placeholder;
  let invitation;
  try {
    placeholder = await User.create({
      name: input.name,
      email: input.email,
      phone: input.phone || null,
      role: ROLES.ADMIN,
      status: USER_STATUS.SUSPENDED,
      passwordHash: placeholderPasswordHash,
      mustChangePassword: true,
    });
    invitation = await AdminInvitation.create({
      name: input.name,
      email: input.email,
      phone: input.phone || '',
      role: ROLES.ADMIN,
      tokenHash,
      expiresAt: validUntil,
      createdBy: actor.id,
      createdByEmail: actor.email,
      placeholderUser: placeholder._id,
    });
  } catch (error) {
    if (placeholder) await releasePlaceholder(placeholder._id);
    if (error?.code === 11000) {
      throw conflict('An invitation or account with that email already exists', 'EMAIL_IN_USE');
    }
    throw error;
  }

  const url = invitationUrl(token);
  const expiresAtLabel = validUntil.toUTCString();
  let emailSent = false;
  let emailError = '';

  if (isEmailConfigured()) {
    try {
      const rendered = renderEmailTemplate('admin_invitation', {
        name: input.name,
        inviterName: actor.name,
        inviteUrl: url,
        expiresAt: expiresAtLabel,
      });
      await sendEmail({
        to: input.email,
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
      });
      emailSent = true;
      invitation.emailSentAt = new Date();
    } catch (error) {
      emailError = error.message.slice(0, 500);
      invitation.emailError = emailError;
    }
    await invitation.save();
  }

  await recordAudit(req, {
    action: 'admin_invitation.create',
    targetType: 'adminInvitation',
    targetId: invitation._id,
    summary: `Administrator invitation created for ${invitation.email}`,
    metadata: {
      email: invitation.email,
      role: invitation.role,
      expiresAt: validUntil.toISOString(),
      emailSent,
    },
  });

  return {
    invitation: invitation.toJSON(),
    inviteUrl: emailSent ? undefined : url,
    emailSent,
    emailError,
  };
}

export async function revokeInvitation(id, input, actor, req) {
  const existing = await AdminInvitation.findById(id);
  if (!existing) throw notFound('Administrator invitation not found');

  if (
    existing.status === ADMIN_INVITATION_STATUS.PENDING &&
    existing.expiresAt.getTime() <= Date.now()
  ) {
    await expireInvitation(existing, req);
  }

  const invitation = await AdminInvitation.findById(id);
  if (invitation.status === ADMIN_INVITATION_STATUS.ACCEPTED) {
    throw badRequest('An accepted invitation cannot be revoked');
  }
  if (invitation.status === ADMIN_INVITATION_STATUS.REVOKED) return invitation.toJSON();

  invitation.status = ADMIN_INVITATION_STATUS.REVOKED;
  invitation.revokedAt = new Date();
  invitation.revokedBy = actor.id;
  invitation.revocationReason = input.reason;
  await invitation.save();
  await releasePlaceholder(invitation.placeholderUser);

  await recordAudit(req, {
    action: 'admin_invitation.revoke',
    targetType: 'adminInvitation',
    targetId: invitation._id,
    summary: `Administrator invitation revoked for ${invitation.email}`,
    metadata: { email: invitation.email, reason: input.reason },
  });

  return invitation.toJSON();
}

export async function acceptInvitation(input, req) {
  const tokenHash = hashAdminInvitationToken(input.token);
  const invitation = await AdminInvitation.findOne({ tokenHash }).select('+tokenHash');
  if (!invitation) {
    throw badRequest('This administrator invitation link is invalid', 'INVALID_INVITATION');
  }
  if (invitation.status === ADMIN_INVITATION_STATUS.ACCEPTED) {
    throw conflict('This invitation has already been used', 'INVITATION_ALREADY_USED');
  }
  if (invitation.status === ADMIN_INVITATION_STATUS.REVOKED) {
    throw conflict('This invitation has been revoked', 'INVITATION_REVOKED');
  }
  if (
    invitation.status === ADMIN_INVITATION_STATUS.EXPIRED ||
    invitation.expiresAt.getTime() <= Date.now()
  ) {
    await expireInvitation(invitation, req);
    throw badRequest('This administrator invitation has expired', 'INVITATION_EXPIRED');
  }

  const placeholder = invitation.placeholderUser
    ? await User.findById(invitation.placeholderUser).select('+passwordHash')
    : null;
  if (!placeholder || placeholder.status !== USER_STATUS.SUSPENDED) {
    throw badRequest('This administrator invitation link is invalid', 'INVALID_INVITATION');
  }

  const previousPasswordHash = placeholder.passwordHash;
  const passwordHash = await bcrypt.hash(input.password, env.BCRYPT_ROUNDS);
  const user = await User.findOneAndUpdate(
    {
      _id: placeholder._id,
      status: USER_STATUS.SUSPENDED,
      mustChangePassword: true,
    },
    {
      $set: {
        status: USER_STATUS.ACTIVE,
        passwordHash,
        mustChangePassword: false,
        passwordChangedAt: new Date(),
      },
    },
    { new: true },
  );
  if (!user) {
    throw conflict('This invitation can no longer be accepted', 'INVITATION_UNAVAILABLE');
  }

  const claimed = await AdminInvitation.findOneAndUpdate(
    {
      _id: invitation._id,
      status: ADMIN_INVITATION_STATUS.PENDING,
      expiresAt: { $gt: new Date() },
    },
    { $set: { status: ADMIN_INVITATION_STATUS.ACCEPTED, acceptedAt: new Date() } },
    { new: true },
  );
  if (!claimed) {
    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          status: USER_STATUS.SUSPENDED,
          passwordHash: previousPasswordHash,
          mustChangePassword: true,
        },
      },
    );
    throw conflict('This invitation can no longer be accepted', 'INVITATION_UNAVAILABLE');
  }

  const auditReq = Object.create(req);
  auditReq.user = { id: user.id, email: user.email };
  await recordAudit(auditReq, {
    action: 'admin_invitation.accept',
    targetType: 'adminInvitation',
    targetId: claimed._id,
    summary: `Administrator invitation accepted by ${user.email}`,
    metadata: { email: user.email, role: user.role },
  });

  return { user: toPublicUser(user) };
}

export default {
  listInvitations,
  createInvitation,
  revokeInvitation,
  acceptInvitation,
};
