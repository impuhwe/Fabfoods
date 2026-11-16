import { z } from 'zod';
import { RESERVATION_STATUS_VALUES } from '../config/constants.js';

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email('Enter a valid email address')
  .max(254);

export const cancelReservationSchema = z
  .object({
    email: emailSchema.optional(),
    reason: z.string().trim().max(300).default(''),
  })
  .strict();

export const adminReservationStatusSchema = z
  .object({
    status: z.enum(RESERVATION_STATUS_VALUES),
    note: z.string().trim().max(300).default(''),
  })
  .strict();

export const adminReservationQuerySchema = z
  .object({
    status: z.enum(RESERVATION_STATUS_VALUES).optional(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    page: z.coerce.number().int().min(1).max(1000).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(50),
  })
  .strict();

