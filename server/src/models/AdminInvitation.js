import mongoose from 'mongoose';
import {
  ADMIN_INVITATION_STATUS,
  ADMIN_INVITATION_STATUS_VALUES,
  ROLES,
} from '../config/constants.js';

const adminInvitationSchema = new mongoose.Schema(
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
    role: { type: String, enum: [ROLES.ADMIN], default: ROLES.ADMIN, required: true },
    tokenHash: { type: String, required: true, unique: true, sparse: true, select: false },
    expiresAt: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: ADMIN_INVITATION_STATUS_VALUES,
      default: ADMIN_INVITATION_STATUS.PENDING,
      required: true,
      index: true,
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdByEmail: { type: String, required: true, trim: true, maxlength: 254 },
    placeholderUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    acceptedAt: { type: Date, default: null },
    revokedAt: { type: Date, default: null },
    revokedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    revocationReason: { type: String, trim: true, maxlength: 300, default: '' },
    emailSentAt: { type: Date, default: null },
    emailError: { type: String, trim: true, maxlength: 500, default: '' },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.tokenHash;
        delete ret.__v;
        return ret;
      },
    },
  },
);

const AdminInvitation =
  mongoose.models.AdminInvitation ?? mongoose.model('AdminInvitation', adminInvitationSchema);

export default AdminInvitation;
