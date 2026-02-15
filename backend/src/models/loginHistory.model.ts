import mongoose, { Schema, Document } from 'mongoose';

export interface ILoginHistory extends Document {
  user: mongoose.Types.ObjectId;
  email: string;
  action: 'login_success' | 'login_failed' | 'logout' | 'password_reset_request' | 'password_reset_complete' | 'account_locked' | 'account_unlocked';
  ip: string;
  userAgent: string;
  device: {
    type: string;      // desktop, mobile, tablet
    os: string;        // Windows 11, macOS, iOS 17, Android 14, Linux
    browser: string;   // Chrome 120, Firefox 121, Safari 17
    isMobile: boolean;
  };
  geolocation?: {
    country?: string;
    region?: string;
    city?: string;
    lat?: number;
    lng?: number;
    timezone?: string;
  };
  sessionId?: string;
  failureReason?: string;
  tenant: string;
  createdAt: Date;
}

const LoginHistorySchema: Schema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    email: {
      type: String,
      required: true,
      index: true,
    },
    action: {
      type: String,
      enum: [
        'login_success',
        'login_failed',
        'logout',
        'password_reset_request',
        'password_reset_complete',
        'account_locked',
        'account_unlocked',
      ],
      required: true,
      index: true,
    },
    ip: {
      type: String,
      default: 'unknown',
    },
    userAgent: {
      type: String,
      default: '',
    },
    device: {
      type: { type: String, default: 'unknown' },
      os: { type: String, default: 'unknown' },
      browser: { type: String, default: 'unknown' },
      isMobile: { type: Boolean, default: false },
    },
    geolocation: {
      country: String,
      region: String,
      city: String,
      lat: Number,
      lng: Number,
      timezone: String,
    },
    sessionId: String,
    failureReason: String,
    tenant: {
      type: String,
      required: true,
      default: 'default',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for login monitoring queries
LoginHistorySchema.index({ tenant: 1, createdAt: -1 });
LoginHistorySchema.index({ user: 1, createdAt: -1 });
LoginHistorySchema.index({ email: 1, action: 1, createdAt: -1 });
LoginHistorySchema.index({ ip: 1, createdAt: -1 });
LoginHistorySchema.index({ action: 1, tenant: 1, createdAt: -1 });

// Keep login history for 1 year
LoginHistorySchema.index({ createdAt: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });

export default mongoose.model<ILoginHistory>('LoginHistory', LoginHistorySchema);
