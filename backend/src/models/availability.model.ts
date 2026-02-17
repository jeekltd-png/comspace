import mongoose, { Schema, Document } from 'mongoose';

// ── Types ────────────────────────────────────────────────────

export type AvailabilityStatus = 'available' | 'booked' | 'blocked' | 'maintenance';

export interface IAvailability extends Document {
  property: mongoose.Types.ObjectId;
  /** Date (YYYY-MM-DD) — one document per property per date */
  date: string;
  status: AvailabilityStatus;
  /** Linked reservation if booked */
  reservation?: mongoose.Types.ObjectId;
  /** Price override for this specific date (null = use rate plan / base price) */
  priceOverride?: number;
  /** Note e.g. "Owner block — family visit" */
  note?: string;
  tenant: string;
  createdAt: Date;
  updatedAt: Date;
}

// ── Schema ───────────────────────────────────────────────────

const AvailabilitySchema = new Schema(
  {
    property: {
      type: Schema.Types.ObjectId,
      ref: 'Property',
      required: true,
    },
    date: {
      type: String,
      required: [true, 'Date is required'],
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'],
    },
    status: {
      type: String,
      enum: ['available', 'booked', 'blocked', 'maintenance'],
      default: 'available',
    },
    reservation: {
      type: Schema.Types.ObjectId,
      ref: 'Reservation',
    },
    priceOverride: {
      type: Number,
      min: 0,
    },
    note: {
      type: String,
      maxlength: [500, 'Note cannot exceed 500 characters'],
    },
    tenant: {
      type: String,
      required: true,
      index: true,
    },
  },
  { timestamps: true },
);

// Unique constraint: one record per property per date
AvailabilitySchema.index({ tenant: 1, property: 1, date: 1 }, { unique: true });
AvailabilitySchema.index({ tenant: 1, property: 1, status: 1 });
AvailabilitySchema.index({ tenant: 1, date: 1, status: 1 });

export default mongoose.model<IAvailability>('Availability', AvailabilitySchema);
