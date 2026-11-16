import mongoose from 'mongoose';
import { RESERVATION_STATUSES, RESERVATION_STATUS_VALUES } from '../config/constants.js';

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
