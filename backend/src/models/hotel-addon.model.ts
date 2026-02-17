import mongoose, { Schema, Document } from 'mongoose';

// ── Types ────────────────────────────────────────────────────

export type AddOnPer = 'night' | 'stay' | 'guest';

export interface IHotelAddOn extends Document {
  name: string;
  description?: string;
  price: number;
  currency: string;
  per: AddOnPer;
  /** Category for grouping (e.g. "dining", "transport", "experience") */
  category?: string;
  isActive: boolean;
  sortOrder: number;
  tenant: string;
  createdAt: Date;
  updatedAt: Date;
}

// ── Schema ───────────────────────────────────────────────────

const HotelAddOnSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Add-on name is required'],
      trim: true,
    },
    description: {
      type: String,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    price: {
      type: Number,
      required: [true, 'Add-on price is required'],
      min: [0, 'Price cannot be negative'],
    },
    currency: {
      type: String,
      default: 'GBP',
      uppercase: true,
    },
    per: {
      type: String,
      enum: ['night', 'stay', 'guest'],
      required: [true, 'Pricing basis (per night/stay/guest) is required'],
    },
    category: {
      type: String,
      trim: true,
      lowercase: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    tenant: {
      type: String,
      required: true,
      index: true,
    },
  },
  { timestamps: true },
);

// Indexes
HotelAddOnSchema.index({ tenant: 1, isActive: 1, sortOrder: 1 });
HotelAddOnSchema.index({ tenant: 1, category: 1 });

export default mongoose.model<IHotelAddOn>('HotelAddOn', HotelAddOnSchema);
