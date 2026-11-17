import { MENU_REVIEW_ISSUE_STATUSES, MENU_REVIEW_STATUSES } from '../config/constants.js';
import MenuCategory from '../models/MenuCategory.js';
import MenuItem from '../models/MenuItem.js';
import MenuReviewIssue from '../models/MenuReviewIssue.js';
import { resolveReviewIssue as persistIssueResolution } from './menuReview.service.js';
import { badRequest, notFound } from '../utils/errors.js';

const ITEM_POPULATE = 'name slug kind description displayOrder';

function categoryFrom(item) {
  const category = item.category;
  if (!category || typeof category !== 'object' || !category.name) return null;
  return {
    id: String(category._id ?? category.id),
    name: category.name,
    slug: category.slug,
    kind: category.kind,
  };
}

function appendNote(existing, note) {
  if (!note) return existing ?? '';
  if (!existing) return note;
  if (existing.includes(note)) return existing;
  return `${existing} ${note}`;
}

function toAdminItem(item) {
  return {
    id: String(item._id ?? item.id),
    name: item.name,
    slug: item.slug,
    price: item.price,
    description: item.description ?? '',
    category: categoryFrom(item),
    isAvailable: Boolean(item.isAvailable),
    isFeatured: Boolean(item.isFeatured),
    isArchived: Boolean(item.isArchived),
    needsReview: Boolean(item.needsReview),
    verified: Boolean(item.verified),
    reviewStatus: item.reviewStatus ?? MENU_REVIEW_STATUSES.NEEDS_REVIEW,
    reviewIssueIds: (item.reviewIssueIds ?? []).map(String),
    hasUnresolvedBlockingIssues: Boolean(item.hasUnresolvedBlockingIssues),
    reviewNote: item.reviewNote ?? '',
    reviewTags: item.reviewTags ?? [],
    dataSource: item.dataSource,
    sourceRef: item.sourceRef ?? '',
    sourcePage: item.sourcePage ?? null,
    verifiedAt: item.verifiedAt ?? null,
    verifiedBy: item.verifiedBy ? String(item.verifiedBy) : null,
    sizeOptions: item.sizeOptions ?? [],
    servingOptions: item.servingOptions ?? [],
    addonGroups: item.addonGroups ?? [],
    displayOrder: item.displayOrder,
    updatedAt: item.updatedAt ?? null,
  };
}

function toAdminIssue(issue) {
  return {
    id: String(issue._id ?? issue.id),
    issueId: issue.issueId,
    sourcePdf: issue.sourcePdf,
    sourcePage: issue.sourcePage,
    item: issue.item,
    issue: issue.issue,
    handling: issue.handling,
    affectedSlugs: issue.affectedSlugs ?? [],
    affectedCategorySlugs: issue.affectedCategorySlugs ?? [],
    blocking: Boolean(issue.blocking),
    status: issue.status,
    resolution: issue.resolution ?? '',
    resolvedAt: issue.resolvedAt ?? null,
    resolvedBy: issue.resolvedBy ? String(issue.resolvedBy) : null,
    history: issue.history ?? [],
    updatedAt: issue.updatedAt ?? null,
  };
}

export async function listAdminMenuItems(query) {
  const filter = {};

  if (query.search) {
    const search = new RegExp(query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ name: search }, { description: search }, { slug: search }];
  }

  if (query.category) {
    const category = await MenuCategory.findOne({ slug: query.category });
    if (!category) throw notFound('Menu category not found');
    filter.category = category._id;
  }

  if (query.status === 'needs-review') filter.needsReview = true;
  if (query.status === 'verified') filter.verified = true;
  if (query.status === 'archived') filter.isArchived = true;
  if (query.status === 'non-orderable') filter.hasUnresolvedBlockingIssues = true;

  const skip = (query.page - 1) * query.limit;
  const [items, total] = await Promise.all([
    MenuItem.find(filter)
      .populate('category', ITEM_POPULATE)
      .sort({ displayOrder: 1, name: 1 })
      .skip(skip)
      .limit(query.limit),
    MenuItem.countDocuments(filter),
  ]);

  return {
    items: items.map(toAdminItem),
    meta: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    },
  };
}

export async function listAdminMenuCategories() {
  const categories = await MenuCategory.find().sort({ displayOrder: 1, name: 1 });
  return categories.map((category) => ({
    id: String(category._id),
    name: category.name,
    slug: category.slug,
    kind: category.kind,
    displayOrder: category.displayOrder,
  }));
}

export async function listAdminReviewIssues() {
  const issues = await MenuReviewIssue.find().sort({ sourcePage: 1, item: 1, issueId: 1 });
  return issues.map(toAdminIssue);
}

export async function updateAdminMenuItem(id, input, actorId) {
  const item = await MenuItem.findById(id);
  if (!item) throw notFound('Menu item not found');

  if (input.categorySlug) {
    const category = await MenuCategory.findOne({ slug: input.categorySlug });
    if (!category) throw badRequest(`Unknown category: ${input.categorySlug}`);
    item.category = category._id;
  }

  const editable = [
    'name',
    'description',
    'price',
    'isAvailable',
    'isFeatured',
    'displayOrder',
    'sizeOptions',
    'servingOptions',
    'addonGroups',
  ];

  for (const field of editable) {
    if (input[field] !== undefined) item[field] = input[field];
  }

  if (input.note) item.reviewNote = appendNote(item.reviewNote, input.note);
  item.updatedBy = actorId ?? null;
  await item.save();

  const stored = await MenuItem.findById(item._id).populate('category', ITEM_POPULATE);
  return toAdminItem(stored);
}

export async function verifyAdminMenuItem(id, { note = '' } = {}, actorId) {
  const item = await MenuItem.findById(id);
  if (!item) throw notFound('Menu item not found');
  if (item.isArchived) throw badRequest('Restore the item before verifying it');

  item.needsReview = false;
  item.verified = true;
  item.reviewStatus = MENU_REVIEW_STATUSES.VERIFIED;
  item.verifiedAt = new Date();
  item.verifiedBy = actorId ?? null;
  item.isAvailable = true;
  item.reviewNote = appendNote(item.reviewNote, note);
  item.updatedBy = actorId ?? null;
  await item.save();

  const stored = await MenuItem.findById(item._id).populate('category', ITEM_POPULATE);
  return toAdminItem(stored);
}

export async function setAdminMenuItemArchived(id, archived, actorId) {
  const item = await MenuItem.findById(id);
  if (!item) throw notFound('Menu item not found');

  item.isArchived = archived;
  if (archived) item.isAvailable = false;
  item.updatedBy = actorId ?? null;
  await item.save();

  const stored = await MenuItem.findById(item._id).populate('category', ITEM_POPULATE);
  return toAdminItem(stored);
}

export async function resolveAdminReviewIssue(id, input, actorId) {
  const issue = await persistIssueResolution(id, input, actorId);
  return toAdminIssue(issue);
}

export const REVIEW_ISSUE_RESOLVED_STATUS = MENU_REVIEW_ISSUE_STATUSES.RESOLVED;
