import { z } from 'zod';
import {
  MENU_REVIEW_ISSUE_STATUS_VALUES,
  MENU_REVIEW_STATUSES,
} from '../config/constants.js';
import {
  addonGroupSchema,
  priceSchema,
  servingGroupSchema,
  sizeOptionSchema,
  slugSchema,
} from './menu.validator.js';

export const adminMenuQuerySchema = z
  .object({
    search: z.string().trim().max(120).optional(),
    category: slugSchema.optional(),
    status: z
      .enum(['needs-review', 'verified', 'archived', 'non-orderable'])
      .optional(),
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
