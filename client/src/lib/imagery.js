const unsplash = (id, width = 1000) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=72`;

const CATEGORY_IMAGES = {
  breakfast: unsplash('photo-1533089860892-a7c6f0a88666'),
  'appetizers-starters': unsplash('photo-1541529086526-db283c563270'),
  'soup-of-the-day': unsplash('photo-1547592180-85f173990554'),
  salads: unsplash('photo-1512621776951-a57141f2eefd'),
  'sandwiches-burgers': unsplash('photo-1568901346375-23c9450c58cd'),
  'land-and-sea': unsplash('photo-1544025162-d76694265947'),
  pizza: unsplash('photo-1565299624946-b28f40a0ae38'),
  'grill-corner': unsplash('photo-1555939594-58d7cb561ad1'),
  'special-food-corner': unsplash('photo-1504674900247-0877df9cc836'),
  desserts: unsplash('photo-1551024506-0bccd828d307'),
  'hot-coffee': unsplash('photo-1495474472287-4d71bcdd2085'),
  'iced-coffee': unsplash('photo-1461023058943-07fcbe16d735'),
  tea: unsplash('photo-1544787219-7f47ccb76574'),
  'soft-drinks': unsplash('photo-1622483767028-3f66f32aef97'),
  'fresh-juice': unsplash('photo-1600271886742-f049cd451bba'),
  mojito: unsplash('photo-1551538827-9c037cb4f32a'),
  'the-rasips': unsplash('photo-1544145945-f90425340c7e'),
  smoothies: unsplash('photo-1505252585461-04db1eb84625'),
  milkshake: unsplash('photo-1572490122747-3968b75cc699'),
};

export const HIGH_PRIORITY_IMAGE_PROPS = Object.freeze({ fetchpriority: 'high' });

export const HERO_IMAGE = unsplash('photo-1517248135467-4c7edcad34c4', 1600);
export const FOOD_HERO_IMAGE = unsplash('photo-1504674900247-0877df9cc836', 1800);
export const STORY_IMAGE = unsplash('photo-1414235077428-338989a2e8c0', 1200);
export const COFFEE_IMAGE = unsplash('photo-1495474472287-4d71bcdd2085', 1200);
export const RESERVATION_IMAGE = unsplash('photo-1559339352-11d035aa65de', 1400);

export const GALLERY_IMAGES = [
  {
    src: unsplash('photo-1517248135467-4c7edcad34c4', 1600),
    alt: 'Warm restaurant dining room with timber tables',
    ratio: 'landscape',
  },
  {
    src: unsplash('photo-1504674900247-0877df9cc836', 1200),
    alt: 'A generous table of shared dishes',
    ratio: 'portrait',
  },
  {
    src: unsplash('photo-1495474472287-4d71bcdd2085', 1200),
    alt: 'Coffee served in a warm-toned cup',
    ratio: 'portrait',
  },
  {
    src: unsplash('photo-1555939594-58d7cb561ad1', 1600),
    alt: 'Grilled food over open flame',
    ratio: 'landscape',
  },
  {
    src: unsplash('photo-1512621776951-a57141f2eefd', 1200),
    alt: 'Fresh salad with leaves and vegetables',
    ratio: 'portrait',
  },
  {
    src: unsplash('photo-1565299624946-b28f40a0ae38', 1600),
    alt: 'Pizza fresh from the oven',
    ratio: 'landscape',
  },
  {
    src: unsplash('photo-1414235077428-338989a2e8c0', 1600),
    alt: 'Restaurant table set for service',
    ratio: 'landscape',
  },
  {
    src: unsplash('photo-1551024506-0bccd828d307', 1200),
    alt: 'Dessert with cream and berries',
    ratio: 'portrait',
  },
];

export function categoryImage(slug) {
  return CATEGORY_IMAGES[slug] ?? HERO_IMAGE;
}

export function menuItemImage(item) {
  return item?.image?.url ?? categoryImage(item?.category?.slug);
}
