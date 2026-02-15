import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  actor: mongoose.Types.ObjectId;
  actorEmail: string;
  actorRole: string;
  action: string;
  category: 'auth' | 'user_management' | 'order' | 'product' | 'vendor' | 'tenant' | 'config' | 'payment' | 'system';
  targetType?: 'user' | 'order' | 'product' | 'vendor' | 'tenant' | 'config' | 'payment';
  targetId?: string;
  targetEmail?: string;
  description: string;
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  metadata?: Record<string, any>;
  ip?: string;
  userAgent?: string;
  device?: {
    type: string;      // desktop, mobile, tablet
    os: string;        // Windows, macOS, iOS, Android, Linux
    browser: string;   // Chrome, Firefox, Safari, etc.
  };
  geolocation?: {
    country?: string;
    region?: string;
    city?: string;
    lat?: number;
    lng?: number;
  };
  tenant: string;
  status: 'success' | 'failure' | 'warning';
  createdAt: Date;
}

const AuditLogSchema: Schema = new Schema(
  {
    actor: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    actorEmail: {
      type: String,
      required: true,
    },
    actorRole: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: ['auth', 'user_management', 'order', 'product', 'vendor', 'tenant', 'config', 'payment', 'system'],
      required: true,
      index: true,
    },
    targetType: {
      type: String,
      enum: ['user', 'order', 'product', 'vendor', 'tenant', 'config', 'payment'],
    },
    targetId: String,
    targetEmail: String,
    description: {
      type: String,
      required: true,
    },
    changes: [
      {
        field: String,
        oldValue: Schema.Types.Mixed,
        newValue: Schema.Types.Mixed,
      },
    ],
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    ip: String,
    userAgent: String,
    device: {
      type: { type: String },
      os: String,
      browser: String,
    },
    geolocation: {
      country: String,
      region: String,
      city: String,
      lat: Number,
      lng: Number,
    },
    tenant: {
      type: String,
      required: true,
      default: 'default',
      index: true,
    },
    status: {
      type: String,
      enum: ['success', 'failure', 'warning'],
      default: 'success',
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
AuditLogSchema.index({ tenant: 1, createdAt: -1 });
AuditLogSchema.index({ tenant: 1, category: 1, createdAt: -1 });
AuditLogSchema.index({ actor: 1, createdAt: -1 });
AuditLogSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });

// Keep audit logs for 2 years (regulatory compliance)
AuditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 730 * 24 * 60 * 60 });

export default mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
