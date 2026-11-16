import mongoose from 'mongoose';
import {
  PAYMENT_METHOD_VALUES,
  PAYMENT_PROVIDER_VALUES,
  PAYMENT_STATUS_VALUES,
  PAYMENT_STATUSES,
} from '../config/constants.js';

const paymentTransactionSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    provider: {
      type: String,
      enum: PAYMENT_PROVIDER_VALUES,
      required: true,
    },
    method: { type: String, enum: PAYMENT_METHOD_VALUES, required: true },
    status: {
      type: String,
      enum: PAYMENT_STATUS_VALUES,
      default: PAYMENT_STATUSES.PENDING,
      required: true,
      index: true,
    },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, default: 'RWF', maxlength: 3 },
    providerReference: { type: String, required: true, unique: true, trim: true },
    providerTransactionId: { type: String, default: null, index: true },
    checkoutUrl: { type: String, default: null, maxlength: 2000 },
    verifiedAt: { type: Date, default: null },
    failureReason: { type: String, trim: true, maxlength: 300, default: '' },
    webhookEventIds: { type: [String], default: [] },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

paymentTransactionSchema.index({ order: 1, createdAt: -1 });

const PaymentTransaction =
  mongoose.models.PaymentTransaction ??
  mongoose.model('PaymentTransaction', paymentTransactionSchema);

export default PaymentTransaction;
