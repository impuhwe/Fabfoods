function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function money(amount, currency = 'RWF') {
  return `${Number(amount ?? 0).toLocaleString('en-RW')} ${currency}`;
}

function layout(title, body) {
  return `<!doctype html>
<html><body style="margin:0;background:#f6f1e7;font-family:Arial,sans-serif;color:#2b2118">
  <div style="max-width:600px;margin:0 auto;padding:28px 20px">
    <div style="background:#2b2118;color:#fff;padding:20px 24px;border-radius:12px 12px 0 0">
      <h1 style="margin:0;font-size:22px">Fabs Restaurant</h1>
    </div>
    <div style="background:#fff;padding:24px;border-radius:0 0 12px 12px">
      <h2 style="margin-top:0;font-size:20px">${escapeHtml(title)}</h2>
      ${body}
      <p style="margin-top:28px;color:#6b5a48;font-size:12px">This message was sent by Fabs Restaurant. If you did not expect it, you can ignore it.</p>
    </div>
  </div>
</body></html>`;
}

function orderLines(order) {
  return order.items
    .map(
      (item) =>
        `<tr><td style="padding:6px 0">${escapeHtml(item.name)}${item.selectionSummary?.length ? ` <span style="color:#6b5a48">(${escapeHtml(item.selectionSummary.join(', '))})</span>` : ''} × ${item.quantity}</td><td style="text-align:right">${money(item.lineTotal, order.currency)}</td></tr>`,
    )
    .join('');
}

function orderSummary(order) {
  return `<table style="width:100%;border-collapse:collapse;margin:16px 0">
    ${orderLines(order)}
    <tr><td style="padding-top:12px;border-top:1px solid #e7ddcf">Subtotal</td><td style="padding-top:12px;text-align:right;border-top:1px solid #e7ddcf">${money(order.subtotal, order.currency)}</td></tr>
    ${order.deliveryFee ? `<tr><td>Delivery</td><td style="text-align:right">${money(order.deliveryFee, order.currency)}</td></tr>` : ''}
    <tr><td style="font-weight:bold">Total</td><td style="text-align:right;font-weight:bold">${money(order.total, order.currency)}</td></tr>
  </table>`;
}

const builders = {
  account_registered: (payload) => ({
    subject: 'Your Fabs Restaurant account',
    html: layout(
      'Welcome to Fabs Restaurant',
      `<p>Hello ${escapeHtml(payload.name)},</p><p>Your account has been created. You can now track orders and table requests from your account.</p>`,
    ),
    text: `Hello ${payload.name}, your Fabs Restaurant account has been created.`,
  }),

  order_confirmation: (payload) => {
    const { order } = payload;
    return {
      subject: `Order ${order.orderNumber} received`,
      html: layout(
        `Order ${escapeHtml(order.orderNumber)} received`,
        `<p>Hello ${escapeHtml(order.customer.name)},</p>
         <p>We received your ${escapeHtml(order.fulfillmentType)} order. The restaurant will review it before preparation.</p>
         ${orderSummary(order)}
         <p><strong>Payment:</strong> ${escapeHtml(order.paymentMethod.replaceAll('_', ' '))} (${escapeHtml(order.paymentStatus)})</p>`,
      ),
      text: `Order ${order.orderNumber} received. Total: ${money(order.total, order.currency)}.`,
    };
  },

  payment_confirmation: (payload) => ({
    subject: `Payment confirmed for order ${payload.order.orderNumber}`,
    html: layout(
      'Payment confirmed',
      `<p>Hello ${escapeHtml(payload.order.customer.name)},</p>
       <p>Your payment of ${money(payload.order.total, payload.order.currency)} for order <strong>${escapeHtml(payload.order.orderNumber)}</strong> has been confirmed.</p>`,
    ),
    text: `Payment confirmed for order ${payload.order.orderNumber}.`,
  }),

  order_status_update: (payload) => ({
    subject: `Order ${payload.order.orderNumber}: ${payload.statusLabel}`,
    html: layout(
      `Order ${escapeHtml(payload.order.orderNumber)}`,
      `<p>Hello ${escapeHtml(payload.order.customer.name)},</p>
       <p>Your order status is now <strong>${escapeHtml(payload.statusLabel)}</strong>.</p>
       ${payload.note ? `<p>${escapeHtml(payload.note)}</p>` : ''}`,
    ),
    text: `Order ${payload.order.orderNumber} is now ${payload.statusLabel}.`,
  }),

  reservation_received: (payload) => ({
    subject: `Table request ${payload.reservation.reference} received`,
    html: layout(
      'Table request received',
      `<p>Hello ${escapeHtml(payload.reservation.name)},</p>
       <p>We received your table request for ${escapeHtml(payload.reservation.date)} at ${escapeHtml(payload.reservation.time)} for ${payload.reservation.partySize} guests.</p>
       <p>This is not a confirmed reservation. The restaurant will respond separately.</p>`,
    ),
    text: `Table request ${payload.reservation.reference} received. It is not confirmed yet.`,
  }),

  reservation_decision: (payload) => ({
    subject: `Table request ${payload.reservation.reference}: ${payload.statusLabel}`,
    html: layout(
      `Table request ${escapeHtml(payload.reservation.reference)}`,
      `<p>Hello ${escapeHtml(payload.reservation.name)},</p>
       <p>Your table request is now <strong>${escapeHtml(payload.statusLabel)}</strong>.</p>
       ${payload.note ? `<p>${escapeHtml(payload.note)}</p>` : ''}
       <p>${escapeHtml(payload.message ?? '')}</p>`,
    ),
    text: `Table request ${payload.reservation.reference} is now ${payload.statusLabel}. ${payload.note ?? ''}`,
  }),

  reservation_cancelled: (payload) => ({
    subject: `Table request ${payload.reservation.reference} cancelled`,
    html: layout(
      'Table request cancelled',
      `<p>Hello ${escapeHtml(payload.reservation.name)},</p>
       <p>Your table request for ${escapeHtml(payload.reservation.date)} at ${escapeHtml(payload.reservation.time)} has been cancelled.</p>
       ${payload.note ? `<p>${escapeHtml(payload.note)}</p>` : ''}`,
    ),
    text: `Table request ${payload.reservation.reference} cancelled.`,
  }),
};

export function renderEmailTemplate(template, payload) {
  const builder = builders[template];
  if (!builder) throw new Error(`Unknown email template: ${template}`);
  return builder(payload);
}

export default renderEmailTemplate;
