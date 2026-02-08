import mongoose, { Schema, Document } from 'mongoose';

export interface IMembershipPlan extends Document {
  name: string;
  description: string;
  amount: number;
  currency: string;
  interval: 'monthly' | 'quarterly' | 'yearly';
  features: string[];
  isActive: boolean;
  stripePriceId?: string;
  stripeProductId?: string;
  maxMembers?: number;
  tenant: string;
  createdAt: Date;
  updatedAt: Date;
}

const MembershipPlanSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Plan name is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
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
      trim: true,
    },
    interval: {
      type: String,
      enum: ['monthly', 'quarterly', 'yearly'],
      default: 'monthly',
    },
    features: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    stripePriceId: {
      type: String,
    },
    stripeProductId: {
      type: String,
    },
    maxMembers: {
      type: Number,
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

MembershipPlanSchema.index({ tenant: 1, isActive: 1 });
MembershipPlanSchema.index({ name: 1, tenant: 1 }, { unique: true });

export default mongoose.model<IMembershipPlan>('MembershipPlan', MembershipPlanSchema);
