import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from '../lib/api.js';
import {
  createOrder,
  getMenuCategories,
  getMenuItem,
  getMenuItems,
  getMenuMeta,
  quoteOrder,
  requestReservation,
  sendContactMessage,
} from './publicApi.js';
import { getAdminOrders, updateAdminOrderStatus } from './adminApi.js';

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('public menu API', () => {
  it('loads menu metadata and categories', async () => {
    vi.spyOn(api, 'get')
      .mockResolvedValueOnce({ data: { data: { categories: [{ slug: 'meals' }] } } })
      .mockResolvedValueOnce({ data: { data: { categories: [{ slug: 'drinks' }] } } });

    await expect(getMenuMeta()).resolves.toEqual({ categories: [{ slug: 'meals' }] });
    await expect(getMenuCategories()).resolves.toEqual([{ slug: 'drinks' }]);
    expect(api.get).toHaveBeenNthCalledWith(1, '/menu/meta');
    expect(api.get).toHaveBeenNthCalledWith(2, '/menu/categories');
  });

  it('loads filtered menu items and a single item', async () => {
    vi.spyOn(api, 'get')
      .mockResolvedValueOnce({
        data: { data: { items: [{ slug: 'coffee' }] }, meta: { total: 1 } },
      })
      .mockResolvedValueOnce({ data: { data: { item: { slug: 'coffee' } } } });

    await expect(getMenuItems({ category: 'drinks', page: 1 })).resolves.toEqual({
      items: [{ slug: 'coffee' }],
      meta: { total: 1 },
    });
    await expect(getMenuItem('coffee')).resolves.toEqual({ slug: 'coffee' });
    expect(api.get).toHaveBeenNthCalledWith(1, '/menu/items', {
      params: { category: 'drinks', page: 1 },
    });
    expect(api.get).toHaveBeenNthCalledWith(2, '/menu/items/coffee');
  });
});

describe('form submissions', () => {
  it('posts reservation requests to the real endpoint', async () => {
    const payload = { name: 'Ada', email: 'ada@example.com' };
    vi.spyOn(api, 'post').mockResolvedValue({
      data: { data: { reservation: { reference: 'FF-100' } } },
    });

    await expect(requestReservation(payload)).resolves.toEqual({
      reservation: { reference: 'FF-100' },
    });
    expect(api.post).toHaveBeenCalledWith('/reservations', payload);
  });

  it('posts contact messages to the real endpoint', async () => {
    const payload = { name: 'Ada', email: 'ada@example.com', message: 'Hello' };
    vi.spyOn(api, 'post').mockResolvedValue({ data: { data: { message: { id: 'msg-1' } } } });

    await expect(sendContactMessage(payload)).resolves.toEqual({ message: { id: 'msg-1' } });
    expect(api.post).toHaveBeenCalledWith('/contact', payload);
  });
});

describe('checkout API', () => {
  it('requests a server-generated quote', async () => {
    const payload = { items: [{ slug: 'coffee', quantity: 1 }], fulfillmentType: 'pickup' };
    vi.spyOn(api, 'post').mockResolvedValue({ data: { data: { quote: { total: 2500 } } } });

    await expect(quoteOrder(payload)).resolves.toEqual({ total: 2500 });
    expect(api.post).toHaveBeenCalledWith('/orders/quote', payload);
  });

  it('creates an order with a stable idempotency key', async () => {
    const payload = { items: [], paymentMethod: 'pay_at_restaurant' };
    vi.spyOn(api, 'post').mockResolvedValue({
      data: { data: { order: { orderNumber: 'FF-200' } } },
    });

    await expect(createOrder(payload, 'checkout-key-1')).resolves.toEqual({
      order: { orderNumber: 'FF-200' },
    });
    expect(api.post).toHaveBeenCalledWith('/orders', payload, {
      headers: { 'Idempotency-Key': 'checkout-key-1' },
    });
  });
});

describe('admin API', () => {
  it('loads and updates staff order data', async () => {
    vi.spyOn(api, 'get').mockResolvedValue({
      data: { data: [{ _id: 'order-1' }], meta: { total: 1 } },
    });
    vi.spyOn(api, 'patch').mockResolvedValue({
      data: { data: { order: { _id: 'order-1', status: 'preparing' } } },
    });

    await expect(getAdminOrders({ status: 'new' })).resolves.toEqual({
      orders: [{ _id: 'order-1' }],
      meta: { total: 1 },
    });
    expect(api.get).toHaveBeenCalledWith('/admin/orders', { params: { status: 'new' } });

    await expect(updateAdminOrderStatus('order-1', { status: 'preparing' })).resolves.toEqual({
      _id: 'order-1',
      status: 'preparing',
    });
    expect(api.patch).toHaveBeenCalledWith('/admin/orders/order-1/status', {
      status: 'preparing',
    });
  });
});
