import mongoose, { Schema, Document } from 'mongoose';

// ── Commission Ledger (tracks platform fees on every order) ──────────────────
export interface ICommission extends Document {
  order: mongoose.Types.ObjectId;
  tenant: string;
  orderTotal: number;
  commissionRate: number; // % at time of order
  commissionAmount: number;
  currency: string;
  status: 'pending' | 'collected' | 'refunded';
  stripeTransferId?: string;
  collectedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CommissionSchema: Schema = new Schema(
  {
    order: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    tenant: { type: String, required: true, index: true },
    orderTotal: { type: Number, required: true },
    commissionRate: { type: Number, required: true },
    commissionAmount: { type: Number, required: true },
    currency: { type: String, default: 'GBP' },
    status: {
      type: String,
      enum: ['pending', 'collected', 'refunded'],
      default: 'pending',
    },
    stripeTransferId: String,
    collectedAt: Date,
  },
  { timestamps: true }
);

CommissionSchema.index({ tenant: 1, createdAt: -1 });
CommissionSchema.index({ status: 1 });

export default mongoose.model<ICommission>('Commission', CommissionSchema);
