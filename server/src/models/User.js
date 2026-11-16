import mongoose from 'mongoose';
import { ROLE_VALUES, ROLES, USER_STATUS, USER_STATUS_VALUES } from '../config/constants.js';

const userSchema = new mongoose.Schema(
  {
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
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 30,
      default: null,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: ROLE_VALUES,
      default: ROLES.CUSTOMER,
      required: true,
    },
    status: {
      type: String,
      enum: USER_STATUS_VALUES,
      default: USER_STATUS.ACTIVE,
      required: true,
    },
    mustChangePassword: {
      type: Boolean,
      default: false,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
    passwordChangedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.passwordHash;
        delete ret.__v;
        return ret;
      },
    },
  },
);

userSchema.index({ role: 1, status: 1 });

const User = mongoose.models.User ?? mongoose.model('User', userSchema);

export default User;
