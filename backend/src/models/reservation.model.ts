import mongoose, { Schema, Document } from 'mongoose';
import crypto from 'crypto';

// ── Types ────────────────────────────────────────────────────

export type ReservationStatus =
  | 'pending'
  | 'confirmed'
  | 'checked_in'
  | 'checked_out'
  | 'cancelled'
  | 'no_show';

export type ReservationSource = 'direct' | 'booking_com' | 'airbnb' | 'expedia' | 'manual';

export interface INightlyBreakdown {
  date: string;
  basePrice: number;
  modifiedPrice: number;
  ratePlan?: string;
}

export interface IReservation extends Document {
  /** Human-readable reservation reference e.g. RES-A1B2C3D4 */
  reservationRef: string;
  property: mongoose.Types.ObjectId;
  guest: mongoose.Types.ObjectId;
  /** Check-in date (YYYY-MM-DD) */
  checkIn: string;
  /** Check-out date (YYYY-MM-DD) */
  checkOut: string;
  /** Number of nights (computed) */
  nights: number;
  guests: {
    adults: number;
    children: number;
    infants: number;
  };
  status: ReservationStatus;
  source: ReservationSource;
  pricing: {
    nightlyBreakdown: INightlyBreakdown[];
    subtotal: number;
    taxes: number;
    fees: number;
    addOns: Array<{
      addOn: mongoose.Types.ObjectId;
      name: string;
      quantity: number;
      unitPrice: number;
      total: number;
    }>;
    discount: number;
    total: number;
    currency: string;
  };
  payment: {
    stripePaymentIntentId?: string;
    depositAmount: number;
    depositPaid: boolean;
    balanceDue: number;
    paymentStatus: 'unpaid' | 'deposit_paid' | 'fully_paid' | 'refunded' | 'partial_refund';
  };
  cancellation?: {
    policy: string;
    refundAmount: number;
    cancelledAt: Date;
    reason?: string;
  };
  specialRequests?: string;
  /** History of status changes */
  statusHistory: Array<{
    status: string;
    timestamp: Date;
    note?: string;
    updatedBy?: mongoose.Types.ObjectId;
  }>;
  tenant: string;
  createdAt: Date;
  updatedAt: Date;
}

// ── Schema ───────────────────────────────────────────────────

const ReservationSchema = new Schema(
  {
    reservationRef: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    property: {
      type: Schema.Types.ObjectId,
      ref: 'Property',
      required: true,
    },
    guest: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    checkIn: {
      type: String,
      required: [true, 'Check-in date is required'],
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'],
    },
    checkOut: {
      type: String,
      required: [true, 'Check-out date is required'],
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'],
    },
    nights: {
      type: Number,
      required: true,
      min: 1,
    },
    guests: {
      adults: { type: Number, required: true, min: 1, default: 1 },
      children: { type: Number, default: 0, min: 0 },
      infants: { type: Number, default: 0, min: 0 },
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show'],
      default: 'pending',
    },
    source: {
      type: String,
      enum: ['direct', 'booking_com', 'airbnb', 'expedia', 'manual'],
      default: 'direct',
    },
    pricing: {
      nightlyBreakdown: [
        {
          date: { type: String, required: true },
          basePrice: { type: Number, required: true },
          modifiedPrice: { type: Number, required: true },
          ratePlan: String,
        },
      ],
      subtotal: { type: Number, required: true, min: 0 },
      taxes: { type: Number, default: 0, min: 0 },
      fees: { type: Number, default: 0, min: 0 },
      addOns: [
        {
          addOn: { type: Schema.Types.ObjectId, ref: 'HotelAddOn' },
          name: { type: String, required: true },
          quantity: { type: Number, required: true, min: 1 },
          unitPrice: { type: Number, required: true },
          total: { type: Number, required: true },
        },
      ],
      discount: { type: Number, default: 0, min: 0 },
      total: { type: Number, required: true, min: 0 },
      currency: { type: String, default: 'GBP', uppercase: true },
    },
    payment: {
      stripePaymentIntentId: String,
      depositAmount: { type: Number, default: 0, min: 0 },
      depositPaid: { type: Boolean, default: false },
      balanceDue: { type: Number, default: 0, min: 0 },
      paymentStatus: {
        type: String,
        enum: ['unpaid', 'deposit_paid', 'fully_paid', 'refunded', 'partial_refund'],
        default: 'unpaid',
      },
    },
    cancellation: {
      policy: String,
      refundAmount: Number,
      cancelledAt: Date,
      reason: String,
    },
    specialRequests: {
      type: String,
      maxlength: [1000, 'Special requests cannot exceed 1000 characters'],
    },
    statusHistory: [
      {
        status: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        note: String,
        updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      },
    ],
    tenant: {
      type: String,
      required: true,
      index: true,
    },
  },
  { timestamps: true },
);

// Indexes
ReservationSchema.index({ tenant: 1, property: 1, checkIn: 1, checkOut: 1 });
ReservationSchema.index({ tenant: 1, guest: 1, status: 1 });
ReservationSchema.index({ tenant: 1, status: 1, checkIn: 1 });
ReservationSchema.index({ tenant: 1, createdAt: -1 });
ReservationSchema.index({ reservationRef: 1 }, { unique: true });
ReservationSchema.index({ 'payment.stripePaymentIntentId': 1 }, { sparse: true });

// Auto-generate reservation reference
ReservationSchema.pre('validate', function (next) {
  if (!this.reservationRef) {
    this.reservationRef = 'RES-' + crypto.randomBytes(4).toString('hex').toUpperCase();
  }
  next();
});

// Compute nights and push status history on status change
ReservationSchema.pre('save', function (next) {
  // Compute nights from check-in/check-out
  if (this.checkIn && this.checkOut) {
    const checkInDate = new Date(this.checkIn + 'T00:00:00Z');
    const checkOutDate = new Date(this.checkOut + 'T00:00:00Z');
    const diffMs = checkOutDate.getTime() - checkInDate.getTime();
    this.nights = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));
  }

  // Track status changes
  if (this.isModified('status')) {
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date(),
    });
  }

  next();
});

export default mongoose.model<IReservation>('Reservation', ReservationSchema);
