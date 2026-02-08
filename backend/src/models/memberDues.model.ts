import mongoose, { Schema, Document } from 'mongoose';

export interface IMemberDues extends Document {
  membership: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  plan: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'overdue' | 'failed' | 'waived';
  dueDate: Date;
  paidDate?: Date;
  periodStart: Date;
  periodEnd: Date;
  paymentMethod: 'stripe' | 'manual' | 'bank_transfer' | 'cash';
  stripePaymentIntentId?: string;
  stripeInvoiceId?: string;
  receiptUrl?: string;
  notes?: string;
  recordedBy?: mongoose.Types.ObjectId; // admin who recorded manual payment
  tenant: string;
  createdAt: Date;
  updatedAt: Date;
}

const MemberDuesSchema: Schema = new Schema(
  {
    membership: {
      type: Schema.Types.ObjectId,
      ref: 'Membership',
      required: [true, 'Membership is required'],
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    plan: {
      type: Schema.Types.ObjectId,
      ref: 'MembershipPlan',
      required: [true, 'Plan is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount must be non-negative'],
    },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true,
    },
    status: {
      type: String,
      enum: ['paid', 'pending', 'overdue', 'failed', 'waived'],
      default: 'pending',
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },
    paidDate: {
      type: Date,
    },
    periodStart: {
      type: Date,
      required: true,
    },
    periodEnd: {
      type: Date,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ['stripe', 'manual', 'bank_transfer', 'cash'],
      default: 'stripe',
    },
    stripePaymentIntentId: {
      type: String,
    },
    stripeInvoiceId: {
      type: String,
    },
    receiptUrl: {
      type: String,
    },
    notes: {
      type: String,
    },
    recordedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    tenant: {
      type: String,
      default: 'default',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

MemberDuesSchema.index({ user: 1, tenant: 1 });
MemberDuesSchema.index({ membership: 1, tenant: 1 });
MemberDuesSchema.index({ status: 1, tenant: 1 });
MemberDuesSchema.index({ dueDate: 1 });
MemberDuesSchema.index({ periodStart: 1, periodEnd: 1 });
// Prevent duplicate dues records for same membership + period
MemberDuesSchema.index(
  { membership: 1, periodStart: 1, tenant: 1 },
  { unique: true }
);

export default mongoose.model<IMemberDues>('MemberDues', MemberDuesSchema);
