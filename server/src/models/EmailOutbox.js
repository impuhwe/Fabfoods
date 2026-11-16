import mongoose from 'mongoose';
import { EMAIL_STATUS_VALUES, EMAIL_STATUSES } from '../config/constants.js';

const emailOutboxSchema = new mongoose.Schema(
  {
    to: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
    template: { type: String, required: true, trim: true, maxlength: 80 },
    subject: { type: String, required: true, trim: true, maxlength: 200 },
    payload: { type: mongoose.Schema.Types.Mixed, default: {} },
    status: {
      type: String,
      enum: EMAIL_STATUS_VALUES,
      default: EMAIL_STATUSES.QUEUED,
      required: true,
      index: true,
    },
    attempts: { type: Number, default: 0, min: 0 },
    maxAttempts: { type: Number, default: 5, min: 1, max: 20 },
    nextAttemptAt: { type: Date, default: Date.now, index: true },
    sentAt: { type: Date, default: null },
    providerMessageId: { type: String, default: null },
    lastError: { type: String, trim: true, maxlength: 500, default: '' },
    dedupeKey: { type: String, trim: true, maxlength: 160, default: null },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
    reservation: { type: mongoose.Schema.Types.ObjectId, ref: 'Reservation', default: null },
  },
  { timestamps: true },
);

emailOutboxSchema.index({ status: 1, nextAttemptAt: 1 });
emailOutboxSchema.index(
  { dedupeKey: 1 },
  { unique: true, partialFilterExpression: { dedupeKey: { type: 'string' } } },
);

const EmailOutbox = mongoose.models.EmailOutbox ?? mongoose.model('EmailOutbox', emailOutboxSchema);

export default EmailOutbox;
