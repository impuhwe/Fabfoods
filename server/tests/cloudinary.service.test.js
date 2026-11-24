import { createHash } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/config/env.js', () => ({
  default: {
    cloudinary: {
      cloudName: 'fab-test',
      apiKey: 'test-api-key',
      apiSecret: 'test-api-secret',
      uploadFolder: 'fab-foods/menu',
      configured: true,
    },
  },
}));

import {
  assertManagedMenuPublicId,
  cloudinaryStatus,
  createMenuImageUploadSignature,
  deleteCloudinaryImage,
  isManagedMenuPublicId,
} from '../src/services/cloudinary.service.js';

const publicId = 'fab-foods/menu/chicken-shawarma-123';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Cloudinary menu image service', () => {
  it('reports configuration without exposing the API secret', () => {
    expect(cloudinaryStatus()).toEqual({
      configured: true,
      cloudName: 'fab-test',
      folder: 'fab-foods/menu',
    });
    expect(JSON.stringify(cloudinaryStatus())).not.toContain('test-api-secret');
  });

  it('only accepts public IDs inside the managed menu folder', () => {
    expect(isManagedMenuPublicId(publicId)).toBe(true);
    expect(isManagedMenuPublicId('fab-foods/brand/logo')).toBe(false);
    expect(isManagedMenuPublicId('fab-foods/menu/../secret')).toBe(false);
    expect(() => assertManagedMenuPublicId('../secret')).toThrow(/not part of the FAB FOODS/);
  });

  it('signs direct uploads with folder and timestamp', () => {
    const signature = createMenuImageUploadSignature();
    const expected = createHash('sha1')
      .update(`folder=fab-foods/menu&timestamp=${signature.timestamp}test-api-secret`)
      .digest('hex');

    expect(signature).toMatchObject({
      cloudName: 'fab-test',
      apiKey: 'test-api-key',
      folder: 'fab-foods/menu',
      uploadUrl: 'https://api.cloudinary.com/v1_1/fab-test/image/upload',
    });
    expect(signature.signature).toBe(expected);
  });

  it('deletes only managed images through the Cloudinary destroy endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ result: 'ok', public_id: publicId }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(deleteCloudinaryImage(publicId)).resolves.toEqual({
      publicId,
      deleted: true,
    });

    const [url, options] = fetchMock.mock.calls[0];
    const body = new URLSearchParams(options.body);
    expect(url).toBe('https://api.cloudinary.com/v1_1/fab-test/image/destroy');
    expect(options.method).toBe('POST');
    expect(body.get('public_id')).toBe(publicId);
    expect(body.get('api_key')).toBe('test-api-key');
    expect(body.get('signature')).toMatch(/^[a-f0-9]{40}$/);
  });
});
