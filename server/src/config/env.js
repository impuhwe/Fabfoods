import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { z } from 'zod';

const currentDir = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(currentDir, '../.env') });
dotenv.config({ path: path.resolve(currentDir, '../../../.env') });

const booleanFromEnv = (defaultValue) =>
  z.preprocess((value) => {
    if (value === undefined || value === '') return defaultValue;
    if (typeof value === 'boolean') return value;
    if (value === 'true' || value === '1') return true;
    if (value === 'false' || value === '0') return false;
    return value;
  }, z.boolean());

const schema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    DEMO_MODE: z.enum(['true', 'false']).optional().default('false'),
    PORT: z.coerce.number().int().min(1).max(65535).default(5000),
    MONGODB_URI: z
      .string()
      .min(1)
      .refine((value) => /^mongodb(\+srv)?:\/\//.test(value), {
        message: 'must start with mongodb:// or mongodb+srv://',
      }),
    CLIENT_ORIGIN: z.string().min(1),
    TRUST_PROXY: booleanFromEnv(false),
    ACCESS_TOKEN_SECRET: z.string().min(32, 'must be at least 32 characters'),
    REFRESH_TOKEN_PEPPER: z.string().min(32, 'must be at least 32 characters'),
    ACCESS_TOKEN_TTL: z
      .string()
      .regex(/^\d+[smhd]$/, 'must look like 15m, 1h or 7d')
      .default('15m'),
    REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().min(1).max(90).default(7),
    BCRYPT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),
    COOKIE_SECURE: booleanFromEnv(false),
    COOKIE_SAME_SITE: z.enum(['lax', 'strict', 'none']).default('lax'),
    COOKIE_DOMAIN: z.string().optional().default(''),
    RATE_LIMIT_DISABLED: booleanFromEnv(false),
    LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
    ALLOW_ADMIN_BOOTSTRAP: booleanFromEnv(false),
    PAYMENT_PROVIDER: z.enum(['disabled', 'flutterwave']).default('disabled'),
    FLUTTERWAVE_SECRET_KEY: z.string().optional().default(''),
    FLUTTERWAVE_WEBHOOK_HASH: z.string().optional().default(''),
    PAYMENT_REDIRECT_URL: z.string().optional().default(''),
    EMAIL_DELIVERY_ENABLED: booleanFromEnv(false),
    BREVO_API_KEY: z.string().optional().default(''),
    BREVO_API_URL: z.string().url().default('https://api.brevo.com/v3/smtp/email'),
    EMAIL_FROM_EMAIL: z.string().optional().default(''),
    EMAIL_FROM_NAME: z.string().optional().default('Fabs Restaurant'),
    EMAIL_OUTBOX_BATCH_SIZE: z.coerce.number().int().min(1).max(100).default(20),
    CLOUDINARY_CLOUD_NAME: z.string().trim().optional().default(''),
    CLOUDINARY_API_KEY: z.string().trim().optional().default(''),
    CLOUDINARY_API_SECRET: z.string().trim().optional().default(''),
    CLOUDINARY_UPLOAD_FOLDER: z.string().trim().optional().default('fab-foods/menu'),
  })
  .superRefine((value, ctx) => {
    if (value.NODE_ENV === 'production' && value.DEMO_MODE === 'true') {
      ctx.addIssue({
        code: 'custom',
        path: ['DEMO_MODE'],
        message: 'must not be enabled in production',
      });
    }

    if (value.NODE_ENV === 'production' && !value.COOKIE_SECURE) {
      ctx.addIssue({
        code: 'custom',
        path: ['COOKIE_SECURE'],
        message: 'must be true in production',
      });
    }

    if (value.COOKIE_SAME_SITE === 'none' && !value.COOKIE_SECURE) {
      ctx.addIssue({
        code: 'custom',
        path: ['COOKIE_SECURE'],
        message: 'must be true when COOKIE_SAME_SITE is none',
      });
    }

    if (value.NODE_ENV === 'production') {
      const placeholder = /change-me|development-only/i;
      for (const key of ['ACCESS_TOKEN_SECRET', 'REFRESH_TOKEN_PEPPER']) {
        if (placeholder.test(value[key])) {
          ctx.addIssue({
            code: 'custom',
            path: [key],
            message: 'must not use the development placeholder in production',
          });
        }
      }
    }

    if (value.PAYMENT_PROVIDER === 'flutterwave') {
      for (const key of ['FLUTTERWAVE_SECRET_KEY', 'FLUTTERWAVE_WEBHOOK_HASH']) {
        if (!value[key]) {
          ctx.addIssue({
            code: 'custom',
            path: [key],
            message: 'is required when PAYMENT_PROVIDER is flutterwave',
          });
        }
      }
    }

    if (value.EMAIL_DELIVERY_ENABLED) {
      for (const key of ['BREVO_API_KEY', 'EMAIL_FROM_EMAIL']) {
        if (!value[key]) {
          ctx.addIssue({
            code: 'custom',
            path: [key],
            message: 'is required when EMAIL_DELIVERY_ENABLED is true',
          });
        }
      }
    }

    if (value.NODE_ENV === 'production' && !value.BREVO_API_URL.startsWith('https://')) {
      ctx.addIssue({
        code: 'custom',
        path: ['BREVO_API_URL'],
        message: 'must use https in production',
      });
    }

    const cloudinaryKeys = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
    const configuredCloudinaryKeys = cloudinaryKeys.filter((key) => value[key]);
    if (
      configuredCloudinaryKeys.length > 0 &&
      configuredCloudinaryKeys.length < cloudinaryKeys.length
    ) {
      for (const key of cloudinaryKeys) {
        if (!value[key]) {
          ctx.addIssue({
            code: 'custom',
            path: [key],
            message: 'all Cloudinary credentials are required together',
          });
        }
      }
    }

    if (
      value.CLOUDINARY_UPLOAD_FOLDER &&
      !/^[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_-]+)*$/.test(value.CLOUDINARY_UPLOAD_FOLDER)
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['CLOUDINARY_UPLOAD_FOLDER'],
        message: 'must be a slash-separated folder path without spaces',
      });
    }
  });

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const problems = parsed.error.issues
    .map((issue) => `${issue.path.join('.') || 'env'}: ${issue.message}`)
    .join('; ');
  throw new Error(`Invalid environment configuration: ${problems}`);
}

const clientOrigins = parsed.data.CLIENT_ORIGIN.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

export const env = Object.freeze({
  ...parsed.data,
  clientOrigins,
  isProduction: parsed.data.NODE_ENV === 'production',
  isDemo: parsed.data.DEMO_MODE === 'true',
  isTest: parsed.data.NODE_ENV === 'test',
  isDevelopment: parsed.data.NODE_ENV === 'development',
  cloudinary: Object.freeze({
    cloudName: parsed.data.CLOUDINARY_CLOUD_NAME,
    apiKey: parsed.data.CLOUDINARY_API_KEY,
    apiSecret: parsed.data.CLOUDINARY_API_SECRET,
    uploadFolder: parsed.data.CLOUDINARY_UPLOAD_FOLDER.replace(/^\/+|\/+$/g, ''),
    configured: Boolean(
      parsed.data.CLOUDINARY_CLOUD_NAME &&
      parsed.data.CLOUDINARY_API_KEY &&
      parsed.data.CLOUDINARY_API_SECRET,
    ),
  }),
});

export const REQUIRED_ENV_KEYS = Object.freeze([
  'NODE_ENV',
  'MONGODB_URI',
  'CLIENT_ORIGIN',
  'ACCESS_TOKEN_SECRET',
  'REFRESH_TOKEN_PEPPER',
]);

export default env;
