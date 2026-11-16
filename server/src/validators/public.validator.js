import { z } from 'zod';
import { FULFILLMENT_TYPES, MENU_CATEGORY_KIND_VALUES } from '../config/constants.js';

const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Must be lowercase kebab-case');

const kigaliDate = (date = new Date()) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Kigali' }).format(date);

const today = kigaliDate();
const latest = kigaliDate(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000));

export const menuQuerySchema = z
  .object({
    category: slugSchema.optional(),
    kind: z.enum(MENU_CATEGORY_KIND_VALUES).optional(),
    search: z.string().trim().max(80).optional(),
    sort: z.enum(['recommended', 'price-asc', 'price-desc', 'name']).default('recommended'),
    page: z.coerce.number().int().min(1).max(1000).default(1),
    limit: z.coerce.number().int().min(1).max(60).default(24),
  })
  .strict();

export const quoteLineSchema = z
  .object({
    slug: slugSchema,
    quantity: z.coerce.number().int().min(1).max(20),
    sizeLabel: z.string().trim().max(60).optional(),
    servingSelections: z
      .array(
        z
          .object({
            groupName: z.string().trim().min(1).max(80),
            optionName: z.string().trim().min(1).max(90),
          })
          .strict(),
      )
      .max(30)
      .default([]),
    addonSelections: z
      .array(
        z
          .object({
            groupName: z.string().trim().min(1).max(80),
            optionName: z.string().trim().min(1).max(90),
          })
          .strict(),
      )
      .max(30)
      .default([]),
  })
  .strict();

export const deliveryAddressSchema = z
  .object({
    line1: z.string().trim().max(160).default(''),
    line2: z.string().trim().max(160).default(''),
    city: z.string().trim().max(80).default(''),
    district: z.string().trim().max(80).default(''),
    sector: z.string().trim().max(80).default(''),
    notes: z.string().trim().max(240).default(''),
  })
  .strict();

export const quoteSchema = z
  .object({
    items: z.array(quoteLineSchema).min(1).max(50),
    fulfillmentType: z.enum(Object.values(FULFILLMENT_TYPES)).default(FULFILLMENT_TYPES.PICKUP),
    deliveryAddress: deliveryAddressSchema.optional(),
  })
  .strict();

export const reservationSchema = z
  .object({
    name: z.string().trim().min(2, 'Enter your full name').max(80),
    email: z.string().trim().toLowerCase().email('Enter a valid email address').max(254),
    phone: z.string().trim().min(7, 'Enter a contact phone number').max(30),
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Choose a valid date')
      .refine((value) => value >= today, 'Choose a date from today onward')
      .refine((value) => value <= latest, 'Choose a date within the next 90 days'),
    time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Choose a valid time'),
    partySize: z.coerce
      .number()
      .int()
      .min(1, 'At least one guest')
      .max(20, 'Use the contact form for parties over 20'),
    occasion: z.string().trim().max(80).default(''),
    specialRequests: z.string().trim().max(600).default(''),
  })
  .strict();

export const contactSchema = z
  .object({
    name: z.string().trim().min(2, 'Enter your name').max(80),
    email: z.string().trim().toLowerCase().email('Enter a valid email address').max(254),
    phone: z.string().trim().max(30).default(''),
    message: z.string().trim().min(10, 'Tell us a little more').max(2000),
  })
  .strict();
