import { MENU_ORDER_BLOCKING_REVIEW_TAGS } from '../config/constants.js';
import MenuCategory from '../models/MenuCategory.js';
import MenuItem from '../models/MenuItem.js';
import { getMenuOptions } from './menuPricing.service.js';
import { notFound } from '../utils/errors.js';
import { toMediaDto } from '../utils/media.js';

const ORDER_BLOCKING_TAGS = new Set(MENU_ORDER_BLOCKING_REVIEW_TAGS);

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const PUBLIC_ITEM_FILTER = {
  isArchived: false,
  verified: true,
  needsReview: false,
  hasUnresolvedBlockingIssues: { $ne: true },
};

function isOrderable(item) {
  if (!item.isAvailable || item.isArchived) return false;
  if (!item.verified || item.needsReview) return false;
  if (item.hasUnresolvedBlockingIssues) return false;
  return !(item.reviewTags ?? []).some((tag) => ORDER_BLOCKING_TAGS.has(tag));
}

function toPublicCategory(category, count = 0) {
  return {
    id: String(category._id ?? category.id),
    name: category.name,
    slug: category.slug,
    description: category.description ?? '',
    kind: category.kind,
    displayOrder: category.displayOrder,
    itemCount: count,
  };
}

export function toPublicMenuItem(item, { detail = false } = {}) {
  const options = getMenuOptions(item);
  const category =
    item.category && typeof item.category === 'object' && item.category.name
      ? toPublicCategory(item.category)
      : null;

  const result = {
    id: String(item._id ?? item.id),
    name: item.name,
    slug: item.slug,
    price: item.price,
    description: item.description ?? '',
    category,
    includedItems: options.includedItems,
    isAvailable: Boolean(item.isAvailable) && !item.isArchived,
    isOrderable: isOrderable(item),
    orderabilityNote: isOrderable(item)
      ? ''
      : 'Awaiting staff verification before online ordering.',
    isFeatured: Boolean(item.isFeatured),
    isPopular: Boolean(item.isPopular),
    image: toMediaDto(item.image),
    gallery: (item.gallery ?? []).map(toMediaDto),
    hasSizeOptions: options.sizeOptions.length > 0,
    hasServingOptions: options.servingOptions.length > 0,
    hasAddonGroups: options.addonGroups.length > 0,
    displayOrder: item.displayOrder,
  };

  if (detail) {
    result.sizeOptions = options.sizeOptions;
    result.servingOptions = options.servingOptions;
    result.addonGroups = options.addonGroups;
  }

  return result;
}

export async function listCategories() {
  const categories = await MenuCategory.find({ isVisible: true }).sort({
    displayOrder: 1,
    name: 1,
  });

  const counts = await MenuItem.aggregate([
    { $match: PUBLIC_ITEM_FILTER },
    { $group: { _id: '$category', count: { $sum: 1 } } },
  ]);
  const countByCategory = new Map(counts.map((entry) => [String(entry._id), entry.count]));

  return categories.map((category) =>
    toPublicCategory(category, countByCategory.get(String(category._id)) ?? 0),
  );
}

export async function listMenuItems(query) {
  const filter = { ...PUBLIC_ITEM_FILTER };

  if (query.category) {
    const category = await MenuCategory.findOne({ slug: query.category, isVisible: true });
    if (!category) throw notFound('Menu category not found');
    filter.category = category._id;
  } else if (query.kind) {
    const categories = await MenuCategory.find({ kind: query.kind, isVisible: true }).select('_id');
    filter.category = { $in: categories.map((category) => category._id) };
  }

  if (query.search) {
    const search = new RegExp(escapeRegex(query.search), 'i');
    filter.$or = [{ name: search }, { description: search }, { includedItems: search }];
  }

  const sort =
    query.sort === 'price-asc'
      ? { price: 1, displayOrder: 1 }
      : query.sort === 'price-desc'
        ? { price: -1, displayOrder: 1 }
        : query.sort === 'name'
          ? { name: 1 }
          : { displayOrder: 1, name: 1 };

  const skip = (query.page - 1) * query.limit;
  const [items, total] = await Promise.all([
    MenuItem.find(filter)
      .populate('category', 'name slug kind description displayOrder')
      .sort(sort)
      .skip(skip)
      .limit(query.limit),
    MenuItem.countDocuments(filter),
  ]);

  return {
    items: items.map((item) => toPublicMenuItem(item)),
    meta: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
      hasNextPage: skip + items.length < total,
    },
  };
}

export async function getMenuItemBySlug(slug) {
  const item = await MenuItem.findOne({ slug, ...PUBLIC_ITEM_FILTER }).populate(
    'category',
    'name slug kind description displayOrder',
  );
  if (!item) throw notFound('Menu item not found');
  return toPublicMenuItem(item, { detail: true });
}

export async function getMenuMeta() {
  const [categories, totalItems, featuredCount] = await Promise.all([
    listCategories(),
    MenuItem.countDocuments(PUBLIC_ITEM_FILTER),
    MenuItem.countDocuments({ ...PUBLIC_ITEM_FILTER, isFeatured: true }),
  ]);

  return {
    categories,
    totalItems,
    featuredCount,
    orderabilityNotice:
      'Only staff-verified items are published. Published items awaiting review are hidden until resolved.',
  };
}

export { isOrderable };
