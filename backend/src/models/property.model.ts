import mongoose, { Schema, Document } from 'mongoose';
import crypto from 'crypto';

// ── Types ────────────────────────────────────────────────────

export type PropertyType = 'room' | 'suite' | 'apartment' | 'cottage' | 'cabin' | 'villa' | 'dormitory';
export type PropertyStatus = 'available' | 'maintenance' | 'retired';
export type CancellationPolicy = 'flexible' | 'moderate' | 'strict' | 'non-refundable';

export interface IProperty extends Document {
  /** Human-readable property code e.g. PROP-A1B2C3D4 */
  propertyCode: string;
  name: string;
  slug: string;
  type: PropertyType;
  description: string;
  shortDescription?: string;
  amenities: string[];
  images: Array<{
    url: string;
    alt?: string;
    isPrimary: boolean;
  }>;
  maxGuests: number;
  beds: number;
  bathrooms: number;
  /** Size in square metres */
  sizeSqm?: number;
  /** Floor number or level */
  floor?: string;
  basePrice: number;
  currency: string;
  status: PropertyStatus;
  policies: {
    checkInTime: string;
    checkOutTime: string;
    cancellationPolicy: CancellationPolicy;
    minStay: number;
    maxStay: number;
    smokingAllowed: boolean;
    petsAllowed: boolean;
    childrenAllowed: boolean;
  };
  /** Tags for filtering (e.g. "ocean-view", "ground-floor") */
  tags: string[];
  sortOrder: number;
  isActive: boolean;
  tenant: string;
  createdAt: Date;
  updatedAt: Date;
}

// ── Schema ───────────────────────────────────────────────────

const PropertySchema = new Schema(
  {
    propertyCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: [true, 'Property name is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['room', 'suite', 'apartment', 'cottage', 'cabin', 'villa', 'dormitory'],
      default: 'room',
    },
    description: {
      type: String,
      required: [true, 'Property description is required'],
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    shortDescription: {
      type: String,
      maxlength: [300, 'Short description cannot exceed 300 characters'],
    },
    amenities: [{ type: String, trim: true }],
    images: [
      {
        url: { type: String, required: true },
        alt: String,
        isPrimary: { type: Boolean, default: false },
      },
    ],
    maxGuests: {
      type: Number,
      required: [true, 'Max guests is required'],
      min: [1, 'Must accommodate at least 1 guest'],
    },
    beds: {
      type: Number,
      required: true,
      min: 0,
    },
    bathrooms: {
      type: Number,
      required: true,
      min: 0,
    },
    sizeSqm: {
      type: Number,
      min: 0,
    },
    floor: String,
    basePrice: {
      type: Number,
      required: [true, 'Base price per night is required'],
      min: [0, 'Base price cannot be negative'],
    },
    currency: {
      type: String,
      default: 'GBP',
      uppercase: true,
    },
    status: {
      type: String,
      enum: ['available', 'maintenance', 'retired'],
      default: 'available',
    },
    policies: {
      checkInTime: { type: String, default: '15:00' },
      checkOutTime: { type: String, default: '11:00' },
      cancellationPolicy: {
        type: String,
        enum: ['flexible', 'moderate', 'strict', 'non-refundable'],
        default: 'moderate',
      },
      minStay: { type: Number, default: 1, min: 1 },
      maxStay: { type: Number, default: 30, min: 1 },
      smokingAllowed: { type: Boolean, default: false },
      petsAllowed: { type: Boolean, default: false },
      childrenAllowed: { type: Boolean, default: true },
    },
    tags: [{ type: String, trim: true, lowercase: true }],
    sortOrder: { type: Number, default: 0 },
    isActive: {
      type: Boolean,
      default: true,
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
PropertySchema.index({ tenant: 1, slug: 1 }, { unique: true });
PropertySchema.index({ tenant: 1, type: 1, isActive: 1 });
PropertySchema.index({ tenant: 1, status: 1 });
PropertySchema.index({ tenant: 1, basePrice: 1 });
PropertySchema.index({ propertyCode: 1 }, { unique: true });

// Auto-generate property code
PropertySchema.pre('validate', function (next) {
  if (!this.propertyCode) {
    this.propertyCode = 'PROP-' + crypto.randomBytes(4).toString('hex').toUpperCase();
  }
  if (!this.slug && this.name) {
    this.slug = (this.name as string)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      + '-' + Date.now().toString(36);
  }
  next();
});

export default mongoose.model<IProperty>('Property', PropertySchema);
