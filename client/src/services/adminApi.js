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

export async function getAdminMenuItems(params = {}) {
  const { data } = await api.get('/admin/menu/items', { params });
  return { items: data.data, meta: data.meta };
}

export async function getAdminMenuCategories() {
  const { data } = await api.get('/admin/menu/categories');
  return data.data.categories;
}

export async function getAdminReviewIssues() {
  const { data } = await api.get('/admin/menu/review-issues');
  return data.data.issues;
}

export async function updateAdminMenuItem(id, payload) {
  const { data } = await api.patch(`/admin/menu/items/${id}`, payload);
  return data.data.item;
}

export async function verifyAdminMenuItem(id, payload = {}) {
  const { data } = await api.post(`/admin/menu/items/${id}/verify`, payload);
  return data.data.item;
}

export async function archiveAdminMenuItem(id) {
  const { data } = await api.post(`/admin/menu/items/${id}/archive`);
  return data.data.item;
}

export async function restoreAdminMenuItem(id) {
  const { data } = await api.post(`/admin/menu/items/${id}/restore`);
  return data.data.item;
}

export async function resolveAdminReviewIssue(id, payload) {
  const { data } = await api.post(`/admin/menu/review-issues/${id}/resolve`, payload);
  return data.data.issue;
}
