import mongoose, { Schema, Document } from 'mongoose';

// ── Partner / Affiliate Programme ────────────────────────────────────────────
export interface IPartner extends Document {
  user: mongoose.Types.ObjectId;
  code: string; // unique referral code
  name: string;
  email: string;
  type: 'affiliate' | 'reseller' | 'referral';
  status: 'pending' | 'active' | 'suspended';
  commissionRate: number; // % of first-year subscription revenue
  // Payment
  payoutMethod: 'stripe' | 'bank_transfer' | 'paypal';
  payoutDetails?: string; // encrypted email or account ref
  stripeConnectId?: string;
  // Performance
  stats: {
    referrals: number;
    activeTenants: number;
    totalEarned: number;
    totalPaid: number;
    pendingPayout: number;
    currency: string;
  };
  // Tracking
  referredTenants: Array<{
    tenant: string;
    signedUpAt: Date;
    firstPaymentAt?: Date;
    totalRevenue: number;
    commissionEarned: number;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const PartnerSchema: Schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      match: /^[A-Z0-9]{4,20}$/,
    },
    name: { type: String, required: true },
    email: { type: String, required: true, lowercase: true },
    type: {
      type: String,
      enum: ['affiliate', 'reseller', 'referral'],
      default: 'affiliate',
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'suspended'],
      default: 'pending',
    },
    commissionRate: { type: Number, default: 20, min: 0, max: 100 }, // 20% of first-year
    payoutMethod: {
      type: String,
      enum: ['stripe', 'bank_transfer', 'paypal'],
      default: 'bank_transfer',
    },
    payoutDetails: String,
    stripeConnectId: String,
    stats: {
      referrals: { type: Number, default: 0 },
      activeTenants: { type: Number, default: 0 },
      totalEarned: { type: Number, default: 0 },
      totalPaid: { type: Number, default: 0 },
      pendingPayout: { type: Number, default: 0 },
      currency: { type: String, default: 'GBP' },
    },
    referredTenants: [
      {
        tenant: { type: String, required: true },
        signedUpAt: { type: Date, default: Date.now },
        firstPaymentAt: Date,
        totalRevenue: { type: Number, default: 0 },
        commissionEarned: { type: Number, default: 0 },
      },
    ],
  },
  { timestamps: true }
);

PartnerSchema.index({ code: 1 });
PartnerSchema.index({ status: 1 });
PartnerSchema.index({ email: 1 });

export default mongoose.model<IPartner>('Partner', PartnerSchema);
