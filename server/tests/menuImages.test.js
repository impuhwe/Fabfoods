import { describe, expect, it } from 'vitest';
import menuPdfManifest from '../src/scripts/data/menu.pdf.manifest.js';
import {
  MENU_IMAGE_RESEARCH_DATE,
  MENU_IMAGE_LICENSE,
  MENU_IMAGE_STATUSES,
  menuImageEntries,
  menuImageResearch,
} from '../src/scripts/data/menu-images.manifest.js';
import { buildMenuSeedData } from '../src/services/menuSeed.service.js';

describe('menu image research manifest', () => {
  it('covers every PDF product exactly once in manifest order', () => {
    expect(menuImageResearch.map((record) => record.slug)).toEqual(
      menuPdfManifest.products.map((product) => product.slug),
    );
    expect(MENU_IMAGE_RESEARCH_DATE).toBe('2026-11-17');
    expect(MENU_IMAGE_LICENSE).toMatchObject({
      name: 'Pexels License',
      url: 'https://www.pexels.com/license/',
      attributionRequired: false,
    });
  });

  it('uses only the required explicit statuses for every product', () => {
    const allowed = new Set(Object.values(MENU_IMAGE_STATUSES));
    const counts = new Map();

    for (const record of menuImageResearch) {
      expect(allowed.has(record.status)).toBe(true);
      counts.set(record.status, (counts.get(record.status) ?? 0) + 1);
    }

    expect(counts.get('sourced')).toBe(101);
    expect(counts.get('missing')).toBe(10);
    expect(counts.get('needsReview') ?? 0).toBe(0);

    for (const record of menuImageResearch.filter((entry) => entry.status === 'missing')) {
      expect(record.sourceUrl).toBe('');
      expect(record.imageUrl).toBe('');
      expect(record.localPath).toBeNull();
      expect(record.notes.length).toBeGreaterThan(0);
      expect(record.verificationStatus).toBe('unverified');
    }
  });

  it('has unique, verified source URLs for sourced images', () => {
    const sourced = menuImageEntries();
    expect(sourced).toHaveLength(101);
    expect(new Set(sourced.map((record) => record.filename)).size).toBe(sourced.length);
    expect(new Set(sourced.map((record) => record.localPath)).size).toBe(sourced.length);
    expect(new Set(sourced.map((record) => record.sourceUrl)).size).toBe(sourced.length);
    expect(new Set(sourced.map((record) => record.imageUrl)).size).toBe(sourced.length);

    for (const record of sourced) {
      expect(record.status).toBe('sourced');
      expect(record.verificationStatus).toBe('verified-commercial-use');
      expect(record.sourceName).toBe('Pexels');
      expect(record.photographer.length).toBeGreaterThan(0);
      expect(record.license).toBe('Pexels License');
      expect(record.researchedAt).toBe(MENU_IMAGE_RESEARCH_DATE);
      expect(record.attributionRequired).toBe(false);
      expect(record.localPath).toBe(`/images/menu/${record.filename}`);
    }
  });

  it('attaches local WebP assets to seeded products without changing review state', () => {
    const data = buildMenuSeedData(menuPdfManifest);
    const withImages = data.items.filter((item) => item.image.url);

    expect(data.summary.itemsWithImages).toBe(101);
    expect(withImages).toHaveLength(101);

    for (const item of data.items) {
      expect(item.needsReview).toBe(true);
      expect(item.verified).toBe(false);
      expect(item.isAvailable).toBe(false);
      expect(item.gallery).toEqual([]);
    }

    for (const item of withImages) {
      expect(item.image.url).toMatch(/^\/images\/menu\/[a-z0-9-]+\.webp$/);
      expect(item.image.publicId).toBe('');
      expect(item.image.alt).toBe(`Illustrative image for ${item.name}`);
    }
  });
});
