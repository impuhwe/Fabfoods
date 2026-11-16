import mongoose from 'mongoose';
import {
  FULFILLMENT_TYPE_VALUES,
  ORDER_STATUS_VALUES,
  ORDER_STATUSES,
  PAYMENT_METHOD_VALUES,
  PAYMENT_STATUS_VALUES,
  PAYMENT_STATUSES,
} from '../config/constants.js';

const statusEventSchema = new mongoose.Schema(
  {
    status: { type: String, enum: ORDER_STATUS_VALUES, required: true },
    note: { type: String, trim: true, maxlength: 300, default: '' },
    changedAt: { type: Date, default: Date.now },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { _id: false },
);

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, required: true, minlength: 2, maxlength: 80 },
    email: { type: String, trim: true, lowercase: true, required: true, maxlength: 254 },
    phone: { type: String, trim: true, required: true, maxlength: 30 },
  },
  { _id: false },
);

const addressSchema = new mongoose.Schema(
  {
    line1: { type: String, trim: true, maxlength: 160, default: '' },
    line2: { type: String, trim: true, maxlength: 160, default: '' },
    city: { type: String, trim: true, maxlength: 80, default: '' },
    district: { type: String, trim: true, maxlength: 80, default: '' },
    sector: { type: String, trim: true, maxlength: 80, default: '' },
    notes: { type: String, trim: true, maxlength: 240, default: '' },
  },
  { _id: false },
);

const orderLineSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1, max: 20 },
    unitPrice: { type: Number, required: true, min: 0 },
    lineTotal: { type: Number, required: true, min: 0 },
    basePrice: { type: Number, required: true, min: 0 },
    servingPriceDelta: { type: Number, default: 0 },
    addonPrice: { type: Number, default: 0 },
    selectionSummary: { type: [String], default: [] },
    selections: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true, trim: true, maxlength: 32 },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    customer: { type: customerSchema, required: true },
    fulfillmentType: { type: String, enum: FULFILLMENT_TYPE_VALUES, required: true },
    deliveryAddress: { type: addressSchema, default: () => ({}) },
    notes: { type: String, trim: true, maxlength: 600, default: '' },
    items: { type: [orderLineSchema], required: true },
    subtotal: { type: Number, required: true, min: 0 },
    deliveryFee: { type: Number, required: true, min: 0, default: 0 },
    total: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, default: 'RWF', maxlength: 3 },
    paymentMethod: { type: String, enum: PAYMENT_METHOD_VALUES, required: true },
    paymentStatus: {
      type: String,
      enum: PAYMENT_STATUS_VALUES,
      default: PAYMENT_STATUSES.PENDING,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ORDER_STATUS_VALUES,
      default: ORDER_STATUSES.PENDING_PAYMENT,
      required: true,
      index: true,
    },
    statusHistory: { type: [statusEventSchema], default: [] },
    idempotencyKey: { type: String, trim: true, maxlength: 120, default: null },
    source: { type: String, enum: ['website', 'admin'], default: 'website', required: true },
    confirmedAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
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

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index(
  { idempotencyKey: 1 },
  { unique: true, partialFilterExpression: { idempotencyKey: { $type: 'string' } } },
);

const Order = mongoose.models.Order ?? mongoose.model('Order', orderSchema);

export default Order;
