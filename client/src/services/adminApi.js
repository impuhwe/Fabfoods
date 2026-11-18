import api from '../lib/api.js';

export async function getAdminDashboard() {
  const { data } = await api.get('/admin/dashboard');
  return data.data;
}

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

export async function getAdminReservation(id) {
  const { data } = await api.get(`/admin/reservations/${id}`);
  return data.data.reservation;
}

export async function updateAdminReservationStatus(id, payload) {
  const { data } = await api.patch(`/admin/reservations/${id}/status`, payload);
  return data.data.reservation;
}

export async function rescheduleAdminReservation(id, payload) {
  const { data } = await api.patch(`/admin/reservations/${id}/reschedule`, payload);
  return data.data.reservation;
}

export async function updateAdminReservationSelectionStatus(id, payload) {
  const { data } = await api.patch(`/admin/reservations/${id}/selection-status`, payload);
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

export async function getAdminCateringRequests(params = {}) {
  const { data } = await api.get('/admin/catering', { params });
  return { requests: data.data, meta: data.meta };
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

export async function getAdminMenuImageStatus() {
  const { data } = await api.get('/admin/menu/images/status');
  return data.data;
}

export async function getAdminMenuUploadSignature() {
  const { data } = await api.post('/admin/menu/images/upload-signature');
  return data.data;
}

export async function deleteAdminMenuImage(publicId) {
  const { data } = await api.post('/admin/menu/images/delete', { publicId });
  return data.data;
}

export async function getAdminCustomers(params = {}) {
  const { data } = await api.get('/admin/customers', { params });
  return { customers: data.data, meta: data.meta };
}

export async function getAdminCustomer(id) {
  const { data } = await api.get(`/admin/customers/${id}`);
  return data.data;
}

export async function setAdminCustomerStatus(id, status) {
  const { data } = await api.patch(`/admin/customers/${id}/status`, { status });
  return data.data.customer;
}

export async function getAdminStaff(params = {}) {
  const { data } = await api.get('/admin/staff', { params });
  return { staff: data.data, meta: data.meta };
}

export async function createAdminStaff(payload) {
  const { data } = await api.post('/admin/staff', payload);
  return data.data;
}

export async function updateAdminStaff(id, payload) {
  const { data } = await api.patch(`/admin/staff/${id}`, payload);
  return data.data.user;
}

export async function getAdminInvitations(params = {}) {
  const { data } = await api.get('/admin/invitations', { params });
  return { invitations: data.data, meta: data.meta };
}

export async function createAdminInvitation(payload) {
  const { data } = await api.post('/admin/invitations', payload);
  return data.data;
}

export async function revokeAdminInvitation(id, payload = {}) {
  const { data } = await api.post(`/admin/invitations/${id}/revoke`, payload);
  return data.data.invitation;
}

export async function getAdminAuditLogs(params = {}) {
  const { data } = await api.get('/admin/audit-logs', { params });
  return { logs: data.data.logs, meta: data.meta };
}

export async function createAdminMenuItem(payload) {
  const { data } = await api.post('/admin/menu/items', payload);
  return data.data.item;
}

export async function createAdminMenuCategory(payload) {
  const { data } = await api.post('/admin/menu/categories', payload);
  return data.data.category;
}

export async function updateAdminMenuCategory(id, payload) {
  const { data } = await api.patch(`/admin/menu/categories/${id}`, payload);
  return data.data.category;
}

export async function setAdminMenuItemAvailability(id, isAvailable) {
  const { data } = await api.patch(`/admin/menu/items/${id}/availability`, { isAvailable });
  return data.data.item;
}

export async function uploadAdminMenuImage(file, signature) {
  const form = new FormData();
  form.append('file', file);
  form.append('api_key', signature.apiKey);
  form.append('timestamp', String(signature.timestamp));
  form.append('signature', signature.signature);
  form.append('folder', signature.folder);

  const response = await fetch(signature.uploadUrl, { method: 'POST', body: form });
  const result = await response.json().catch(() => null);

  if (!response.ok || result?.error) {
    const message = result?.error?.message ?? `Cloudinary upload failed (HTTP ${response.status})`;
    throw new Error(message);
  }

  if (!result?.secure_url || !result?.public_id) {
    throw new Error('Cloudinary did not return an image URL');
  }

  return {
    url: result.secure_url,
    publicId: result.public_id,
    alt: result.original_filename
      ? String(result.original_filename)
          .replace(/\.[a-z0-9]+$/i, '')
          .replace(/[-_]/g, ' ')
      : '',
  };
}
