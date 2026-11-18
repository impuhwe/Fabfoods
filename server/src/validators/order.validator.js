import { z } from 'zod';
import {
  FULFILLMENT_TYPES,
  ORDER_STATUS_VALUES,
  PAYMENT_METHOD_VALUES,
} from '../config/constants.js';
import { deliveryAddressSchema, quoteLineSchema } from './public.validator.js';

const emailSchema = z.string().trim().toLowerCase().email('Enter a valid email address').max(254);

const customerSchema = z
  .object({
    name: z.string().trim().min(2, 'Enter the customer name').max(80),
    email: emailSchema,
    phone: z.string().trim().min(7, 'Enter a contact phone number').max(30),
  })
  .strict();

export const createOrderSchema = z
  .object({
    items: z.array(quoteLineSchema).min(1).max(50),
    fulfillmentType: z.enum(Object.values(FULFILLMENT_TYPES)).default(FULFILLMENT_TYPES.PICKUP),
    deliveryAddress: deliveryAddressSchema.optional(),
    customer: customerSchema,
    notes: z.string().trim().max(600).default(''),
    paymentMethod: z.enum(PAYMENT_METHOD_VALUES),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.fulfillmentType !== FULFILLMENT_TYPES.DELIVERY) return;
    if (!value.deliveryAddress?.line1) {
      ctx.addIssue({
        code: 'custom',
        path: ['deliveryAddress', 'line1'],
        message: 'Enter the delivery address',
      });
    }
  });

export const orderLookupSchema = z
  .object({
    email: emailSchema.optional(),
  })
  .strict();

export const initiatePaymentSchema = z
  .object({
    email: emailSchema.optional(),
    redirectUrl: z.string().trim().url().max(2000).optional(),
  })
  .strict();

export const cancelOrderSchema = z
  .object({
    email: emailSchema.optional(),
    reason: z.string().trim().max(300).default(''),
  })
  .strict();

export const adminOrderQuerySchema = z
  .object({
    status: z.enum(ORDER_STATUS_VALUES).optional(),
    page: z.coerce.number().int().min(1).max(1000).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(50),
  })
  .strict();

export const adminOrderStatusSchema = z
  .object({
    status: z.enum(ORDER_STATUS_VALUES),
    note: z.string().trim().max(300).default(''),
  })
  .strict();

export const adminOrderPaymentSchema = z
  .object({
    paymentStatus: z.enum(['pending', 'paid', 'cancelled']),
    note: z.string().trim().max(300).default(''),
  })
  .strict();

export const adminEmailQuerySchema = z
  .object({
    status: z.enum(['queued', 'sending', 'sent', 'failed', 'cancelled']).optional(),
    page: z.coerce.number().int().min(1).max(1000).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(50),
  })
  .strict();
