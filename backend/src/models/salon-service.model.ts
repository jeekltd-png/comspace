import mongoose, { Schema, Document } from 'mongoose';

// ── Types ────────────────────────────────────────────────────

export interface ISalonService extends Document {
  name: string;
  slug: string;
  description?: string;
  /** Category grouping — e.g. "Hair", "Nails", "Facial", "Massage" */
  category: string;
  /** Duration in minutes */
  duration: number;
  /** Base price */
  price: number;
  currency: string;
  /** Optional sale / promo price */
  salePrice?: number;
  /** Representative image */
  image?: string;
  /** Gallery images */
  images?: Array<{ url: string; alt?: string }>;
  /** Staff members qualified to perform this service */
  staffIds: mongoose.Types.ObjectId[];
  /** Tags for search / filtering */
  tags?: string[];
  /** Whether this service is currently bookable */
  isActive: boolean;
  /** Featured services appear on the homepage */
  isFeatured: boolean;
  /** Sort order within category */
  sortOrder: number;
  /** Tenant this service belongs to */
  tenant: string;
  /** Vendor / salon owner (maps to VendorProfile.userId) */
  vendor: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// ── Schema ───────────────────────────────────────────────────

const SalonServiceSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Service name is required'],
      trim: true,
      maxlength: [150, 'Service name cannot exceed 150 characters'],
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    category: {
      type: String,
      required: [true, 'Service category is required'],
      trim: true,
    },
    duration: {
      type: Number,
      required: [true, 'Duration is required'],
      min: [5, 'Minimum duration is 5 minutes'],
      max: [480, 'Maximum duration is 8 hours'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    currency: {
      type: String,
      default: 'GBP',
      uppercase: true,
    },
    salePrice: {
      type: Number,
      min: [0, 'Sale price cannot be negative'],
    },
    image: String,
    images: [
      {
        url: { type: String, required: true },
        alt: String,
      },
    ],
    staffIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'StaffMember',
      },
    ],
    tags: [String],
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
    tenant: { type: String, required: true, index: true },
    vendor: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true },
);

// Indexes
SalonServiceSchema.index({ tenant: 1, slug: 1 }, { unique: true });
SalonServiceSchema.index({ tenant: 1, category: 1 });
SalonServiceSchema.index({ tenant: 1, isActive: 1, isFeatured: 1 });

export default mongoose.model<ISalonService>('SalonService', SalonServiceSchema);
