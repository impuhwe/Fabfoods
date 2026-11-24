import mongoose from 'mongoose';
import {
  ADDON_SELECTION_TYPES,
  ADDON_SELECTION_TYPE_VALUES,
  MENU_DATA_SOURCES,
  MENU_DATA_SOURCE_VALUES,
  MENU_REVIEW_STATUSES,
  MENU_REVIEW_STATUS_VALUES,
} from '../config/constants.js';
import mediaSchema from './shared/media.schema.js';

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const normalized = (value) => value.trim().toLowerCase();

const hasDuplicateNames = (values) => {
  const names = values.map(normalized);
  return new Set(names).size !== names.length;
};

const addonOptionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 90,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: 'Add-on price must be an integer amount in RWF',
      },
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    displayOrder: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  { _id: false },
);

const addonGroupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 80,
    },
    selectionType: {
      type: String,
      enum: ADDON_SELECTION_TYPE_VALUES,
      default: ADDON_SELECTION_TYPES.SINGLE,
      required: true,
    },
    isRequired: {
      type: Boolean,
      default: false,
    },
    maxSelections: {
      type: Number,
      min: 1,
      default: 1,
      validate: [
        {
          validator: Number.isInteger,
          message: 'maxSelections must be an integer',
        },
        {
          validator(value) {
            if (this.selectionType === ADDON_SELECTION_TYPES.SINGLE) return value === 1;
            return value <= this.options.length;
          },
          message: 'maxSelections must be 1 for single-choice groups and within the option count',
        },
      ],
    },
    displayOrder: {
      type: Number,
      min: 0,
      default: 0,
    },
    options: {
      type: [addonOptionSchema],
      default: [],
      validate: [
        {
          validator: (options) => options.length > 0,
          message: 'Add-on groups must contain at least one option',
        },
        {
          validator: (options) => !hasDuplicateNames(options.map((option) => option.name)),
          message: 'Add-on option names must be unique within a group',
        },
      ],
    },
  },
  { _id: false },
);

const sizeOptionSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 60,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: 'Size price must be an integer amount in RWF',
      },
    },
    priceText: {
      type: String,
      trim: true,
      maxlength: 40,
      default: '',
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    displayOrder: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  { _id: false },
);

const servingOptionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 90,
    },
    priceDelta: {
      type: Number,
      min: 0,
      default: 0,
      validate: {
        validator: Number.isInteger,
        message: 'Serving price adjustment must be an integer amount in RWF',
      },
    },
    priceDeltaNote: {
      type: String,
      trim: true,
      maxlength: 240,
      default: '',
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    displayOrder: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  { _id: false },
);

const servingGroupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 80,
    },
    selectionType: {
      type: String,
      enum: ADDON_SELECTION_TYPE_VALUES,
      default: ADDON_SELECTION_TYPES.SINGLE,
      required: true,
    },
    isRequired: {
      type: Boolean,
      default: false,
    },
    maxSelections: {
      type: Number,
      min: 1,
      default: 1,
      validate: [
        {
          validator: Number.isInteger,
          message: 'maxSelections must be an integer',
        },
        {
          validator(value) {
            if (this.selectionType === ADDON_SELECTION_TYPES.SINGLE) return value === 1;
            return value <= this.options.length;
          },
          message: 'maxSelections must be 1 for single-choice groups and within the option count',
        },
      ],
    },
    displayOrder: {
      type: Number,
      min: 0,
      default: 0,
    },
    options: {
      type: [servingOptionSchema],
      default: [],
      validate: [
        {
          validator: (options) => options.length > 0,
          message: 'Serving option groups must contain at least one option',
        },
        {
          validator(options) {
            if (hasDuplicateNames(options.map((option) => option.name))) return false;
            const defaults = options.filter((option) => option.isDefault).length;
            if (defaults > 1) return false;
            if (this.isRequired && this.selectionType === ADDON_SELECTION_TYPES.SINGLE) {
              return defaults === 1;
            }
            return true;
          },
          message:
            'Serving option names must be unique; required single-choice groups need exactly one default',
        },
        {
          validator: (options) =>
            options.every((option) => option.priceDelta === 0 || option.priceDeltaNote),
          message: 'A positive serving price adjustment requires priceDeltaNote',
        },
      ],
    },
  },
  { _id: false },
);

const menuItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 90,
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
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuCategory',
      required: true,
      index: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: 'Price must be an integer amount in RWF',
      },
    },
    description: {
      type: String,
      trim: true,
      maxlength: 600,
      default: '',
    },
    includedItems: {
      type: [
        {
          type: String,
          trim: true,
          maxlength: 160,
        },
      ],
      default: [],
      validate: {
        validator: (items) => items.every((item) => item.trim().length > 0),
        message: 'Included items must not be empty',
      },
    },
    image: {
      type: mediaSchema,
      default: () => ({}),
    },
    gallery: {
      type: [mediaSchema],
      default: [],
      validate: {
        validator: (gallery) => gallery.length <= 5,
        message: 'A menu item may have at most 5 gallery images',
      },
    },
    ingredients: {
      type: [String],
      default: [],
    },
    allergens: {
      type: [String],
      default: [],
    },
    sizeOptions: {
      type: [sizeOptionSchema],
      default: [],
      validate: [
        {
          validator: (options) => !hasDuplicateNames(options.map((option) => option.label)),
          message: 'Size option labels must be unique',
        },
        {
          validator: (options) =>
            options.length === 0 || options.filter((option) => option.isDefault).length === 1,
          message: 'Size options must have exactly one default when present',
        },
      ],
    },
    servingOptions: {
      type: [servingGroupSchema],
      default: [],
      validate: {
        validator: (groups) => !hasDuplicateNames(groups.map((group) => group.name)),
        message: 'Serving option group names must be unique',
      },
    },
    addonGroups: {
      type: [addonGroupSchema],
      default: [],
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isPopular: {
      type: Boolean,
      default: false,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    needsReview: {
      type: Boolean,
      default: true,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    reviewStatus: {
      type: String,
      enum: MENU_REVIEW_STATUS_VALUES,
      default: MENU_REVIEW_STATUSES.NEEDS_REVIEW,
      index: true,
    },
    reviewIssueIds: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'MenuReviewIssue',
      default: [],
    },
    hasUnresolvedBlockingIssues: {
      type: Boolean,
      default: false,
      index: true,
    },
    reviewNote: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
    reviewTags: {
      type: [String],
      default: [],
    },
    dataSource: {
      type: String,
      enum: MENU_DATA_SOURCE_VALUES,
      default: MENU_DATA_SOURCES.BRIEF,
      required: true,
    },
    sourceRef: {
      type: String,
      trim: true,
      maxlength: 200,
      default: '',
    },
    sourcePage: {
      type: Number,
      min: 1,
      default: null,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    tags: {
      type: [String],
      default: [],
    },
    prepTimeMinutes: {
      type: Number,
      min: 0,
      default: null,
    },
    displayOrder: {
      type: Number,
      min: 0,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
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

menuItemSchema.pre('validate', function () {
  if (this.sizeOptions?.length) {
    const labels = this.sizeOptions.map((option) => option.label);
    if (hasDuplicateNames(labels)) {
      this.invalidate('sizeOptions', 'Size option labels must be unique');
    }

    const defaults = this.sizeOptions.filter((option) => option.isDefault).length;
    if (defaults !== 1) {
      this.invalidate('sizeOptions', 'Size options must have exactly one default when present');
    }

    const lowestPrice = Math.min(...this.sizeOptions.map((option) => option.price));
    if (this.price !== lowestPrice) {
      this.invalidate(
        'price',
        'Price must equal the lowest size option when sizeOptions are present',
      );
    }
  }

  if (this.servingOptions?.length) {
    const groupNames = this.servingOptions.map((group) => group.name);
    if (hasDuplicateNames(groupNames)) {
      this.invalidate('servingOptions', 'Serving option group names must be unique');
    }

    for (const group of this.servingOptions) {
      const options = group.options ?? [];
      if (options.length === 0) {
        this.invalidate('servingOptions', 'Serving option groups must contain at least one option');
        continue;
      }

      if (group.maxSelections > options.length) {
        this.invalidate('servingOptions', 'maxSelections cannot exceed the number of options');
      }

      if (group.selectionType === ADDON_SELECTION_TYPES.SINGLE && group.maxSelections !== 1) {
        this.invalidate('servingOptions', 'Single-choice groups must allow exactly one selection');
      }

      if (hasDuplicateNames(options.map((option) => option.name))) {
        this.invalidate('servingOptions', 'Serving option names must be unique within a group');
      }

      const defaults = options.filter((option) => option.isDefault).length;
      if (defaults > 1) {
        this.invalidate('servingOptions', 'Serving option groups may have at most one default');
      }

      if (
        group.isRequired &&
        group.selectionType === ADDON_SELECTION_TYPES.SINGLE &&
        defaults !== 1
      ) {
        this.invalidate(
          'servingOptions',
          'Required single-choice serving groups need exactly one default',
        );
      }

      if (options.some((option) => option.priceDelta > 0 && !option.priceDeltaNote)) {
        this.invalidate(
          'servingOptions',
          'A positive serving price adjustment requires priceDeltaNote',
        );
      }
    }
  }
});

menuItemSchema.index({ category: 1, isArchived: 1, displayOrder: 1 });
menuItemSchema.index({ isFeatured: 1, isAvailable: 1 });
menuItemSchema.index({ name: 'text', description: 'text', tags: 'text' });

const MenuItem = mongoose.models.MenuItem ?? mongoose.model('MenuItem', menuItemSchema);

export default MenuItem;
