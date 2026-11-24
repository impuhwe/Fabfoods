import mongoose from 'mongoose';

export const mediaSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      trim: true,
      maxlength: 2048,
      default: '',
    },
    publicId: {
      type: String,
      trim: true,
      maxlength: 255,
      default: '',
    },
    alt: {
      type: String,
      trim: true,
      maxlength: 200,
      default: '',
    },
  },
  { _id: false },
);

export default mediaSchema;
