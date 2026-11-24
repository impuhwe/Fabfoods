import mongoose from 'mongoose';
import {
  RESERVATION_SELECTION_STATUSES,
  RESERVATION_SELECTION_STATUS_VALUES,
  RESERVATION_STATUSES,
  RESERVATION_STATUS_VALUES,
} from '../config/constants.js';

const statusEventSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: RESERVATION_STATUS_VALUES,
      required: true,
    },
    note: {
      type: String,
      trim: true,
      maxlength: 300,
      default: '',
    },
    changedAt: {
      type: Date,
      default: Date.now,
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { _id: false },
);

const selectionOptionSchema = new mongoose.Schema(
  {
    groupName: { type: String, required: true, trim: true, maxlength: 80 },
    optionName: { type: String, required: true, trim: true, maxlength: 90 },
    priceDelta: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const addonOptionSchema = new mongoose.Schema(
  {
    groupName: { type: String, required: true, trim: true, maxlength: 80 },
    optionName: { type: String, required: true, trim: true, maxlength: 90 },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const reservationSelectionLineSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, trim: true, maxlength: 120 },
    name: { type: String, required: true, trim: true, maxlength: 160 },
    quantity: { type: Number, required: true, min: 1, max: 20 },
    unitPrice: { type: Number, required: true, min: 0 },
    lineTotal: { type: Number, required: true, min: 0 },
    basePrice: { type: Number, required: true, min: 0 },
    servingPriceDelta: { type: Number, required: true, min: 0, default: 0 },
    addonPrice: { type: Number, required: true, min: 0, default: 0 },
    selectionSummary: { type: [String], default: [] },
    selections: {
      sizeLabel: { type: String, default: null },
      serving: { type: [selectionOptionSchema], default: [] },
      addons: { type: [addonOptionSchema], default: [] },
    },
  },
  { _id: false },
);

const selectionEstimateSchema = new mongoose.Schema(
  {
    currency: { type: String, required: true, trim: true, maxlength: 12 },
    itemCount: { type: Number, required: true, min: 0 },
    subtotal: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    calculatedAt: { type: Date, required: true, default: Date.now },
  },
  { _id: false },
);

const selectionStatusEventSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: RESERVATION_SELECTION_STATUS_VALUES,
      required: true,
    },
    note: { type: String, trim: true, maxlength: 300, default: '' },
    changedAt: { type: Date, default: Date.now },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { _id: false },
);

const reservationSchema = new mongoose.Schema(
  {
    reference: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      maxlength: 24,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      maxlength: 30,
    },
    date: {
      type: String,
      required: true,
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Reservation date must use YYYY-MM-DD'],
    },
    time: {
      type: String,
      required: true,
      match: [/^([01]\d|2[0-3]):[0-5]\d$/, 'Reservation time must use HH:mm'],
    },
    startAt: {
      type: Date,
      required: true,
      index: true,
    },
    partySize: {
      type: Number,
      required: true,
      min: 1,
      max: 20,
      validate: {
        validator: Number.isInteger,
        message: 'Party size must be a whole number',
      },
    },
    occasion: {
      type: String,
      trim: true,
      maxlength: 80,
      default: '',
    },
    specialRequests: {
      type: String,
      trim: true,
      maxlength: 600,
      default: '',
    },
    preparationNotes: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
    menuSelections: {
      type: [reservationSelectionLineSchema],
      default: [],
    },
    selectionEstimate: {
      type: selectionEstimateSchema,
      default: null,
    },
    selectionStatus: {
      type: String,
      enum: RESERVATION_SELECTION_STATUS_VALUES,
      default: RESERVATION_SELECTION_STATUSES.NOT_REQUESTED,
      required: true,
      index: true,
    },
    selectionStatusHistory: {
      type: [selectionStatusEventSchema],
      default: [],
    },
    selectionReviewNote: {
      type: String,
      trim: true,
      maxlength: 300,
      default: '',
    },
    selectionReviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    selectionReviewedAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: RESERVATION_STATUS_VALUES,
      default: RESERVATION_STATUSES.PENDING,
      required: true,
      index: true,
    },
    statusHistory: {
      type: [statusEventSchema],
      default: [],
    },
    source: {
      type: String,
      enum: ['website', 'phone', 'walk_in', 'admin'],
      default: 'website',
      required: true,
    },
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

reservationSchema.index({ user: 1, startAt: -1 });
reservationSchema.index({ startAt: 1, status: 1 });

const Reservation = mongoose.models.Reservation ?? mongoose.model('Reservation', reservationSchema);

export default Reservation;
