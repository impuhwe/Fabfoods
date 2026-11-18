import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import bcrypt from 'bcrypt';
import AdminInvitation from '../src/models/AdminInvitation.js';
import CateringRequest from '../src/models/CateringRequest.js';
import User from '../src/models/User.js';
import { ROLES, USER_STATUS } from '../src/config/constants.js';
import { createAdmin } from '../scripts/createAdmin.js';
import { startTestDatabase, stopTestDatabase } from './helpers/db.js';
import { fetchCsrf, getWithAuth, loginUser, postWithCsrf, registerUser } from './helpers/auth.js';

const PASSWORD = 'PhaseOnePass123';
const tokens = {};
let guestCsrf;

function kigaliDate(offsetDays = 7) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Kigali' }).format(
    new Date(Date.now() + offsetDays * 24 * 60 * 60 * 1000),
  );
}

function invitationPayload(email) {
  return { name: 'Invited Admin', email, phone: '+250788000001' };
}

function tokenFromInviteUrl(inviteUrl) {
  const url = new URL(inviteUrl);
  return new URLSearchParams(url.hash.slice(1)).get('invitation');
}

function cateringPayload(overrides = {}) {
  return {
    name: 'Catering Guest',
    email: `catering-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`,
    phone: '+250788000000',
    eventType: 'corporate',
    eventDate: kigaliDate(),
    guestCount: 40,
    location: 'Kigali',
    message: 'We need lunch for a team workshop.',
    ...overrides,
  };
}

beforeAll(async () => {
  await startTestDatabase();
  ({ tokens: guestCsrf } = await fetchCsrf());

  await createAdmin({
    name: 'Phase One Admin',
    email: 'phase-one-admin@example.com',
    role: ROLES.ADMIN,
    password: PASSWORD,
  });

  for (const account of [
    { key: 'manager', email: 'phase-one-manager@example.com', role: ROLES.MANAGER },
    { key: 'staff', email: 'phase-one-staff@example.com', role: ROLES.STAFF },
    { key: 'customer', email: 'phase-one-customer@example.com', role: ROLES.CUSTOMER },
  ]) {
    await User.create({
      name: `Phase One ${account.key}`,
      email: account.email,
      passwordHash: await bcrypt.hash(PASSWORD, 10),
      role: account.role,
      status: USER_STATUS.ACTIVE,
      mustChangePassword: false,
    });
    const result = await loginUser(account.email, PASSWORD);
    expect(result.response.status).toBe(200);
    tokens[account.key] = result.tokens;
  }

  const admin = await loginUser('phase-one-admin@example.com', PASSWORD);
  expect(admin.response.status).toBe(200);
  tokens.admin = admin.tokens;
});

afterAll(async () => {
  await stopTestDatabase();
});

describe('guest catering enquiries', () => {
  it('accepts a public catering request without an account', async () => {
    const payload = cateringPayload();
    const response = await postWithCsrf('/catering', payload, guestCsrf).expect(201);

    expect(response.body.data.message).toMatch(/saved for the restaurant team/i);
    expect(await CateringRequest.findOne({ email: payload.email })).toMatchObject({
      name: payload.name,
      eventType: 'corporate',
      guestCount: 40,
      status: 'new',
      source: 'website',
    });
    expect(await CateringRequest.countDocuments({})).toBe(1);
  });

  it('rejects invalid catering details', async () => {
    await postWithCsrf('/catering', cateringPayload({ eventType: 'unknown' }), guestCsrf).expect(
      400,
    );
    await postWithCsrf('/catering', cateringPayload({ guestCount: 0 }), guestCsrf).expect(400);
    expect(await CateringRequest.countDocuments({})).toBe(1);
  });

  it('keeps submitted enquiries behind admin email-view permissions', async () => {
    await getWithAuth('/admin/catering', tokens.customer).expect(403);
    await getWithAuth('/admin/catering', tokens.staff).expect(403);
    await getWithAuth('/admin/catering', tokens.manager).expect(200);

    const response = await getWithAuth('/admin/catering', tokens.admin).expect(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.meta.total).toBe(1);
  });
});

describe('administrator invitations', () => {
  it('allows only administrators to list, create and revoke invitations', async () => {
    await getWithAuth('/admin/invitations', tokens.customer).expect(403);
    await getWithAuth('/admin/invitations', tokens.staff).expect(403);
    await getWithAuth('/admin/invitations', tokens.manager).expect(403);
    await postWithCsrf(
      '/admin/invitations',
      invitationPayload('blocked-invite@example.com'),
      tokens.manager,
    ).expect(403);

    await getWithAuth('/admin/invitations', tokens.admin).expect(200);
  });

  it('creates a one-time invitation without storing or exposing the raw token', async () => {
    const email = 'new-admin@example.com';
    const response = await postWithCsrf(
      '/admin/invitations',
      invitationPayload(email),
      tokens.admin,
    ).expect(201);

    const result = response.body.data;
    expect(result.emailSent).toBe(false);
    expect(result.inviteUrl).toMatch(/\/admin\/accept-invitation#invitation=/);
    expect(result.invitation.tokenHash).toBeUndefined();

    const invitation = await AdminInvitation.findOne({ email });
    expect(invitation.status).toBe('pending');
    expect(invitation.tokenHash).not.toBe(tokenFromInviteUrl(result.inviteUrl));

    const placeholder = await User.findOne({ email });
    expect(placeholder).toMatchObject({
      role: ROLES.ADMIN,
      status: USER_STATUS.SUSPENDED,
      mustChangePassword: true,
    });
  });

  it('lets the invitee activate an administrator account and rejects token reuse', async () => {
    const email = 'accepted-admin@example.com';
    const created = await postWithCsrf(
      '/admin/invitations',
      invitationPayload(email),
      tokens.admin,
    ).expect(201);
    const token = tokenFromInviteUrl(created.body.data.inviteUrl);

    const accepted = await postWithCsrf(
      '/invitations/accept',
      { token, password: 'AcceptedAdmin123' },
      guestCsrf,
    ).expect(200);
    expect(accepted.body.data.user).toMatchObject({ email, role: ROLES.ADMIN });

    const account = await User.findOne({ email }).select('+passwordHash');
    expect(account.status).toBe(USER_STATUS.ACTIVE);
    expect(account.mustChangePassword).toBe(false);
    expect(account.passwordHash).not.toBe('');

    const reused = await postWithCsrf(
      '/invitations/accept',
      { token, password: 'AnotherAdmin123' },
      guestCsrf,
    ).expect(409);
    expect(reused.body.error.code).toBe('INVITATION_ALREADY_USED');
  });

  it('invalidates revoked invitations and releases the reserved email', async () => {
    const email = 'revoked-admin@example.com';
    const created = await postWithCsrf(
      '/admin/invitations',
      invitationPayload(email),
      tokens.admin,
    ).expect(201);
    const token = tokenFromInviteUrl(created.body.data.inviteUrl);
    const invitationId = created.body.data.invitation.id;

    await postWithCsrf(
      `/admin/invitations/${invitationId}/revoke`,
      { reason: 'No longer required' },
      tokens.admin,
    ).expect(200);

    const response = await postWithCsrf(
      '/invitations/accept',
      { token, password: 'RevokedAdmin123' },
      guestCsrf,
    ).expect(409);
    expect(response.body.error.code).toBe('INVITATION_REVOKED');
    expect(await User.findOne({ email })).toBeNull();
  });

  it('expires invitations and records audit actions', async () => {
    const email = 'expired-admin@example.com';
    const created = await postWithCsrf(
      '/admin/invitations',
      invitationPayload(email),
      tokens.admin,
    ).expect(201);
    const token = tokenFromInviteUrl(created.body.data.inviteUrl);

    await AdminInvitation.updateOne(
      { _id: created.body.data.invitation.id },
      { $set: { expiresAt: new Date(Date.now() - 60_000) } },
    );

    const response = await postWithCsrf(
      '/invitations/accept',
      { token, password: 'ExpiredAdmin123' },
      guestCsrf,
    ).expect(400);
    expect(response.body.error.details).toBe('INVITATION_EXPIRED');
    expect(await User.findOne({ email })).toBeNull();

    const audit = await getWithAuth('/admin/audit-logs', tokens.admin).expect(200);
    for (const action of [
      'admin_invitation.create',
      'admin_invitation.accept',
      'admin_invitation.revoke',
      'admin_invitation.expire',
    ]) {
      expect(audit.body.data.logs.map((entry) => entry.action)).toContain(action);
    }
  });

  it('never lets public registration create an administrator', async () => {
    const email = `public-role-${Date.now()}@example.com`;
    const response = await registerUser({
      name: 'Public Registrant',
      email,
      role: ROLES.ADMIN,
    });

    expect(response.response.status).toBe(201);
    expect(response.response.body.data.user).toMatchObject({
      email,
      role: ROLES.CUSTOMER,
    });
  });
});
