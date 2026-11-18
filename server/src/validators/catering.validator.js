import { z } from 'zod';

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export const cateringRequestSchema = z
  .object({
    name: z.string().trim().min(2, 'Enter your name').max(80),
    email: z.string().trim().toLowerCase().email('Enter a valid email address').max(254),
    phone: z.string().trim().max(30).default(''),
    eventType: z.enum(['corporate', 'private', 'wedding', 'community', 'other']),
    eventDate: z
      .union([z.string().trim().regex(datePattern, 'Choose a valid date'), z.literal('')])
      .default(''),
    guestCount: z.coerce.number().int().min(1, 'Enter at least one guest').max(1000),
    location: z.string().trim().max(160).default(''),
    message: z.string().trim().min(10, 'Tell us a little more').max(2000),
  })
  .strict();

export const adminCateringQuerySchema = z
  .object({
    status: z.enum(['new', 'read', 'resolved']).optional(),
    page: z.coerce.number().int().min(1).max(1000).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(50),
  })
  .strict();
