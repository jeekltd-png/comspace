import mongoose, { Schema, Document } from 'mongoose';

// ── Types ────────────────────────────────────────────────────

export type GuestMessageType = 'inquiry' | 'pre_arrival' | 'during_stay' | 'post_checkout' | 'general';

export interface IGuestMessage extends Document {
  reservation?: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  /** The recipient (hotel admin or guest) */
  recipient?: mongoose.Types.ObjectId;
  type: GuestMessageType;
  subject?: string;
  message: string;
  attachments: string[];
  readAt?: Date;
  isFromGuest: boolean;
  tenant: string;
  createdAt: Date;
  updatedAt: Date;
}

// ── Schema ───────────────────────────────────────────────────

const GuestMessageSchema = new Schema(
  {
    reservation: {
      type: Schema.Types.ObjectId,
      ref: 'Reservation',
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    recipient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    type: {
      type: String,
      enum: ['inquiry', 'pre_arrival', 'during_stay', 'post_checkout', 'general'],
      default: 'general',
    },
    subject: {
      type: String,
      maxlength: [200, 'Subject cannot exceed 200 characters'],
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      maxlength: [5000, 'Message cannot exceed 5000 characters'],
    },
    attachments: [{ type: String }],
    readAt: Date,
    isFromGuest: {
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
GuestMessageSchema.index({ tenant: 1, reservation: 1, createdAt: 1 });
GuestMessageSchema.index({ tenant: 1, sender: 1, createdAt: -1 });
GuestMessageSchema.index({ tenant: 1, readAt: 1 });

export default mongoose.model<IGuestMessage>('GuestMessage', GuestMessageSchema);
