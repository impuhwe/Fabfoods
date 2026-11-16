import mongoose from 'mongoose';
import { MENU_CATEGORY_KINDS, MENU_CATEGORY_KIND_VALUES } from '../config/constants.js';
import mediaSchema from './shared/media.schema.js';

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const menuCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      minlength: 2,
      maxlength: 60,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      maxlength: 120,
      match: [slugPattern, 'Slug must be lowercase kebab-case'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: 240,
      default: '',
    },
    kind: {
      type: String,
      enum: MENU_CATEGORY_KIND_VALUES,
      default: MENU_CATEGORY_KINDS.FOOD,
      required: true,
    },
    image: {
      type: mediaSchema,
      default: () => ({}),
    },
    displayOrder: {
      type: Number,
      min: 0,
      default: 0,
    },
    isVisible: {
      type: Boolean,
      default: true,
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

menuCategorySchema.index({ kind: 1, displayOrder: 1 });

const MenuCategory =
  mongoose.models.MenuCategory ?? mongoose.model('MenuCategory', menuCategorySchema);

export default MenuCategory;
