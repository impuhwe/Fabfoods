import mongoose from 'mongoose';
import { PAYMENT_METHOD_VALUES } from '../config/constants.js';

const contactSchema = new mongoose.Schema(
  {
    phone: { type: String, trim: true, maxlength: 30, default: '' },
    email: { type: String, trim: true, lowercase: true, maxlength: 254, default: '' },
    address: { type: String, trim: true, maxlength: 240, default: '' },
    whatsapp: { type: String, trim: true, maxlength: 30, default: '' },
  },
  { _id: false },
);

const hoursSchema = new mongoose.Schema(
  {
    day: { type: Number, min: 0, max: 6, required: true },
    isClosed: { type: Boolean, default: true },
    open: { type: String, match: [/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:mm'], default: '00:00' },
    close: { type: String, match: [/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:mm'], default: '00:00' },
  },
  { _id: false },
);

const deliveryZoneSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, maxlength: 80, required: true },
    areas: { type: [String], default: [] },
    fee: { type: Number, min: 0, required: true },
    minOrder: { type: Number, min: 0, default: 0 },
    etaMinutes: { type: Number, min: 0, max: 240, default: null },
    isActive: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
  },
  { _id: false },
);

const verificationSchema = new mongoose.Schema(
  {
    contactApproved: { type: Boolean, default: false },
    hoursApproved: { type: Boolean, default: false },
    deliveryApproved: { type: Boolean, default: false },
    paymentsApproved: { type: Boolean, default: false },
  },
  { _id: false },
);

const settingsSchema = new mongoose.Schema(
  {
    singleton: { type: String, required: true, unique: true, default: 'default', immutable: true },
    contact: { type: contactSchema, default: () => ({}) },
    hours: { type: [hoursSchema], default: [] },
    fulfillment: {
      pickupEnabled: { type: Boolean, default: true },
      deliveryEnabled: { type: Boolean, default: false },
      orderingPaused: { type: Boolean, default: false },
      pickupEtaMinutes: { type: Number, min: 0, max: 240, default: null },
      minOrder: { type: Number, min: 0, default: 0 },
      deliveryZones: { type: [deliveryZoneSchema], default: [] },
    },
    reservations: {
      enabled: { type: Boolean, default: true },
      maxPartySize: { type: Number, min: 1, max: 100, default: 20 },
      maxDaysAhead: { type: Number, min: 1, max: 365, default: 90 },
      policyText: { type: String, trim: true, maxlength: 1000, default: '' },
      autoConfirm: { type: Boolean, default: false },
    },
    payments: {
      currency: { type: String, uppercase: true, trim: true, default: 'RWF', maxlength: 3 },
      acceptedMethods: {
        type: [{ type: String, enum: PAYMENT_METHOD_VALUES }],
        default: [...PAYMENT_METHOD_VALUES],
      },
      enabledMethods: {
        type: [{ type: String, enum: PAYMENT_METHOD_VALUES }],
        default: [],
      },
      onlineEnabled: { type: Boolean, default: false },
    },
    verification: { type: verificationSchema, default: () => ({}) },
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

const RestaurantSettings =
  mongoose.models.RestaurantSettings ??
  mongoose.model('RestaurantSettings', settingsSchema);

export default RestaurantSettings;
