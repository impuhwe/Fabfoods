import mongoose from 'mongoose';

const cateringRequestSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
      index: true,
    },
    phone: { type: String, trim: true, maxlength: 30, default: '' },
    eventType: {
      type: String,
      required: true,
      enum: ['corporate', 'private', 'wedding', 'community', 'other'],
    },
    eventDate: { type: String, trim: true, default: '' },
    guestCount: { type: Number, required: true, min: 1, max: 1000 },
    location: { type: String, trim: true, maxlength: 160, default: '' },
    message: { type: String, required: true, trim: true, minlength: 10, maxlength: 2000 },
    status: {
      type: String,
      enum: ['new', 'read', 'resolved'],
      default: 'new',
      required: true,
      index: true,
    },
    source: { type: String, enum: ['website'], default: 'website', required: true },
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

const CateringRequest =
  mongoose.models.CateringRequest ?? mongoose.model('CateringRequest', cateringRequestSchema);

export default CateringRequest;
