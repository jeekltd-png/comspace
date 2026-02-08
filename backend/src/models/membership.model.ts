import mongoose, { Schema, Document } from 'mongoose';

export interface IMembership extends Document {
  user: mongoose.Types.ObjectId;
  plan: mongoose.Types.ObjectId;
  status: 'active' | 'lapsed' | 'suspended' | 'cancelled' | 'pending';
  memberNumber: string;
  joinDate: Date;
  expiryDate?: Date;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  autoRenew: boolean;
  lastPaymentDate?: Date;
  nextDueDate?: Date;
  tenant: string;
  createdAt: Date;
  updatedAt: Date;
}

const MembershipSchema: Schema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    plan: {
      type: Schema.Types.ObjectId,
      ref: 'MembershipPlan',
      required: [true, 'Membership plan is required'],
    },
    status: {
      type: String,
      enum: ['active', 'lapsed', 'suspended', 'cancelled', 'pending'],
      default: 'pending',
    },
    memberNumber: {
      type: String,
      required: true,
    },
    joinDate: {
      type: Date,
      default: Date.now,
    },
    expiryDate: {
      type: Date,
    },
    stripeCustomerId: {
      type: String,
    },
    stripeSubscriptionId: {
      type: String,
    },
    autoRenew: {
      type: Boolean,
      default: true,
    },
    lastPaymentDate: {
      type: Date,
    },
    nextDueDate: {
      type: Date,
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

// One membership per user per tenant
MembershipSchema.index({ user: 1, tenant: 1 }, { unique: true });
MembershipSchema.index({ status: 1, tenant: 1 });
MembershipSchema.index({ memberNumber: 1, tenant: 1 }, { unique: true });
MembershipSchema.index({ nextDueDate: 1 });

// Auto-generate member number before saving
MembershipSchema.pre('save', async function (next) {
  if (!this.isNew) return next();
  // Format: MEM-<tenant-short>-<random>
  const crypto = require('crypto');
  const short = (this.tenant as string).substring(0, 3).toUpperCase();
  const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
  this.memberNumber = `MEM-${short}-${rand}`;
  next();
});

export default mongoose.model<IMembership>('Membership', MembershipSchema);
