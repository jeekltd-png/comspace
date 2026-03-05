import mongoose, { Schema, Document } from 'mongoose';

// ── API Usage Tracking (for tiered API billing) ──────────────────────────────
export interface IApiUsage extends Document {
  tenant: string;
  date: string; // YYYY-MM-DD for daily bucketing
  calls: number;
  endpoints: Record<string, number>; // { '/api/products': 42, ... }
  createdAt: Date;
  updatedAt: Date;
}

const ApiUsageSchema: Schema = new Schema(
  {
    tenant: { type: String, required: true },
    date: { type: String, required: true },
    calls: { type: Number, default: 0 },
    endpoints: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

ApiUsageSchema.index({ tenant: 1, date: -1 }, { unique: true });

export default mongoose.model<IApiUsage>('ApiUsage', ApiUsageSchema);
