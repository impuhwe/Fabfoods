import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import api from '../lib/api.js';
import {
  createAdminMenuCategory,
  createAdminMenuItem,
  createAdminStaff,
  getAdminAuditLogs,
  getAdminCustomer,
  getAdminCustomers,
  getAdminDashboard,
  getAdminReservation,
  getAdminStaff,
  rescheduleAdminReservation,
  setAdminCustomerStatus,
  setAdminMenuItemAvailability,
  updateAdminMenuCategory,
  updateAdminStaff,
} from './adminApi.js';

beforeEach(() => {
  vi.restoreAllMocks();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('admin management API', () => {
  it('loads dashboard, customer, staff and audit resources', async () => {
    vi.spyOn(api, 'get')
      .mockResolvedValueOnce({ data: { data: { summary: { totalOrders: 2 } } } })
      .mockResolvedValueOnce({ data: { data: [{ id: 'c1' }], meta: { total: 1 } } })
      .mockResolvedValueOnce({ data: { data: { customer: { id: 'c1' }, activity: {} } } })
      .mockResolvedValueOnce({ data: { data: [{ id: 's1' }], meta: { total: 1 } } })
      .mockResolvedValueOnce({ data: { data: { logs: [{ id: 'a1' }] }, meta: { total: 1 } } });

    await expect(getAdminDashboard()).resolves.toEqual({ summary: { totalOrders: 2 } });
    await expect(getAdminCustomers({ search: 'ada' })).resolves.toEqual({
      customers: [{ id: 'c1' }],
      meta: { total: 1 },
    });
    await expect(getAdminCustomer('c1')).resolves.toEqual({
      customer: { id: 'c1' },
      activity: {},
    });
    await expect(getAdminStaff()).resolves.toEqual({
      staff: [{ id: 's1' }],
      meta: { total: 1 },
    });
    await expect(getAdminAuditLogs({ action: 'staff.create' })).resolves.toEqual({
      logs: [{ id: 'a1' }],
      meta: { total: 1 },
    });

    expect(api.get).toHaveBeenNthCalledWith(1, '/admin/dashboard');
    expect(api.get).toHaveBeenNthCalledWith(2, '/admin/customers', {
      params: { search: 'ada' },
    });
    expect(api.get).toHaveBeenNthCalledWith(3, '/admin/customers/c1');
    expect(api.get).toHaveBeenNthCalledWith(4, '/admin/staff', { params: {} });
    expect(api.get).toHaveBeenNthCalledWith(5, '/admin/audit-logs', {
      params: { action: 'staff.create' },
    });
  });

  it('maps management mutations to the capability-protected endpoints', async () => {
    vi.spyOn(api, 'post')
      .mockResolvedValueOnce({ data: { data: { user: { id: 's2' }, temporaryPassword: 'temp' } } })
      .mockResolvedValueOnce({ data: { data: { category: { id: 'cat1' } } } })
      .mockResolvedValueOnce({ data: { data: { item: { id: 'item1' } } } });
    vi.spyOn(api, 'patch')
      .mockResolvedValueOnce({ data: { data: { customer: { id: 'c1', status: 'suspended' } } } })
      .mockResolvedValueOnce({ data: { data: { user: { id: 's1', role: 'manager' } } } })
      .mockResolvedValueOnce({ data: { data: { category: { id: 'cat1', name: 'New' } } } })
      .mockResolvedValueOnce({ data: { data: { item: { id: 'item1', isAvailable: true } } } })
      .mockResolvedValueOnce({ data: { data: { reservation: { id: 'r1' } } } });

    await expect(createAdminStaff({ name: 'New Staff' })).resolves.toEqual({
      user: { id: 's2' },
      temporaryPassword: 'temp',
    });
    await expect(createAdminMenuCategory({ name: 'Category' })).resolves.toEqual({ id: 'cat1' });
    await expect(createAdminMenuItem({ name: 'Item' })).resolves.toEqual({ id: 'item1' });
    await expect(setAdminCustomerStatus('c1', 'suspended')).resolves.toEqual({
      id: 'c1',
      status: 'suspended',
    });
    await expect(updateAdminStaff('s1', { role: 'manager' })).resolves.toEqual({
      id: 's1',
      role: 'manager',
    });
    await expect(updateAdminMenuCategory('cat1', { name: 'New' })).resolves.toEqual({
      id: 'cat1',
      name: 'New',
    });
    await expect(setAdminMenuItemAvailability('item1', true)).resolves.toEqual({
      id: 'item1',
      isAvailable: true,
    });
    await expect(
      rescheduleAdminReservation('r1', { date: '2026-12-01', time: '19:30', partySize: 2 }),
    ).resolves.toEqual({ id: 'r1' });

    expect(api.post).toHaveBeenNthCalledWith(1, '/admin/staff', { name: 'New Staff' });
    expect(api.post).toHaveBeenNthCalledWith(2, '/admin/menu/categories', { name: 'Category' });
    expect(api.post).toHaveBeenNthCalledWith(3, '/admin/menu/items', { name: 'Item' });
    expect(api.patch).toHaveBeenNthCalledWith(1, '/admin/customers/c1/status', {
      status: 'suspended',
    });
    expect(api.patch).toHaveBeenNthCalledWith(2, '/admin/staff/s1', { role: 'manager' });
    expect(api.patch).toHaveBeenNthCalledWith(3, '/admin/menu/categories/cat1', { name: 'New' });
    expect(api.patch).toHaveBeenNthCalledWith(4, '/admin/menu/items/item1/availability', {
      isAvailable: true,
    });
    expect(api.patch).toHaveBeenNthCalledWith(5, '/admin/reservations/r1/reschedule', {
      date: '2026-12-01',
      time: '19:30',
      partySize: 2,
    });
  });

  it('loads reservation details through the admin detail endpoint', async () => {
    vi.spyOn(api, 'get').mockResolvedValueOnce({
      data: { data: { reservation: { id: 'r1', reference: 'RS-1' } } },
    });

    await expect(getAdminReservation('r1')).resolves.toEqual({ id: 'r1', reference: 'RS-1' });
    expect(api.get).toHaveBeenCalledWith('/admin/reservations/r1');
  });
});
