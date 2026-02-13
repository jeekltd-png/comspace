import mongoose, { Schema, Document } from 'mongoose';

export interface IUserActivity extends Document {
  user?: mongoose.Types.ObjectId;
  sessionId?: string;
  tenant: string;
  action: string;
  category: 'auth' | 'navigation' | 'product' | 'cart' | 'order' | 'review' | 'search' | 'form' | 'admin' | 'system';
  metadata?: Record<string, any>;
  ip?: string;
  userAgent?: string;
  referrer?: string;
  page?: string;
  duration?: number; // milliseconds spent on page/action
  createdAt: Date;
}

const UserActivitySchema: Schema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    sessionId: {
      type: String,
      index: true,
    },
    tenant: {
      type: String,
      required: true,
      default: 'default',
      index: true,
    },
    action: {
      type: String,
      required: true,
      index: true,
      // Examples: 'page_view', 'product_view', 'add_to_cart', 'remove_from_cart',
      // 'checkout_start', 'checkout_complete', 'search', 'login', 'register',
      // 'review_submit', 'form_start', 'form_step', 'form_complete', 'form_abandon'
    },
    category: {
      type: String,
      enum: ['auth', 'navigation', 'product', 'cart', 'order', 'review', 'search', 'form', 'admin', 'system'],
      required: true,
      index: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    ip: String,
    userAgent: String,
    referrer: String,
    page: String,
    duration: Number,
  },
  {
    timestamps: true,
  }
);

// Compound indexes for analytics queries
UserActivitySchema.index({ tenant: 1, action: 1, createdAt: -1 });
UserActivitySchema.index({ tenant: 1, category: 1, createdAt: -1 });
UserActivitySchema.index({ tenant: 1, createdAt: -1 });
UserActivitySchema.index({ user: 1, tenant: 1, createdAt: -1 });

// TTL index: auto-delete raw events older than 90 days (aggregated data stays)
UserActivitySchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export default mongoose.model<IUserActivity>('UserActivity', UserActivitySchema);
