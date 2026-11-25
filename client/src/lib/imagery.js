export const menuImage = (file) => `/images/menu/${file}.webp`;
export const brandImage = (file) => `/brand/${file}`;

const localImage = menuImage;

const CATEGORY_IMAGES = {
  breakfast: localImage('continental-breakfast'),
  'appetizers-starters': localImage('bbq-potatoes'),
  'soup-of-the-day': localImage('creamy-mushroom-soup'),
  salads: localImage('avocado-salad'),
  'sandwiches-burgers': localImage('beef-or-chicken-burger'),
  'land-and-sea': localImage('whole-grilled-tilapia'),
  pizza: localImage('veg-pizza'),
  'grill-corner': localImage('chicken-brochette-2-skewers'),
  'special-food-corner': localImage('fabfood-potatoes'),
  desserts: localImage('cake-of-the-day'),
  'hot-coffee': localImage('cafe-latte'),
  'iced-coffee': localImage('iced-latte'),
  tea: localImage('african-tea'),
  'soft-drinks': localImage('soda'),
  'fresh-juice': localImage('mango'),
  mojito: localImage('strawberry-mojito'),
  'the-rasips': localImage('indian-vegetable-curry'),
  smoothies: localImage('mango-smoothie'),
  milkshake: localImage('chocolate-milkshake'),
};

export const BRAND_LOGO_IMAGE = brandImage('fab-foods-logo.webp');
export const HIGH_PRIORITY_IMAGE_PROPS = Object.freeze({ fetchpriority: 'high' });

export const HERO_IMAGE = localImage('continental-breakfast');
export const FOOD_HERO_IMAGE = localImage('cafe-latte');
export const STORY_IMAGE = localImage('fabfood-sandwich');
export const COFFEE_IMAGE = localImage('cafe-latte');
export const RESERVATION_IMAGE = localImage('cafe-mocha');

export const GALLERY_IMAGES = [
  {
    src: localImage('continental-breakfast'),
    alt: 'Representative stock photograph of a breakfast spread',
    ratio: 'landscape',
  },
  {
    src: localImage('whole-grilled-chicken'),
    alt: 'Representative stock photograph of grilled chicken',
    ratio: 'portrait',
  },
  {
    src: localImage('cafe-latte'),
    alt: 'Representative stock photograph of a coffee drink',
    ratio: 'portrait',
  },
  {
    src: localImage('chicken-brochette-2-skewers'),
    alt: 'Representative stock photograph of grilled chicken skewers',
    ratio: 'landscape',
  },
  {
    src: localImage('avocado-salad'),
    alt: 'Representative stock photograph of a salad',
    ratio: 'portrait',
  },
  {
    src: localImage('veg-pizza'),
    alt: 'Representative stock photograph of a pizza',
    ratio: 'landscape',
  },
  {
    src: localImage('cake-of-the-day'),
    alt: 'Representative stock photograph of a slice of cake',
    ratio: 'landscape',
  },
  {
    src: localImage('strawberry-milkshake'),
    alt: 'Representative stock photograph of a milkshake',
    ratio: 'portrait',
  },
];

export function categoryImage(slug) {
  return CATEGORY_IMAGES[slug] ?? HERO_IMAGE;
}

export function menuItemImage(item) {
  return (
    item?.image?.url ||
    item?.gallery?.find((image) => image?.url)?.url ||
    categoryImage(item?.category?.slug)
  );
}

export function resolveImageSrc(src, fallback) {
  return src || fallback || HERO_IMAGE;
}
