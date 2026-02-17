import mongoose, { Schema, Document } from 'mongoose';

// ── Types ────────────────────────────────────────────────────

export interface IDayModifier {
  /** Day of week: 0=Sun, 1=Mon … 6=Sat */
  day: number;
  /** Percentage modifier e.g. 20 means +20% */
  modifier: number;
}

export interface IRatePlan extends Document {
  name: string;
  description?: string;
  property: mongoose.Types.ObjectId;
  /** Date range for this rate plan (YYYY-MM-DD) */
  startDate: string;
  endDate: string;
  pricePerNight: number;
  currency: string;
  /** Day-of-week percentage modifiers (e.g. +20% on weekends) */
  dayModifiers: IDayModifier[];
  /** Minimum stay required for this rate */
  minStay: number;
  /** Priority — higher overrides lower when date ranges overlap */
  priority: number;
  isActive: boolean;
  tenant: string;
  createdAt: Date;
  updatedAt: Date;
}

// ── Schema ───────────────────────────────────────────────────

const RatePlanSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Rate plan name is required'],
      trim: true,
    },
    description: {
      type: String,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    property: {
      type: Schema.Types.ObjectId,
      ref: 'Property',
      required: true,
    },
    startDate: {
      type: String,
      required: [true, 'Start date is required'],
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'],
    },
    endDate: {
      type: String,
      required: [true, 'End date is required'],
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'],
    },
    pricePerNight: {
      type: Number,
      required: [true, 'Price per night is required'],
      min: [0, 'Price cannot be negative'],
    },
    currency: {
      type: String,
      default: 'GBP',
      uppercase: true,
    },
    dayModifiers: [
      {
        day: {
          type: Number,
          required: true,
          min: 0,
          max: 6,
        },
        modifier: {
          type: Number,
          required: true,
          default: 0,
        },
      },
    ],
    minStay: {
      type: Number,
      default: 1,
      min: 1,
    },
    priority: {
      type: Number,
      default: 0,
    },
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
RatePlanSchema.index({ tenant: 1, property: 1, startDate: 1, endDate: 1 });
RatePlanSchema.index({ tenant: 1, isActive: 1, priority: -1 });

export default mongoose.model<IRatePlan>('RatePlan', RatePlanSchema);
