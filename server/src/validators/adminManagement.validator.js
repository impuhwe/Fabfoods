import { z } from 'zod';
import { MENU_CATEGORY_KIND_VALUES, ROLE_VALUES, USER_STATUS_VALUES } from '../config/constants.js';
import { ASSIGNABLE_STAFF_ROLES } from '../config/permissions.js';
import { priceSchema, slugSchema } from './menu.validator.js';
import { passwordSchema } from './auth.validator.js';

const emailSchema = z.string().trim().toLowerCase().email('Enter a valid email address').max(254);

const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:mm');
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD');

export const createMenuItemSchema = z
  .object({
    name: z.string().trim().min(2).max(90),
    slug: slugSchema,
    categorySlug: slugSchema,
    price: priceSchema,
    description: z.string().trim().max(600).default(''),
    displayOrder: z.number().int().min(0).default(0),
    includedItems: z.array(z.string().trim().max(120)).max(30).default([]),
    note: z.string().trim().max(300).default(''),
  })
  .strict();

export const createMenuCategorySchema = z
  .object({
    name: z.string().trim().min(2).max(60),
    slug: slugSchema,
    description: z.string().trim().max(240).default(''),
    kind: z.enum(MENU_CATEGORY_KIND_VALUES),
    displayOrder: z.number().int().min(0).default(0),
    isVisible: z.boolean().default(true),
  })
  .strict();

export const updateMenuCategorySchema = z
  .object({
    name: z.string().trim().min(2).max(60).optional(),
    description: z.string().trim().max(240).optional(),
    kind: z.enum(MENU_CATEGORY_KIND_VALUES).optional(),
    displayOrder: z.number().int().min(0).optional(),
    isVisible: z.boolean().optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, 'Provide at least one field to update');

export const menuAvailabilitySchema = z
  .object({
    isAvailable: z.boolean(),
  })
  .strict();

export const customerQuerySchema = z
  .object({
    search: z.string().trim().max(120).optional(),
    status: z.enum(USER_STATUS_VALUES).optional(),
    page: z.coerce.number().int().min(1).max(1000).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(50),
  })
  .strict();

export const customerStatusSchema = z
  .object({
    status: z.enum(USER_STATUS_VALUES),
    reason: z.string().trim().max(300).default(''),
  })
  .strict();

export const staffQuerySchema = z
  .object({
    search: z.string().trim().max(120).optional(),
    role: z.enum(ROLE_VALUES).optional(),
    status: z.enum(USER_STATUS_VALUES).optional(),
    page: z.coerce.number().int().min(1).max(1000).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(50),
  })
  .strict();

export const createStaffSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    email: emailSchema,
    phone: z.union([z.string().trim().max(30), z.literal('')]).optional(),
    role: z.enum(ASSIGNABLE_STAFF_ROLES).default('staff'),
  })
  .strict();

export const updateStaffSchema = z
  .object({
    name: z.string().trim().min(2).max(80).optional(),
    phone: z.union([z.string().trim().max(30), z.literal('')]).optional(),
    role: z.enum(ASSIGNABLE_STAFF_ROLES).optional(),
    status: z.enum(USER_STATUS_VALUES).optional(),
    reason: z.string().trim().max(300).default(''),
  })
  .strict()
  .refine(
    (value) =>
      value.name !== undefined ||
      value.phone !== undefined ||
      value.role !== undefined ||
      value.status !== undefined,
    'Provide at least one field to update',
  );

export const auditQuerySchema = z
  .object({
    action: z.string().trim().max(120).optional(),
    targetType: z.string().trim().max(80).optional(),
    actorId: z
      .string()
      .regex(/^[a-fA-F0-9]{24}$/)
      .optional(),
    page: z.coerce.number().int().min(1).max(1000).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(50),
  })
  .strict();

export const rescheduleReservationSchema = z
  .object({
    date: dateSchema,
    time: timeSchema,
    partySize: z.coerce.number().int().min(1).max(100),
    note: z.string().trim().max(300).default(''),
  })
  .strict();

export { passwordSchema, emailSchema };
