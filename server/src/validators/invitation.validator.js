import { z } from 'zod';
import { ADMIN_INVITATION_STATUS_VALUES } from '../config/constants.js';

const name = z.string().trim().min(2, 'Enter the invitee name').max(80);
const email = z.string().trim().toLowerCase().email('Enter a valid email address').max(254);

const password = z
  .string()
  .min(12, 'Use at least 12 characters')
  .max(72, 'Use at most 72 characters')
  .regex(/[a-z]/, 'Include a lowercase letter')
  .regex(/[A-Z]/, 'Include an uppercase letter')
  .regex(/[0-9]/, 'Include a number');

export const createAdminInvitationSchema = z
  .object({
    name,
    email,
    phone: z.string().trim().max(30).default(''),
  })
  .strict();

export const acceptAdminInvitationSchema = z
  .object({
    token: z.string().trim().min(20).max(300),
    password,
  })
  .strict();

export const revokeAdminInvitationSchema = z
  .object({
    reason: z.string().trim().max(300).default(''),
  })
  .strict();

export const adminInvitationQuerySchema = z
  .object({
    status: z.enum(ADMIN_INVITATION_STATUS_VALUES).optional(),
    page: z.coerce.number().int().min(1).max(1000).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(50),
  })
  .strict();
