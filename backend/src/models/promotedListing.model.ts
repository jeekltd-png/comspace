import mongoose, { Schema, Document } from 'mongoose';

// ── Promoted Listing (paid product boosting) ─────────────────────────────────
export interface IPromotedListing extends Document {
  product: mongoose.Types.ObjectId;
  tenant: string;
  merchant: mongoose.Types.ObjectId;
  type: 'sponsored' | 'featured' | 'banner';
  status: 'active' | 'paused' | 'expired' | 'pending';
  budget: {
    daily: number;
    total: number;
    spent: number;
    currency: string;
  };
  pricing: {
    model: 'cpc' | 'cpm' | 'flat'; // cost-per-click, per-1000-impressions, flat monthly
    amount: number;
  };
  performance: {
    impressions: number;
    clicks: number;
    conversions: number;
    revenue: number;
  };
  startsAt: Date;
  endsAt: Date;
  categories?: string[];
  stripePaymentIntentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PromotedListingSchema: Schema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    tenant: { type: String, required: true, index: true },
    merchant: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['sponsored', 'featured', 'banner'],
      default: 'sponsored',
    },
    status: {
      type: String,
      enum: ['active', 'paused', 'expired', 'pending'],
      default: 'pending',
    },
    budget: {
      daily: { type: Number, default: 10 },
      total: { type: Number, required: true },
      spent: { type: Number, default: 0 },
      currency: { type: String, default: 'GBP' },
    },
    pricing: {
      model: { type: String, enum: ['cpc', 'cpm', 'flat'], default: 'cpc' },
      amount: { type: Number, required: true }, // e.g. 0.10 per click
    },
    performance: {
      impressions: { type: Number, default: 0 },
      clicks: { type: Number, default: 0 },
      conversions: { type: Number, default: 0 },
      revenue: { type: Number, default: 0 },
    },
    startsAt: { type: Date, required: true },
    endsAt: { type: Date, required: true },
    categories: [String],
    stripePaymentIntentId: String,
  },
  { timestamps: true }
);

PromotedListingSchema.index({ status: 1, startsAt: 1, endsAt: 1 });
PromotedListingSchema.index({ tenant: 1, merchant: 1 });
PromotedListingSchema.index({ product: 1 });

export default mongoose.model<IPromotedListing>(
  'PromotedListing',
  PromotedListingSchema
);
