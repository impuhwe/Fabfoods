import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import api from '../lib/api.js';
import {
  deleteAdminMenuImage,
  getAdminMenuImageStatus,
  getAdminMenuUploadSignature,
  uploadAdminMenuImage,
} from './adminApi.js';

const signature = {
  cloudName: 'fab-test',
  apiKey: 'test-key',
  timestamp: 1700000000,
  signature: 'abc123',
  folder: 'fab-foods/menu',
  uploadUrl: 'https://api.cloudinary.com/v1_1/fab-test/image/upload',
};

beforeEach(() => {
  vi.restoreAllMocks();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('admin image API', () => {
  it('loads Cloudinary status and signature from authenticated endpoints', async () => {
    vi.spyOn(api, 'get').mockResolvedValue({
      data: { data: { configured: true, cloudName: 'fab-test' } },
    });
    vi.spyOn(api, 'post')
      .mockResolvedValueOnce({ data: { data: signature } })
      .mockResolvedValueOnce({ data: { data: { deleted: true } } });

    await expect(getAdminMenuImageStatus()).resolves.toEqual({
      configured: true,
      cloudName: 'fab-test',
    });
    await expect(getAdminMenuUploadSignature()).resolves.toEqual(signature);
    await expect(deleteAdminMenuImage('fab-foods/menu/old')).resolves.toEqual({ deleted: true });

    expect(api.get).toHaveBeenCalledWith('/admin/menu/images/status');
    expect(api.post).toHaveBeenNthCalledWith(1, '/admin/menu/images/upload-signature');
    expect(api.post).toHaveBeenNthCalledWith(2, '/admin/menu/images/delete', {
      publicId: 'fab-foods/menu/old',
    });
  });

  it('uploads signed files directly to Cloudinary without sending secrets to the app', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        secure_url: 'https://res.cloudinary.com/fab-test/image/upload/menu/new.webp',
        public_id: 'fab-foods/menu/new',
        original_filename: 'new-dish.webp',
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const file = new File(['image'], 'new-dish.webp', { type: 'image/webp' });
    await expect(uploadAdminMenuImage(file, signature)).resolves.toEqual({
      url: 'https://res.cloudinary.com/fab-test/image/upload/menu/new.webp',
      publicId: 'fab-foods/menu/new',
      alt: 'new dish',
    });

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(signature.uploadUrl);
    expect(options.method).toBe('POST');
    expect(options.body.get('file')).toBe(file);
    expect(options.body.get('api_key')).toBe('test-key');
    expect(options.body.get('timestamp')).toBe('1700000000');
    expect(options.body.get('signature')).toBe('abc123');
    expect(options.body.get('folder')).toBe('fab-foods/menu');
  });

  it('surfaces Cloudinary upload errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ error: { message: 'Invalid signature' } }),
      }),
    );

    const file = new File(['image'], 'dish.jpg', { type: 'image/jpeg' });
    await expect(uploadAdminMenuImage(file, signature)).rejects.toThrow('Invalid signature');
  });
});
