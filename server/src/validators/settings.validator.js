import { z } from 'zod';
import { PAYMENT_METHOD_VALUES } from '../config/constants.js';

const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:mm');

const contactSchema = z
  .object({
    phone: z.string().trim().max(30),
    email: z.union([z.string().trim().toLowerCase().email('Enter a valid email').max(254), z.literal('')]),
    address: z.string().trim().max(240),
    whatsapp: z.string().trim().max(30),
  })
  .partial()
  .strict();

const hourSchema = z
  .object({
    day: z.coerce.number().int().min(0).max(6),
    isClosed: z.boolean(),
    open: timeSchema,
    close: timeSchema,
  })
  .strict();

const deliveryZoneSchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    areas: z.array(z.string().trim().min(1).max(80)).max(50).default([]),
    fee: z.coerce.number().min(0),
    minOrder: z.coerce.number().min(0).default(0),
    etaMinutes: z.union([z.coerce.number().int().min(0).max(240), z.null()]).default(null),
    isActive: z.boolean().default(false),
    isVerified: z.boolean().default(false),
  })
  .strict();

const fulfillmentSchema = z
  .object({
    pickupEnabled: z.boolean(),
    deliveryEnabled: z.boolean(),
    orderingPaused: z.boolean(),
    pickupEtaMinutes: z.union([z.coerce.number().int().min(0).max(240), z.null()]),
    minOrder: z.coerce.number().min(0),
    deliveryZones: z.array(deliveryZoneSchema).max(30),
  })
  .partial()
  .strict();

const reservationsSchema = z
  .object({
    enabled: z.boolean(),
    maxPartySize: z.coerce.number().int().min(1).max(100),
    maxDaysAhead: z.coerce.number().int().min(1).max(365),
    policyText: z.string().trim().max(1000),
    autoConfirm: z.literal(false),
  })
  .partial()
  .strict();

const paymentsSchema = z
  .object({
    currency: z.string().trim().toUpperCase().length(3),
    acceptedMethods: z.array(z.enum(PAYMENT_METHOD_VALUES)).max(10),
    enabledMethods: z.array(z.enum(PAYMENT_METHOD_VALUES)).max(10),
    onlineEnabled: z.boolean(),
  })
  .partial()
  .strict();

const verificationSchema = z
  .object({
    contactApproved: z.boolean(),
    hoursApproved: z.boolean(),
    deliveryApproved: z.boolean(),
    paymentsApproved: z.boolean(),
  })
  .partial()
  .strict();

export const updateSettingsSchema = z
  .object({
    contact: contactSchema.optional(),
    hours: z
      .array(hourSchema)
      .max(7)
      .refine(
        (hours) => new Set(hours.map((hour) => hour.day)).size === hours.length,
        'Each weekday can appear only once',
      )
      .optional(),
    fulfillment: fulfillmentSchema.optional(),
    reservations: reservationsSchema.optional(),
    payments: paymentsSchema.optional(),
    verification: verificationSchema.optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, 'Provide at least one setting to update');
