import api from '../lib/api.js';

export async function getMenuMeta() {
  const { data } = await api.get('/menu/meta');
  return data.data;
}

export async function getMenuCategories() {
  const { data } = await api.get('/menu/categories');
  return data.data.categories;
}

export async function getMenuItems(params = {}) {
  const { data } = await api.get('/menu/items', { params });
  return { items: data.data.items, meta: data.meta };
}

export async function getMenuItem(slug) {
  const { data } = await api.get(`/menu/items/${slug}`);
  return data.data.item;
}

export async function requestReservation(payload) {
  const { data } = await api.post('/reservations', payload);
  return data.data;
}

export async function getMyReservations() {
  const { data } = await api.get('/reservations/mine');
  return data.data.reservations;
}

export async function sendContactMessage(payload) {
  const { data } = await api.post('/contact', payload);
  return data.data;
}

export async function quoteOrder(payload) {
  const { data } = await api.post('/orders/quote', payload);
  return data.data.quote;
}

export async function getPublicSettings() {
  const { data } = await api.get('/settings/public');
  return data.data.settings;
}

export async function createOrder(payload, idempotencyKey) {
  const { data } = await api.post('/orders', payload, {
    headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined,
  });
  return data.data;
}

export async function getOrder(orderNumber, email) {
  const { data } = await api.get(`/orders/${orderNumber}`, {
    params: email ? { email } : undefined,
  });
  return data.data.order;
}

export async function cancelOrder(orderNumber, payload = {}) {
  const { data } = await api.post(`/orders/${orderNumber}/cancel`, payload);
  return data.data.order;
}

export async function initiateOrderPayment(orderNumber, payload = {}) {
  const { data } = await api.post(`/orders/${orderNumber}/payments/initiate`, payload);
  return data.data;
}

export async function verifyOrderPayment(orderNumber, payload = {}) {
  const { data } = await api.post(`/orders/${orderNumber}/payments/verify`, payload);
  return data.data;
}

export async function cancelReservation(reference, payload = {}) {
  const { data } = await api.post(`/reservations/${reference}/cancel`, payload);
  return data.data.reservation;
}

export async function getMyOrders() {
  const { data } = await api.get('/me/orders');
  return { orders: data.data, meta: data.meta };
}

export async function updateProfile(payload) {
  const { data } = await api.patch('/me/profile', payload);
  return data.data.user;
}

export async function changePassword(payload) {
  const { data } = await api.post('/me/password', payload);
  return data.data;
}
