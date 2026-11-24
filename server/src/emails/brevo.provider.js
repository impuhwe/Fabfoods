import env from '../config/env.js';
import { serviceUnavailable } from '../utils/errors.js';

export function isEmailConfigured() {
  return Boolean(env.EMAIL_DELIVERY_ENABLED && env.BREVO_API_KEY && env.EMAIL_FROM_EMAIL);
}

export async function sendEmail({ to, subject, html, text }) {
  if (!isEmailConfigured()) {
    throw serviceUnavailable('Email delivery is not configured');
  }

  let response;
  try {
    response = await fetch(env.BREVO_API_URL, {
      method: 'POST',
      headers: {
        'api-key': env.BREVO_API_KEY,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        sender: { name: env.EMAIL_FROM_NAME, email: env.EMAIL_FROM_EMAIL },
        to: [{ email: to }],
        subject,
        htmlContent: html,
        textContent: text,
      }),
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw serviceUnavailable('The email provider could not be reached');
  }

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw serviceUnavailable(body?.message ?? 'The email provider rejected the message');
  }

  return { messageId: body?.messageId ?? null };
}

export default sendEmail;
