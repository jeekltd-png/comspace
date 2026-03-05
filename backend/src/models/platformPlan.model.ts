import mongoose, { Schema, Document } from 'mongoose';

// ── Platform Subscription Plan (SaaS tiers for tenants) ──────────────────────
export interface IPlatformPlan extends Document {
  name: string;
  slug: string; // starter, growth, pro, enterprise
  description: string;
  price: {
    monthly: number;
    yearly: number;
    currency: string;
  };
  limits: {
    admins: number;        // max admin users
    products: number;      // max products (-1 = unlimited)
    orders: number;        // max orders/month (-1 = unlimited)
    storage: number;       // MB of file storage
    apiCalls: number;      // daily API calls (-1 = unlimited)
  };
  features: string[];       // feature keys included
  commissionRate: number;    // platform take-rate % (e.g. 5.0 = 5%)
  stripePriceIdMonthly?: string;
  stripePriceIdYearly?: string;
  stripeProductId?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const PlatformPlanSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, default: '' },
    price: {
      monthly: { type: Number, required: true },
      yearly: { type: Number, required: true },
      currency: { type: String, default: 'GBP', uppercase: true },
    },
    limits: {
      admins: { type: Number, default: 1 },
      products: { type: Number, default: 50 },
      orders: { type: Number, default: -1 },
      storage: { type: Number, default: 500 }, // MB
      apiCalls: { type: Number, default: 1000 },
    },
    features: [{ type: String }],
    commissionRate: { type: Number, default: 5.0, min: 0, max: 100 },
    stripePriceIdMonthly: String,
    stripePriceIdYearly: String,
    stripeProductId: String,
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

PlatformPlanSchema.index({ isActive: 1, sortOrder: 1 });

export default mongoose.model<IPlatformPlan>('PlatformPlan', PlatformPlanSchema);
