import api from '../lib/api.js';

export async function getAdminOrders(params = {}) {
  const { data } = await api.get('/admin/orders', { params });
  return { orders: data.data, meta: data.meta };
}

export async function getAdminOrder(id) {
  const { data } = await api.get(`/admin/orders/${id}`);
  return data.data;
}

export async function updateAdminOrderStatus(id, payload) {
  const { data } = await api.patch(`/admin/orders/${id}/status`, payload);
  return data.data.order;
}

export async function updateAdminOrderPayment(id, payload) {
  const { data } = await api.patch(`/admin/orders/${id}/payment`, payload);
  return data.data.order;
}

export async function getAdminReservations(params = {}) {
  const { data } = await api.get('/admin/reservations', { params });
  return { reservations: data.data, meta: data.meta };
}

export async function updateAdminReservationStatus(id, payload) {
  const { data } = await api.patch(`/admin/reservations/${id}/status`, payload);
  return data.data.reservation;
}

export async function getAdminSettings() {
  const { data } = await api.get('/admin/settings');
  return data.data;
}

export async function updateAdminSettings(payload) {
  const { data } = await api.patch('/admin/settings', payload);
  return data.data;
}

export async function getAdminEmails(params = {}) {
  const { data } = await api.get('/admin/emails', { params });
  return { emails: data.data.emails, meta: data.meta };
}

export async function processAdminEmails() {
  const { data } = await api.post('/admin/emails/process');
  return data.data;
}

export async function retryAdminEmail(id) {
  const { data } = await api.post(`/admin/emails/${id}/retry`);
  return data.data.email;
}
