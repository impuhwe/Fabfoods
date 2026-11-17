import mongoose from 'mongoose';
import {
  MENU_REVIEW_ISSUE_STATUSES,
  MENU_REVIEW_ISSUE_STATUS_VALUES,
} from '../config/constants.js';

const reviewIssueHistorySchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      trim: true,
      maxlength: 60,
    },
    note: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    at: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
);

const menuReviewIssueSchema = new mongoose.Schema(
  {
    issueId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 120,
    },
    sourcePdf: {
      type: String,
      required: true,
      trim: true,
      maxlength: 40,
    },
    sourcePage: {
      type: Number,
      required: true,
      min: 1,
    },
    item: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    issue: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    handling: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    affectedSlugs: {
      type: [String],
      default: [],
    },
    affectedCategorySlugs: {
      type: [String],
      default: [],
    },
    blocking: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: MENU_REVIEW_ISSUE_STATUS_VALUES,
      default: MENU_REVIEW_ISSUE_STATUSES.OPEN,
      required: true,
      index: true,
    },
    resolution: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    history: {
      type: [reviewIssueHistorySchema],
      default: [],
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

menuReviewIssueSchema.index({ status: 1, blocking: 1 });

const MenuReviewIssue =
  mongoose.models.MenuReviewIssue ?? mongoose.model('MenuReviewIssue', menuReviewIssueSchema);

export default MenuReviewIssue;
