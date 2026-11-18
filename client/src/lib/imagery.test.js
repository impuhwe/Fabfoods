import { describe, expect, it } from 'vitest';
import { categoryImage, menuItemImage, resolveImageSrc } from './imagery.js';

describe('menu imagery', () => {
  it('prefers the primary image, then gallery, then category fallback', () => {
    const item = {
      category: { slug: 'pizza' },
      image: { url: '/images/menu/veg-pizza.webp' },
      gallery: [{ url: 'https://res.cloudinary.com/example/image/upload/gallery.webp' }],
    };

    expect(menuItemImage(item)).toBe('/images/menu/veg-pizza.webp');
    expect(menuItemImage({ ...item, image: {} })).toBe(
      'https://res.cloudinary.com/example/image/upload/gallery.webp',
    );
    expect(menuItemImage({ ...item, image: {}, gallery: [] })).toBe(categoryImage('pizza'));
    expect(menuItemImage({ ...item, image: { url: '' } })).toBe(
      'https://res.cloudinary.com/example/image/upload/gallery.webp',
    );
  });

  it('resolves empty sources to a safe fallback', () => {
    expect(resolveImageSrc('/images/menu/espresso.webp', categoryImage('hot-coffee'))).toBe(
      '/images/menu/espresso.webp',
    );
    expect(resolveImageSrc('', categoryImage('hot-coffee'))).toBe(categoryImage('hot-coffee'));
    expect(resolveImageSrc('', '')).toMatch(/^https:\/\/images\.unsplash\.com\//);
  });
});
