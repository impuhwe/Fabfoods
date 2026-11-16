import env from '../config/env.js';
import { EMAIL_STATUSES } from '../config/constants.js';
import EmailOutbox from '../models/EmailOutbox.js';
import { isEmailConfigured, sendEmail } from '../emails/brevo.provider.js';
import { renderEmailTemplate } from '../emails/templates.js';
import logger from '../utils/logger.js';

const RETRY_DELAYS_MS = [60_000, 5 * 60_000, 15 * 60_000, 60 * 60_000, 6 * 60 * 60_000];

export async function enqueueEmail({
  to,
  template,
  payload,
  subject,
  dedupeKey,
  user,
  order,
  reservation,
}) {
  const rendered = renderEmailTemplate(template, payload);

  try {
    const email = await EmailOutbox.create({
      to,
      template,
      subject: subject ?? rendered.subject,
      payload,
      dedupeKey: dedupeKey ?? null,
      user: user ?? null,
      order: order ?? null,
      reservation: reservation ?? null,
      status: EMAIL_STATUSES.QUEUED,
      nextAttemptAt: new Date(),
    });

    kickEmailOutbox();
    return email;
  } catch (error) {
    if (error?.code === 11000 && dedupeKey) {
      return EmailOutbox.findOne({ dedupeKey });
    }
    logger.warn('Unable to queue email', { message: error.message, template });
    return null;
  }
}

export async function processEmailOutbox({ limit = env.EMAIL_OUTBOX_BATCH_SIZE } = {}) {
  if (!isEmailConfigured()) {
    return { skipped: true, reason: 'Email delivery is not configured', processed: 0 };
  }

  const candidates = await EmailOutbox.find({
    status: EMAIL_STATUSES.QUEUED,
    nextAttemptAt: { $lte: new Date() },
  })
    .sort({ nextAttemptAt: 1 })
    .limit(limit)
    .select('_id');

  let sent = 0;
  let failed = 0;

  for (const candidate of candidates) {
    const email = await EmailOutbox.findOneAndUpdate(
      { _id: candidate._id, status: EMAIL_STATUSES.QUEUED },
      { $set: { status: EMAIL_STATUSES.SENDING }, $inc: { attempts: 1 } },
      { new: true },
    );
    if (!email) continue;

    try {
      const rendered = renderEmailTemplate(email.template, email.payload);
      const result = await sendEmail({
        to: email.to,
        subject: email.subject,
        html: rendered.html,
        text: rendered.text,
      });
      await EmailOutbox.updateOne(
        { _id: email._id },
        {
          $set: {
            status: EMAIL_STATUSES.SENT,
            sentAt: new Date(),
            providerMessageId: result.messageId,
            lastError: '',
          },
        },
      );
      sent += 1;
    } catch (error) {
      const attempts = email.attempts;
      const exhausted = attempts >= email.maxAttempts;
      const delay = RETRY_DELAYS_MS[Math.min(attempts - 1, RETRY_DELAYS_MS.length - 1)];
      await EmailOutbox.updateOne(
        { _id: email._id },
        {
          $set: {
            status: exhausted ? EMAIL_STATUSES.FAILED : EMAIL_STATUSES.QUEUED,
            lastError: error.message.slice(0, 500),
            nextAttemptAt: exhausted ? null : new Date(Date.now() + delay),
          },
        },
      );
      failed += 1;
      logger.warn('Email delivery attempt failed', {
        message: error.message,
        template: email.template,
        attempts,
      });
    }
  }

  return { skipped: false, processed: candidates.length, sent, failed };
}

export function kickEmailOutbox() {
  if (!isEmailConfigured()) return;
  setImmediate(() => {
    processEmailOutbox().catch((error) => {
      logger.error('Email outbox processing failed', { message: error.message });
    });
  });
}

export async function retryEmail(id) {
  const email = await EmailOutbox.findById(id);
  if (!email) return null;
  email.status = EMAIL_STATUSES.QUEUED;
  email.nextAttemptAt = new Date();
  email.lastError = '';
  await email.save();
  kickEmailOutbox();
  return email;
}
