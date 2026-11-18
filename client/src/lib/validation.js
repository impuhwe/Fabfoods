import { z } from 'zod';

const name = z.string().trim().min(2, 'Enter your full name').max(80);
const email = z.string().trim().toLowerCase().email('Enter a valid email address').max(254);
const phone = z.string().trim().min(7, 'Enter a contact phone number').max(30);

const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Kigali' }).format(new Date());
const latest = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Kigali' }).format(
  new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
);

export const reservationFormSchema = z.object({
  name,
  email,
  phone,
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
    .max(20, 'Use the contact form for larger parties'),
  occasion: z.string().max(80).default(''),
  specialRequests: z.string().max(600).default(''),
  preparationNotes: z.string().max(500).default(''),
});

export const contactFormSchema = z.object({
  name: z.string().trim().min(2, 'Enter your name').max(80),
  email,
  phone: z.string().trim().max(30).default(''),
  message: z.string().trim().min(10, 'Tell us a little more').max(2000),
});

export const cateringFormSchema = z.object({
  name: z.string().trim().min(2, 'Enter your name').max(80),
  email,
  phone: z.string().trim().max(30).default(''),
  eventType: z.enum(['corporate', 'private', 'wedding', 'community', 'other']),
  eventDate: z
    .union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Choose a valid date'), z.literal('')])
    .default(''),
  guestCount: z.coerce.number().int().min(1, 'Enter at least one guest').max(1000),
  location: z.string().trim().max(160).default(''),
  message: z.string().trim().min(10, 'Tell us a little more').max(2000),
});

export const loginFormSchema = z.object({
  email,
  password: z.string().min(1, 'Password is required').max(200),
});

export const registerFormSchema = z
  .object({
    name,
    email,
    phone: z.string().trim().max(30).optional().default(''),
    password: z
      .string()
      .min(12, 'Use at least 12 characters')
      .max(72, 'Use at most 72 characters')
      .regex(/[a-z]/, 'Include a lowercase letter')
      .regex(/[A-Z]/, 'Include an uppercase letter')
      .regex(/[0-9]/, 'Include a number'),
    confirmPassword: z.string().min(1, 'Confirm your password'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

export const invitationAcceptFormSchema = z
  .object({
    password: z
      .string()
      .min(12, 'Use at least 12 characters')
      .max(72, 'Use at most 72 characters')
      .regex(/[a-z]/, 'Include a lowercase letter')
      .regex(/[A-Z]/, 'Include an uppercase letter')
      .regex(/[0-9]/, 'Include a number'),
    confirmPassword: z.string().min(1, 'Confirm your password'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

export const checkoutFormSchema = z
  .object({
    name,
    email,
    phone,
    fulfillmentType: z.enum(['pickup', 'delivery']),
    paymentMethod: z.string().min(1, 'Choose a payment method'),
    notes: z.string().max(500).default(''),
    deliveryLine1: z.string().trim().max(160).default(''),
    deliveryNotes: z.string().trim().max(240).default(''),
  })
  .refine((values) => values.fulfillmentType !== 'delivery' || values.deliveryLine1.length >= 3, {
    path: ['deliveryLine1'],
    message: 'Enter the delivery address',
  });

export const profileFormSchema = z.object({
  name,
  email,
  phone: z.string().trim().max(30).default(''),
});

export const passwordFormSchema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password').max(200),
    newPassword: z
      .string()
      .min(12, 'Use at least 12 characters')
      .max(72, 'Use at most 72 characters')
      .regex(/[a-z]/, 'Include a lowercase letter')
      .regex(/[A-Z]/, 'Include an uppercase letter')
      .regex(/[0-9]/, 'Include a number'),
    confirmPassword: z.string().min(1, 'Confirm your new password'),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });
