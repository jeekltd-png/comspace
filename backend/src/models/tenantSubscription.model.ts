import mongoose, { Schema, Document } from 'mongoose';

// ── Tenant Subscription (tracks a tenant's SaaS billing) ─────────────────────
export interface ITenantSubscription extends Document {
  tenant: string;
  plan: mongoose.Types.ObjectId;
  status: 'trialing' | 'active' | 'past_due' | 'cancelled' | 'paused';
  billingCycle: 'monthly' | 'yearly';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  trialEnd?: Date;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  cancelAtPeriodEnd: boolean;
  // Revenue tracking
  totalRevenue: number; // cumulative GMV processed
  totalCommission: number; // cumulative commission earned
  // Add-ons
  addOns: Array<{
    slug: string;
    name: string;
    price: number;
    activatedAt: Date;
    stripeItemId?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const TenantSubscriptionSchema: Schema = new Schema(
  {
    tenant: { type: String, required: true, unique: true, index: true },
    plan: { type: Schema.Types.ObjectId, ref: 'PlatformPlan', required: true },
    status: {
      type: String,
      enum: ['trialing', 'active', 'past_due', 'cancelled', 'paused'],
      default: 'trialing',
    },
    billingCycle: {
      type: String,
      enum: ['monthly', 'yearly'],
      default: 'monthly',
    },
    currentPeriodStart: { type: Date, default: Date.now },
    currentPeriodEnd: { type: Date },
    trialEnd: { type: Date },
    stripeCustomerId: String,
    stripeSubscriptionId: String,
    cancelAtPeriodEnd: { type: Boolean, default: false },
    totalRevenue: { type: Number, default: 0 },
    totalCommission: { type: Number, default: 0 },
    addOns: [
      {
        slug: { type: String, required: true },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        activatedAt: { type: Date, default: Date.now },
        stripeItemId: String,
      },
    ],
  },
  { timestamps: true }
);

TenantSubscriptionSchema.index({ status: 1 });
TenantSubscriptionSchema.index({ currentPeriodEnd: 1 });

export default mongoose.model<ITenantSubscription>(
  'TenantSubscription',
  TenantSubscriptionSchema
);
