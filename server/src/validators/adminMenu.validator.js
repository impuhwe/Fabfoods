import { z } from 'zod';
import env from '../config/env.js';
import { MENU_REVIEW_ISSUE_STATUS_VALUES, MENU_REVIEW_STATUSES } from '../config/constants.js';
import { isManagedMenuPublicId } from '../services/cloudinary.service.js';
import {
  addonGroupSchema,
  priceSchema,
  servingGroupSchema,
  sizeOptionSchema,
  slugSchema,
} from './menu.validator.js';

const mediaInputSchema = z
  .object({
    url: z.string().trim().min(1).max(2048),
    publicId: z.string().trim().max(255).default(''),
    alt: z.string().trim().max(200).default(''),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.publicId) {
      if (!isManagedMenuPublicId(value.publicId)) {
        ctx.addIssue({
          code: 'custom',
          path: ['publicId'],
          message: 'must be a managed FAB FOODS menu image public ID',
        });
      }

      const cloudName = env.cloudinary.cloudName;
      const expectedPrefix = cloudName
        ? `https://res.cloudinary.com/${cloudName}/image/upload/`
        : '';
      if (
        !expectedPrefix ||
        !value.url.startsWith(expectedPrefix) ||
        !value.url.includes(`/${value.publicId}.`)
      ) {
        ctx.addIssue({
          code: 'custom',
          path: ['url'],
          message: 'must be a secure Cloudinary URL for the supplied public ID',
        });
      }
      return;
    }

    const localPath = /^\/images\/menu\/[A-Za-z0-9._-]+\.webp$/;
    const cloudinaryUrl = /^https:\/\/res\.cloudinary\.com\/[A-Za-z0-9_-]+\/image\/upload\//;
    if (!localPath.test(value.url) && !cloudinaryUrl.test(value.url)) {
      ctx.addIssue({
        code: 'custom',
        path: ['url'],
        message: 'must be a local menu asset or a secure Cloudinary URL',
      });
    }
  });

export const cloudinaryDeleteSchema = z
  .object({
    publicId: z.string().trim().min(1).max(255),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (!isManagedMenuPublicId(value.publicId)) {
      ctx.addIssue({
        code: 'custom',
        path: ['publicId'],
        message: 'must be a managed FAB FOODS menu image public ID',
      });
    }
  });

export const adminMenuQuerySchema = z
  .object({
    search: z.string().trim().max(120).optional(),
    category: slugSchema.optional(),
    status: z.enum(['needs-review', 'verified', 'archived', 'non-orderable']).optional(),
    page: z.coerce.number().int().min(1).max(1000).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(50),
  })
  .strict();

export const adminMenuItemUpdateSchema = z
  .object({
    name: z.string().trim().min(2).max(90).optional(),
    description: z.string().trim().max(600).optional(),
    price: priceSchema.optional(),
    categorySlug: slugSchema.optional(),
    isAvailable: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
    displayOrder: z.number().int().min(0).optional(),
    sizeOptions: z.array(sizeOptionSchema).optional(),
    servingOptions: z.array(servingGroupSchema).optional(),
    addonGroups: z.array(addonGroupSchema).optional(),
    image: mediaInputSchema.nullable().optional(),
    gallery: z.array(mediaInputSchema).max(5).optional(),
    note: z.string().trim().max(300).default(''),
  })
  .strict();

export const verifyMenuItemSchema = z
  .object({
    note: z.string().trim().max(300).default(''),
  })
  .strict();

export const resolveReviewIssueSchema = z
  .object({
    status: z.enum(MENU_REVIEW_ISSUE_STATUS_VALUES),
    resolution: z.string().trim().max(500).default(''),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.status === 'resolved' && !value.resolution) {
      ctx.addIssue({
        code: 'custom',
        path: ['resolution'],
        message: 'A resolution note is required when resolving an issue',
      });
    }
  });

export const adminMenuStatuses = Object.freeze({
  ...MENU_REVIEW_STATUSES,
  NEEDS_REVIEW_FILTER: 'needs-review',
  VERIFIED_FILTER: 'verified',
  ARCHIVED_FILTER: 'archived',
  NON_ORDERABLE_FILTER: 'non-orderable',
});
