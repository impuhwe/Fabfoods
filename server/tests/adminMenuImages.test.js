import { describe, expect, it } from 'vitest';
import {
  adminMenuItemUpdateSchema,
  cloudinaryDeleteSchema,
} from '../src/validators/adminMenu.validator.js';

describe('admin menu image validation', () => {
  it('accepts local menu assets and secure Cloudinary URLs', () => {
    expect(
      adminMenuItemUpdateSchema.safeParse({
        image: { url: '/images/menu/espresso.webp', alt: 'Espresso' },
      }).success,
    ).toBe(true);
    expect(
      adminMenuItemUpdateSchema.safeParse({
        gallery: [
          {
            url: 'https://res.cloudinary.com/fab-foods/image/upload/v123/menu/dish.webp',
            alt: 'Dish',
          },
        ],
      }).success,
    ).toBe(true);
  });

  it('rejects unrelated image hosts', () => {
    const result = adminMenuItemUpdateSchema.safeParse({
      image: { url: 'https://example.com/random.jpg' },
    });
    expect(result.success).toBe(false);
  });

  it('only deletes public IDs inside the managed upload folder', () => {
    expect(cloudinaryDeleteSchema.safeParse({ publicId: 'fab-foods/menu/dish' }).success).toBe(
      true,
    );
    expect(cloudinaryDeleteSchema.safeParse({ publicId: 'other/menu/dish' }).success).toBe(false);
  });
});
