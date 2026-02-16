import mongoose, { Schema, Document } from 'mongoose';
import crypto from 'crypto';

// ── Types ────────────────────────────────────────────────────

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'in-progress'
  | 'completed'
  | 'cancelled'
  | 'no-show';

export interface IBooking extends Document {
  /** Human-readable booking reference e.g. BKG-A1B2C3 */
  bookingRef: string;
  /** Customer who booked */
  customer: mongoose.Types.ObjectId;
  /** The salon service being booked */
  service: mongoose.Types.ObjectId;
  /** Assigned staff member */
  staff: mongoose.Types.ObjectId;
  /** Appointment date (YYYY-MM-DD) */
  date: string;
  /** Start time ("14:30" — 24h) */
  startTime: string;
  /** End time (computed from service duration) */
  endTime: string;
  /** Duration in minutes (snapshot from service) */
  duration: number;
  /** Price at time of booking */
  price: number;
  currency: string;
  /** Stripe paymentIntentId for paid bookings */
  paymentIntentId?: string;
  paymentStatus: 'unpaid' | 'paid' | 'refunded';
  status: BookingStatus;
  /** Customer-supplied notes ("I'd like balayage highlights") */
  notes?: string;
  /** History of status changes */
  statusHistory: Array<{
    status: string;
    timestamp: Date;
    note?: string;
  }>;
  tenant: string;
  vendor: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// ── Schema ───────────────────────────────────────────────────

const BookingSchema = new Schema(
  {
    bookingRef: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    customer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    service: {
      type: Schema.Types.ObjectId,
      ref: 'SalonService',
      required: true,
    },
    staff: {
      type: Schema.Types.ObjectId,
      ref: 'StaffMember',
      required: true,
    },
    date: {
      type: String,
      required: [true, 'Booking date is required'],
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'],
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required'],
      match: [/^\d{2}:\d{2}$/, 'Time must be HH:MM (24h)'],
    },
    endTime: {
      type: String,
      required: true,
      match: [/^\d{2}:\d{2}$/, 'Time must be HH:MM (24h)'],
    },
    duration: {
      type: Number,
      required: true,
      min: 5,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'GBP',
      uppercase: true,
    },
    paymentIntentId: String,
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'paid', 'refunded'],
      default: 'unpaid',
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'],
      default: 'pending',
    },
    notes: {
      type: String,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
    statusHistory: [
      {
        status: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        note: String,
      },
    ],
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
BookingSchema.index({ tenant: 1, date: 1, staff: 1 });
BookingSchema.index({ tenant: 1, customer: 1, status: 1 });
BookingSchema.index({ tenant: 1, vendor: 1, date: 1 });
BookingSchema.index({ bookingRef: 1 }, { unique: true });

// Auto-generate booking reference
BookingSchema.pre('validate', function (next) {
  if (!this.bookingRef) {
    this.bookingRef = 'BKG-' + crypto.randomBytes(4).toString('hex').toUpperCase();
  }
  next();
});

export default mongoose.model<IBooking>('Booking', BookingSchema);
